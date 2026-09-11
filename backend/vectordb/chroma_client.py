"""
ChromaDB vector database client.
Concept 21 — Vector Database Setup & Collection Design
Concept 22 — Indexing Embeddings & Metadata Storage
"""
from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import chromadb
from chromadb.config import Settings as ChromaSettings

from backend.app.config import Settings
from backend.ingestion.chunker import DocumentChunk
from backend.monitoring.logger import get_logger

logger = get_logger(__name__)


class ChromaClient:
    """
    Manages the ChromaDB collection for hospital documents.

    Distance metric: cosine similarity
    - Scale-invariant, standard for OpenAI embeddings
    - ChromaDB stores as 'cosine' distance (1 - cosine_sim)

    Collection stores:
    - embeddings (vectors)
    - documents (chunk text)
    - metadata (source, type, page, chunk_id, etc.)
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.collection_name = settings.chroma_collection_name
        self._client: Optional[chromadb.Client] = None
        self._collection: Optional[Any] = None

    def _get_client(self) -> chromadb.Client:
        if self._client is None:
            if self.settings.use_local_chroma:
                # Local persistent storage
                data_dir = Path(self.settings.chroma_data_dir)
                data_dir.mkdir(parents=True, exist_ok=True)
                self._client = chromadb.PersistentClient(
                    path=str(data_dir),
                    settings=ChromaSettings(anonymized_telemetry=False),
                )
                logger.info("chroma_local_client_initialized", path=str(data_dir))
            else:
                # Remote ChromaDB server
                self._client = chromadb.HttpClient(
                    host=self.settings.chroma_host,
                    port=self.settings.chroma_port,
                    settings=ChromaSettings(anonymized_telemetry=False),
                )
                logger.info(
                    "chroma_remote_client_initialized",
                    host=self.settings.chroma_host,
                    port=self.settings.chroma_port,
                )
        return self._client

    def get_collection(self) -> Any:
        if self._collection is None:
            client = self._get_client()
            self._collection = client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"},  # use cosine distance
            )
            logger.info(
                "chroma_collection_ready",
                name=self.collection_name,
                count=self._collection.count(),
            )
        return self._collection

    def index_chunks(
        self,
        chunks: List[DocumentChunk],
        embeddings: List[List[float]],
    ) -> None:
        """
        Upsert chunks and their embeddings into ChromaDB.
        Concept 22 — Indexing Embeddings & Metadata Storage
        """
        if not chunks:
            logger.warning("no_chunks_to_index")
            return

        collection = self.get_collection()

        ids = []
        docs = []
        metas = []
        embeds = []

        for chunk, embedding in zip(chunks, embeddings):
            ids.append(chunk.chunk_id)
            docs.append(chunk.text)
            metas.append(self._chunk_to_metadata(chunk))
            embeds.append(embedding)

        # Upsert in batches of 500 (ChromaDB limit)
        batch_size = 500
        for i in range(0, len(ids), batch_size):
            collection.upsert(
                ids=ids[i : i + batch_size],
                documents=docs[i : i + batch_size],
                metadatas=metas[i : i + batch_size],
                embeddings=embeds[i : i + batch_size],
            )
            logger.debug("chroma_batch_upserted", batch=i // batch_size + 1)

        logger.info("chroma_indexed", chunks=len(chunks))

    def _chunk_to_metadata(self, chunk: DocumentChunk) -> Dict[str, Any]:
        """Convert chunk to ChromaDB-compatible metadata dict (strings/ints/floats only)."""
        meta: Dict[str, Any] = {
            "document_name": chunk.document_name,
            "document_type": chunk.document_type,
            "source_path": chunk.source_path,
            "page_number": chunk.page_number,
            "chunk_index": chunk.chunk_index,
            "token_count": chunk.token_count,
        }
        # Optional fields — only include if present
        if chunk.section:
            meta["section"] = chunk.section
        if chunk.version:
            meta["version"] = chunk.version
        if chunk.effective_date:
            meta["effective_date"] = chunk.effective_date
        return meta

    def query(
        self,
        query_embedding: List[float],
        top_k: int = 10,
        where: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Semantic search with optional metadata filter.
        Concept 23 — Similarity Search & Top-K Retrieval
        Concept 24 — Metadata Filtering & Hybrid Search
        Returns list of result dicts with text, metadata, distance.
        """
        collection = self.get_collection()

        kwargs: Dict[str, Any] = {
            "query_embeddings": [query_embedding],
            "n_results": min(top_k, max(collection.count(), 1)),
            "include": ["documents", "metadatas", "distances"],
        }
        if where:
            kwargs["where"] = where

        try:
            results = collection.query(**kwargs)
        except Exception as exc:
            logger.error("chroma_query_error", error=str(exc))
            return []

        hits = []
        ids = results.get("ids", [[]])[0]
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        dists = results.get("distances", [[]])[0]

        for doc_id, text, meta, dist in zip(ids, docs, metas, dists):
            hits.append(
                {
                    "id": doc_id,
                    "text": text,
                    "metadata": meta,
                    "distance": dist,
                    "similarity": 1.0 - dist,  # cosine distance → similarity
                }
            )
        return hits

    def delete_document(self, document_name: str) -> int:
        """Delete all chunks for a document. Returns number deleted."""
        collection = self.get_collection()
        try:
            results = collection.get(
                where={"document_name": document_name},
                include=["metadatas"],
            )
            ids = results.get("ids", [])
            if ids:
                collection.delete(ids=ids)
                logger.info("chroma_document_deleted", name=document_name, chunks=len(ids))
            return len(ids)
        except Exception as exc:
            logger.error("chroma_delete_error", error=str(exc))
            return 0

    def get_document_list(self) -> List[Dict[str, Any]]:
        """
        Return a deduplicated list of indexed documents with metadata.
        """
        collection = self.get_collection()
        try:
            total = collection.count()
            if total == 0:
                return []

            results = collection.get(include=["metadatas"])
            metas = results.get("metadatas", [])

            # Deduplicate by document_name
            seen: Dict[str, Dict] = {}
            for meta in metas:
                name = meta.get("document_name", "")
                if name not in seen:
                    seen[name] = {
                        "document_name": name,
                        "document_type": meta.get("document_type", ""),
                        "chunk_count": 1,
                        "version": meta.get("version"),
                        "effective_date": meta.get("effective_date"),
                    }
                else:
                    seen[name]["chunk_count"] += 1

            return list(seen.values())
        except Exception as exc:
            logger.error("chroma_list_error", error=str(exc))
            return []

    def collection_count(self) -> int:
        """Return total number of chunks in the collection."""
        try:
            return self.get_collection().count()
        except Exception:
            return 0

    def reset_collection(self) -> None:
        """Delete and recreate the collection (use with care)."""
        client = self._get_client()
        try:
            client.delete_collection(self.collection_name)
            logger.warning("chroma_collection_deleted", name=self.collection_name)
        except Exception:
            pass
        self._collection = None
        self.get_collection()
