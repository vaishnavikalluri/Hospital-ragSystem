"""
Retrieval pipeline: Top-K, metadata filtering, hybrid search, re-ranking.
Concept 23 — Similarity Search & Top-K Retrieval
Concept 24 — Metadata Filtering & Hybrid Search
Concept 25 — Retrieval Relevance Tuning
"""
from __future__ import annotations

import math
import time
from typing import Any, Dict, List, Optional

from backend.app.config import Settings
from backend.cache.query_cache import get_embedding_cache, get_query_cache
from backend.embeddings.embedding_client import EmbeddingClient
from backend.monitoring.logger import get_logger
from backend.monitoring.metrics import get_metrics
from backend.retrieval.reranker import Reranker
from backend.vectordb.chroma_client import ChromaClient

logger = get_logger(__name__)


class RetrievedChunk:
    """A single retrieved chunk with relevance score."""

    def __init__(
        self,
        chunk_id: str,
        text: str,
        metadata: Dict[str, Any],
        similarity: float,
        bm25_score: float = 0.0,
        final_score: float = 0.0,
    ) -> None:
        self.chunk_id = chunk_id
        self.text = text
        self.metadata = metadata
        self.similarity = similarity
        self.bm25_score = bm25_score
        self.final_score = final_score

    @property
    def document_name(self) -> str:
        return self.metadata.get("document_name", "")

    @property
    def document_type(self) -> str:
        return self.metadata.get("document_type", "")

    @property
    def page_number(self) -> int:
        return int(self.metadata.get("page_number", 0))

    @property
    def section(self) -> Optional[str]:
        return self.metadata.get("section")


class BM25Scorer:
    """
    Simplified BM25 keyword scorer for hybrid search.
    Concept 24 — Metadata Filtering & Hybrid Search
    """

    K1 = 1.5
    B = 0.75

    def score(self, query_terms: List[str], document: str, avg_doc_len: float) -> float:
        """Compute BM25 score for a single document."""
        doc_terms = document.lower().split()
        doc_len = len(doc_terms)
        score = 0.0

        # Simple TF-IDF-like calculation
        for term in query_terms:
            tf = doc_terms.count(term.lower())
            if tf == 0:
                continue
            # Simplified BM25 without IDF (single doc scoring)
            numerator = tf * (self.K1 + 1)
            denominator = tf + self.K1 * (1 - self.B + self.B * doc_len / max(avg_doc_len, 1))
            score += numerator / denominator

        return score

    def score_batch(
        self, query: str, documents: List[str]
    ) -> List[float]:
        """Score all documents against a query."""
        terms = query.lower().split()
        avg_len = sum(len(d.split()) for d in documents) / max(len(documents), 1)
        return [self.score(terms, doc, avg_len) for doc in documents]


class Retriever:
    """
    End-to-end retrieval pipeline:
    Question → Embed → ChromaDB → Filter → Hybrid Score → Re-rank
    """

    def __init__(
        self,
        settings: Settings,
        chroma_client: ChromaClient,
        embedding_client: EmbeddingClient,
        reranker: Optional[Reranker] = None,
    ) -> None:
        self.settings = settings
        self.chroma = chroma_client
        self.embedder = embedding_client
        self.reranker = reranker or Reranker(settings)
        self.bm25 = BM25Scorer()
        self._emb_cache = get_embedding_cache()
        self._query_cache = get_query_cache()
        self._metrics = get_metrics()

    def retrieve(
        self,
        question: str,
        document_type_filter: Optional[str] = None,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None,
        rerank_top_n: Optional[int] = None,
    ) -> List[RetrievedChunk]:
        """
        Full retrieval pipeline.
        Concept 23 — Top-K retrieval
        Concept 24 — Metadata filtering + hybrid search
        Concept 25 — Configurable parameters
        Concept 26 — Re-ranking
        """
        top_k = top_k or self.settings.top_k
        threshold = similarity_threshold or self.settings.similarity_threshold
        rerank_n = rerank_top_n or self.settings.rerank_top_n

        start_time = time.time()

        # 1. Check query result cache
        cached = self._query_cache.get(question, document_type_filter)
        if cached is not None:
            self._metrics.record_cache(hit=True)
            logger.info("retrieval_cache_hit", question=question[:60])
            return cached

        self._metrics.record_cache(hit=False)

        # 2. Get or compute query embedding
        query_vector = self._get_query_embedding(question)

        # 3. Build metadata filter for ChromaDB
        where_filter = self._build_metadata_filter(document_type_filter)

        # 4. Vector search (initial top-K)
        chroma_results = self.chroma.query(
            query_embedding=query_vector,
            top_k=top_k,
            where=where_filter,
        )

        if not chroma_results:
            logger.info("no_results_found", question=question[:60])
            return []

        # 5. Apply similarity threshold
        filtered = [
            r for r in chroma_results if r["similarity"] >= threshold
        ]

        if not filtered:
            logger.info(
                "results_below_threshold",
                threshold=threshold,
                raw_count=len(chroma_results),
            )
            filtered = chroma_results[:3]  # return at least 3 even below threshold

        # 6. Hybrid scoring: combine semantic + BM25
        chunks = self._build_chunks(filtered)
        chunks = self._apply_hybrid_scoring(question, chunks)

        # 7. Re-ranking
        if self.reranker and len(chunks) > rerank_n:
            chunks = self.reranker.rerank(question, chunks, top_n=rerank_n)
        else:
            chunks = sorted(chunks, key=lambda c: c.final_score, reverse=True)[:rerank_n]

        retrieval_ms = (time.time() - start_time) * 1000
        logger.info(
            "retrieval_complete",
            question=question[:60],
            results=len(chunks),
            retrieval_ms=round(retrieval_ms, 1),
        )

        # Cache the result
        self._query_cache.set(question, document_type_filter, chunks)

        return chunks

    def _get_query_embedding(self, question: str) -> List[float]:
        """Get embedding from cache or compute it."""
        cached_emb = self._emb_cache.get(question)
        if cached_emb is not None:
            return cached_emb

        embedding = self.embedder.embed_query(question)
        self._emb_cache.set(question, embedding)
        return embedding

    def _build_metadata_filter(
        self, document_type_filter: Optional[str]
    ) -> Optional[Dict]:
        """Build ChromaDB where filter."""
        if not document_type_filter:
            return None
        return {"document_type": {"$eq": document_type_filter}}

    def _build_chunks(self, results: List[Dict]) -> List[RetrievedChunk]:
        return [
            RetrievedChunk(
                chunk_id=r["id"],
                text=r["text"],
                metadata=r["metadata"],
                similarity=r["similarity"],
                final_score=r["similarity"],  # initial score = semantic similarity
            )
            for r in results
        ]

    def _apply_hybrid_scoring(
        self, query: str, chunks: List[RetrievedChunk]
    ) -> List[RetrievedChunk]:
        """
        Combine BM25 keyword score with semantic similarity score.
        Concept 24 — Hybrid Search

        Final score = 0.7 * semantic_sim + 0.3 * normalized_bm25
        """
        texts = [c.text for c in chunks]
        bm25_scores = self.bm25.score_batch(query, texts)

        # Normalize BM25 scores to [0, 1]
        max_bm25 = max(bm25_scores) if bm25_scores else 1.0
        if max_bm25 == 0:
            max_bm25 = 1.0

        for chunk, bm25 in zip(chunks, bm25_scores):
            norm_bm25 = bm25 / max_bm25
            chunk.bm25_score = norm_bm25
            # Weighted combination
            chunk.final_score = 0.7 * chunk.similarity + 0.3 * norm_bm25

        return chunks
