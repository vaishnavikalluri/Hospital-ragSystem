"""
Admin API router — document upload, indexing, metrics.
POST /api/admin/documents/upload  — Upload and index a new PDF
POST /api/admin/documents/index   — Re-index all documents
GET  /api/admin/metrics           — Usage metrics
DELETE /api/admin/documents/{name} — Remove a document

Concept 36 — Document Upload & Indexing Endpoint
Admin-only routes using get_admin_user dependency.
"""
from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from backend.app.config import Settings, get_settings
from backend.app.dependencies import get_admin_user
from backend.app.models import IndexResponse, MetricsResponse, UploadResponse, ValidationSummary
from backend.auth.hospital_auth import TokenPayload
from backend.cache.query_cache import get_query_cache
from backend.embeddings.cost_tracker import get_cost_tracker
from backend.embeddings.embedding_client import EmbeddingClient
from backend.ingestion.chunker import TokenAwareChunker
from backend.ingestion.corpus_validator import CorpusValidator
from backend.ingestion.document_loader import DOCUMENT_TYPE_MAP, DocumentLoader
from backend.ingestion.metadata_extractor import MetadataExtractor
from backend.ingestion.text_cleaner import TextCleaner
from backend.monitoring.logger import get_logger
from backend.monitoring.metrics import get_metrics
from backend.vectordb.chroma_client import ChromaClient

logger = get_logger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])

ALLOWED_CONTENT_TYPES = {"application/pdf"}
MAX_FILE_SIZE_MB = 50


def _get_processing_pipeline(settings: Settings):
    """Build the document processing pipeline."""
    cost_tracker = get_cost_tracker(settings)
    return {
        "loader": DocumentLoader(settings.documents_path),
        "cleaner": TextCleaner(),
        "chunker": TokenAwareChunker(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        ),
        "metadata_extractor": MetadataExtractor(),
        "embedding_client": EmbeddingClient(settings, cost_tracker),
        "chroma": ChromaClient(settings),
        "validator": CorpusValidator(),
    }


@router.post("/documents/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    admin_user: TokenPayload = Depends(get_admin_user),
    settings: Settings = Depends(get_settings),
) -> UploadResponse:
    """
    Admin-only: Upload and immediately index a new PDF document.
    Concept 36 — Document Upload & Indexing Endpoint

    Uses the same pipeline as pre-loaded documents:
    Upload → Validate → Extract → Clean → Chunk → Metadata → Embed → ChromaDB
    """
    # Clean / sanitize document type (supports both standard and any custom categories)
    clean_doc_type = document_type.strip().lower().replace(" ", "_").replace("-", "_")
    if not clean_doc_type:
        clean_doc_type = "general_document"

    # Validate file type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    # Validate filename
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a .pdf extension.",
        )

    logger.info(
        "admin_upload_started",
        admin=admin_user.hospital_id,
        filename=file.filename,
        doc_type=clean_doc_type,
    )

    safe_filename = Path(file.filename).name
    cat_dir_name = next((k for k, v in DOCUMENT_TYPE_MAP.items() if v == clean_doc_type), f"{clean_doc_type}s" if not clean_doc_type.endswith("s") else clean_doc_type)
    target_dir = settings.documents_path / cat_dir_name
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / safe_filename

    content = await file.read()
    # Check file size
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {MAX_FILE_SIZE_MB}MB limit.",
        )

    with open(target_path, "wb") as f:
        f.write(content)

    try:
        pipeline = _get_processing_pipeline(settings)

        # Load the uploaded document
        loaded = pipeline["loader"].load_single(target_path, clean_doc_type)
        if not loaded.loaded_successfully:
            if target_path.exists():
                target_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to extract text from PDF: {loaded.load_error}",
            )

        # Clean
        cleaned_pages = pipeline["cleaner"].clean_pages(loaded.pages)
        if not cleaned_pages:
            if target_path.exists():
                target_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The PDF appears to have no extractable text content.",
            )

        # Override document name to use the uploaded filename
        for page in cleaned_pages:
            page.document_name = safe_filename

        # Chunk
        chunks = pipeline["chunker"].chunk_pages(cleaned_pages)

        # Metadata enrichment
        header_text = cleaned_pages[0].raw_text if cleaned_pages else ""
        chunks = pipeline["metadata_extractor"].enrich_chunks(chunks, header_text)
        for chunk in chunks:
            chunk.document_name = safe_filename

        # Remove existing chunks for this document if re-uploading
        pipeline["chroma"].delete_document(safe_filename)

        # Embed
        texts = [c.text for c in chunks]
        embeddings = pipeline["embedding_client"].embed_texts(texts)

        # Index
        pipeline["chroma"].index_chunks(chunks, embeddings)

        # Invalidate query cache (new document indexed)
        get_query_cache().invalidate_all()

        # Update metrics
        get_metrics().record_indexing(docs=1, chunks=len(chunks))

        logger.info(
            "admin_upload_complete",
            filename=safe_filename,
            chunks=len(chunks),
        )

        return UploadResponse(
            success=True,
            filename=safe_filename,
            document_type=clean_doc_type,
            message=f"Successfully uploaded and indexed '{safe_filename}' ({len(chunks)} chunks).",
            chunk_count=len(chunks),
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("admin_upload_error", error=str(exc))
        if target_path.exists():
            try:
                target_path.unlink()
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload processing failed: {str(exc)}",
        )


