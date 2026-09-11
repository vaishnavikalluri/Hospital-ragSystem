"""
Documents API router.
GET /api/documents — List all indexed documents
Concept 35 — Backend API
"""
from __future__ import annotations

from pathlib import Path
from typing import Dict, List

from fastapi import APIRouter, Depends

from backend.app.config import Settings, get_settings
from backend.app.dependencies import get_current_user
from backend.app.models import DocumentInfo, DocumentListResponse
from backend.auth.hospital_auth import TokenPayload
from backend.ingestion.document_loader import DOCUMENT_TYPE_MAP, DocumentLoader
from backend.monitoring.logger import get_logger
from backend.vectordb.chroma_client import ChromaClient

logger = get_logger(__name__)
router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: TokenPayload = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> DocumentListResponse:
    """
    Return list of all indexed documents with metadata.
    Documents are dynamically loaded — no hardcoded filenames.
    """
    chroma = ChromaClient(settings)

    try:
        indexed_docs = chroma.get_document_list()
    except Exception as exc:
        logger.error("document_list_error", error=str(exc))
        indexed_docs = []

    # Also discover files on disk (even if not yet indexed)
    loader = DocumentLoader(settings.documents_path)
    discovered = loader.discover_documents()
    discovered_names = {path.name for path, _ in discovered}
    indexed_names = {d["document_name"] for d in indexed_docs}

    # Build DocumentInfo list
    docs: List[DocumentInfo] = []
    by_type: Dict[str, int] = {}

    # Indexed documents
    for doc in indexed_docs:
        doc_type = doc.get("document_type", "unknown")
        by_type[doc_type] = by_type.get(doc_type, 0) + 1

        # Try to get file size from disk
        file_size = 0
        for path, dtype in discovered:
            if path.name == doc["document_name"]:
                try:
                    file_size = path.stat().st_size
                except OSError:
                    pass
                break

        docs.append(
            DocumentInfo(
                name=doc["document_name"],
                document_type=doc_type,
                page_count=0,  # Not stored in ChromaDB metadata
                chunk_count=doc.get("chunk_count", 0),
                file_size_bytes=file_size,
                indexed=True,
            )
        )

    # Discovered but not yet indexed
    for path, doc_type in discovered:
        if path.name not in indexed_names:
            by_type[doc_type] = by_type.get(doc_type, 0) + 1
            docs.append(
                DocumentInfo(
                    name=path.name,
                    document_type=doc_type,
                    page_count=0,
                    chunk_count=0,
                    file_size_bytes=path.stat().st_size if path.exists() else 0,
                    indexed=False,
                )
            )

    return DocumentListResponse(
        documents=docs,
        total=len(docs),
        by_type=by_type,
    )
