"""
OpenAI Embeddings client with batching, retry, and cost tracking.
Concept 16 — Embeddings Fundamentals & Vector Representation
Concept 17 — Generating Embeddings via API
Concept 19 — Batch Embedding & Rate/Cost Management
"""
from __future__ import annotations

import time
from typing import List, Optional

try:
    import tiktoken
except (ImportError, Exception):
    tiktoken = None
from openai import OpenAI, RateLimitError, APIError

from backend.app.config import Settings
from backend.embeddings.cost_tracker import CostTracker
from backend.monitoring.logger import get_logger

logger = get_logger(__name__)

# Retry configuration
MAX_RETRIES = 3
BASE_RETRY_DELAY = 1.0  # seconds


class EmbeddingClient:
    """
    Wraps the OpenAI Embeddings API with:
    - Batch processing (up to 100 texts per call)
    - Exponential backoff retry on rate limits
    - Token counting and cost estimation
    - Embedding validation
    """

    DEFAULT_BATCH_SIZE = 100

    def __init__(self, settings: Settings, cost_tracker: Optional[CostTracker] = None) -> None:
        self.settings = settings
        self.model = settings.effective_embedding_model
        self._client: Optional[OpenAI] = None
        self.cost_tracker = cost_tracker or CostTracker(settings)
        self._tokenizer = None
        if tiktoken is not None:
            try:
                self._tokenizer = tiktoken.get_encoding("cl100k_base")
            except Exception:
                self._tokenizer = None

    def _get_client(self) -> OpenAI:
        if self._client is None:
            if not self.settings.active_api_key:
                raise ValueError(
                    "API key is not set. Please set GOOGLE_API_KEY in your .env file."
                )
            kwargs = {"api_key": self.settings.active_api_key}
            if self.settings.api_base_url:
                kwargs["base_url"] = self.settings.api_base_url
            self._client = OpenAI(**kwargs)
        return self._client

    def count_tokens(self, text: str) -> int:
        """Count tokens in a string using tiktoken or fallback estimation."""
        if self._tokenizer is not None:
            try:
                return len(self._tokenizer.encode(text))
            except Exception:
                pass
        # Fallback approximation: ~4 characters per token
        return max(1, len(text) // 4)

    def embed_texts(
        self,
        texts: List[str],
        batch_size: int = DEFAULT_BATCH_SIZE,
    ) -> List[List[float]]:
        """
        Embed a list of texts in batches.
        Returns list of embedding vectors in the same order as input.
        """
        if not texts:
            return []

        all_embeddings: List[List[float]] = []
        total_tokens = 0

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            batch_embeddings, tokens = self._embed_batch_with_retry(batch)
            all_embeddings.extend(batch_embeddings)
            total_tokens += tokens

        self.cost_tracker.record_embedding_tokens(total_tokens)
        logger.info(
            "embeddings_generated",
            count=len(texts),
            total_tokens=total_tokens,
            model=self.model,
        )
        return all_embeddings

    def embed_query(self, text: str) -> List[float]:
        """Embed a single query text."""
        results = self.embed_texts([text])
        if not results:
            raise ValueError("Embedding generation returned empty result")
        return results[0]

    def _embed_batch_with_retry(
        self, texts: List[str]
    ) -> tuple[List[List[float]], int]:
        """
        Embed a batch with exponential backoff retry.
        Returns (embeddings, token_count).
        """
        client = self._get_client()
        last_error: Optional[Exception] = None

        for attempt in range(MAX_RETRIES):
            try:
                response = client.embeddings.create(
                    model=self.model,
                    input=texts,
                )
                embeddings = [item.embedding for item in response.data]
                # Gemini may not return usage info — fall back to 0
                token_count = getattr(response.usage, "total_tokens", None) or 0
                return embeddings, token_count

            except RateLimitError as exc:
                wait = BASE_RETRY_DELAY * (2 ** attempt)
                logger.warning(
                    "rate_limit_hit",
                    attempt=attempt + 1,
                    wait_seconds=wait,
                )
                time.sleep(wait)
                last_error = exc

            except APIError as exc:
                logger.error("embedding_api_error", error=str(exc), attempt=attempt + 1)
                if attempt < MAX_RETRIES - 1:
                    time.sleep(BASE_RETRY_DELAY * (2 ** attempt))
                last_error = exc

        raise RuntimeError(f"Embedding failed after {MAX_RETRIES} retries: {last_error}")