@router.post("/documents/index", response_model=IndexResponse)
async def index_all_documents(
    force_reindex: bool = False,
    admin_user: TokenPayload = Depends(get_admin_user),
    settings: Settings = Depends(get_settings),
) -> IndexResponse:
    """
    Admin-only: Trigger full indexing of all pre-loaded documents.
    """
    logger.info("admin_index_started", admin=admin_user.hospital_id, force=force_reindex)

    pipeline = _get_processing_pipeline(settings)
    errors = []

    # Load all documents
    all_docs = pipeline["loader"].load_all()
    if not all_docs:
        return IndexResponse(
            success=True,
            documents_processed=0,
            chunks_created=0,
            errors=[],
            summary="No documents found in the knowledge base directories.",
        )

    total_chunks = 0
    processed_docs = 0

    for doc in all_docs:
        if not doc.loaded_successfully:
            errors.append(f"Failed to load: {doc.document_name} — {doc.load_error}")
            continue

        try:
            # Clean
            cleaned = pipeline["cleaner"].clean_pages(doc.pages)
            if not cleaned:
                errors.append(f"No extractable text in: {doc.document_name}")
                continue

            # Chunk
            chunks = pipeline["chunker"].chunk_pages(cleaned)

            # Metadata
            header = cleaned[0].raw_text if cleaned else ""
            chunks = pipeline["metadata_extractor"].enrich_chunks(chunks, header)

            # If force_reindex, remove existing
            if force_reindex:
                pipeline["chroma"].delete_document(doc.document_name)

            # Embed
            texts = [c.text for c in chunks]
            embeddings = pipeline["embedding_client"].embed_texts(texts)

            # Index
            pipeline["chroma"].index_chunks(chunks, embeddings)

            total_chunks += len(chunks)
            processed_docs += 1

        except Exception as exc:
            err_msg = f"Error processing {doc.document_name}: {str(exc)}"
            errors.append(err_msg)
            logger.error("indexing_doc_error", doc=doc.document_name, error=str(exc))

    # Validate
    all_chunks_flat = []  # For summary purposes
    pipeline["validator"].validate(all_docs, all_chunks_flat)

    # Invalidate query cache
    get_query_cache().invalidate_all()
    get_metrics().record_indexing(docs=processed_docs, chunks=total_chunks)

    return IndexResponse(
        success=len(errors) == 0,
        documents_processed=processed_docs,
        chunks_created=total_chunks,
        errors=errors,
        summary=(
            f"Indexed {processed_docs} documents, {total_chunks} chunks. "
            f"{len(errors)} errors."
        ),
    )


@router.get("/metrics", response_model=MetricsResponse)
async def get_usage_metrics(
    admin_user: TokenPayload = Depends(get_admin_user),
    settings: Settings = Depends(get_settings),
) -> MetricsResponse:
    """Admin-only: Return application usage metrics."""
    metrics = get_metrics()
    chroma = ChromaClient(settings)

    try:
        chunk_count = chroma.collection_count()
        doc_list = chroma.get_document_list()
        doc_count = len(doc_list)
    except Exception:
        chunk_count = 0
        doc_count = 0

    m = metrics.to_dict()
    return MetricsResponse(
        total_queries=m["total_queries"],
        successful_queries=m["successful_queries"],
        failed_queries=m["failed_queries"],
        total_tokens_used=m["total_tokens_used"],
        avg_response_time_ms=m["avg_response_time_ms"],
        avg_retrieval_time_ms=m["avg_retrieval_time_ms"],
        avg_llm_time_ms=m["avg_llm_time_ms"],
        documents_indexed=doc_count,
        chunks_indexed=chunk_count,
        cache_hits=m["cache_hits"],
        cache_misses=m["cache_misses"],
        uptime_seconds=m["uptime_seconds"],
    )


@router.delete("/documents/{document_name}")
async def delete_document(
    document_name: str,
    admin_user: TokenPayload = Depends(get_admin_user),
    settings: Settings = Depends(get_settings),
) -> dict:
    """Admin-only: Remove a document from the knowledge base."""
    chroma = ChromaClient(settings)
    deleted = chroma.delete_document(document_name)

    # Clean up from disk if file exists in documents directory
    for cat_dir in DOCUMENT_TYPE_MAP.keys():
        doc_path = settings.documents_path / cat_dir / document_name
        if doc_path.exists():
            try:
                doc_path.unlink()
                logger.info("admin_document_disk_deleted", path=str(doc_path))
            except Exception as e:
                logger.warning("admin_document_disk_delete_failed", path=str(doc_path), error=str(e))

    if deleted == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_name}' not found in knowledge base.",
        )

    get_query_cache().invalidate_all()
    logger.info("admin_document_deleted", name=document_name, chunks=deleted, admin=admin_user.hospital_id)

    return {"message": f"Deleted '{document_name}' ({deleted} chunks removed)."}
