"""
Re-ranking pipeline for precision improvement.
Concept 26 — Chunk Re-Ranking for Precision

Re-ranks initial retrieval results using LLM-based relevance scoring.
This moves the most relevant chunks to the top before context injection.

Flow:
  Top-10 vector results → Re-ranker → Top-5 highest relevance
"""
from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from backend.app.config import Settings
from backend.monitoring.logger import get_logger

if TYPE_CHECKING:
    from backend.retrieval.retriever import RetrievedChunk

logger = get_logger(__name__)


class Reranker:
    """
    Re-ranks retrieved chunks to improve LLM context precision.

    Strategy: Cross-encoder style scoring using OpenAI.
    Each chunk is scored for relevance to the query.
    Top N are returned in ranked order.

    This is a meaningful re-ranking step with measurable improvement
    because it considers the full query context vs. chunk relationship,
    not just embedding similarity.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._llm_client: Optional[object] = None

    def _get_client(self):
        if self._llm_client is None:
            from openai import OpenAI
            if not self.settings.active_api_key:
                return None
            kwargs = {"api_key": self.settings.active_api_key}
            if self.settings.api_base_url:
                kwargs["base_url"] = self.settings.api_base_url
            self._llm_client = OpenAI(**kwargs)
        return self._llm_client

    def rerank(
        self,
        query: str,
        chunks: "List[RetrievedChunk]",
        top_n: int = 5,
    ) -> "List[RetrievedChunk]":
        """
        Score each chunk for relevance to query and return top_n.
        Falls back to hybrid score if LLM scoring fails.
        """
        if not chunks:
            return []

        if len(chunks) <= top_n:
            return sorted(chunks, key=lambda c: c.final_score, reverse=True)

        client = self._get_client()
        if client is None:
            logger.warning("reranker_fallback", reason="no_api_key")
            return sorted(chunks, key=lambda c: c.final_score, reverse=True)[:top_n]

        try:
            scored = self._llm_rerank(client, query, chunks, top_n)
            logger.info(
                "reranking_complete",
                input_chunks=len(chunks),
                output_chunks=len(scored),
            )
            return scored
        except Exception as exc:
            logger.warning("reranker_fallback", reason=str(exc))
            # Graceful fallback to hybrid score
            return sorted(chunks, key=lambda c: c.final_score, reverse=True)[:top_n]

    def _llm_rerank(
        self, client, query: str, chunks: "List[RetrievedChunk]", top_n: int
    ) -> "List[RetrievedChunk]":
        """
        Use OpenAI/Gemini to score each chunk's relevance to the query.
        Returns top_n chunks sorted by LLM-assigned relevance score.
        """
        # Build a prompt that asks the LLM to score each chunk
        chunk_texts = [
            f"[Chunk {i+1}]\n{chunk.text[:400]}"
            for i, chunk in enumerate(chunks[:15])  # limit to 15 for cost
        ]

        prompt = f"""You are a relevance judge for a hospital knowledge assistant.

Query: {query}

Below are retrieved document chunks. Rate each chunk's relevance to the query on a scale of 0-10.
Higher score = more directly relevant to answering the query.
Respond ONLY with a JSON array of numbers: [score1, score2, ...] matching the chunk order.

Chunks:
{chr(10).join(chunk_texts)}

Respond with ONLY the JSON array, no explanation."""

        response = client.chat.completions.create(
            model=self.settings.effective_chat_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=100,
        )

        content = response.choices[0].message.content.strip()

        import json
        import re

        # Extract JSON array from response
        match = re.search(r"\[[\d\s,\.]+\]", content)
        if not match:
            raise ValueError(f"Could not parse reranker scores: {content}")

        scores = json.loads(match.group())

        # Assign LLM scores to chunks
        for i, chunk in enumerate(chunks[:len(scores)]):
            llm_score = scores[i] / 10.0  # normalize to [0, 1]
            # Combine: 50% LLM relevance + 30% semantic + 20% BM25
            chunk.final_score = (
                0.5 * llm_score
                + 0.3 * chunk.similarity
                + 0.2 * chunk.bm25_score
            )

        return sorted(chunks, key=lambda c: c.final_score, reverse=True)[:top_n]
