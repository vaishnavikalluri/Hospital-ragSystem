"""
Token usage and cost tracking.
Concept 5 — Tokens, Tokenization & Cost Estimation
"""
from __future__ import annotations

from threading import Lock

from backend.app.config import Settings
from backend.monitoring.logger import get_logger

logger = get_logger(__name__)


class CostTracker:
    """
    Tracks token usage and estimates API costs.
    Concept 5 — Tokens, Tokenization & Cost Estimation
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._lock = Lock()
        self._embedding_tokens: int = 0
        self._input_tokens: int = 0
        self._output_tokens: int = 0

    def record_embedding_tokens(self, tokens: int) -> None:
        with self._lock:
            self._embedding_tokens += tokens

    def record_llm_tokens(self, input_tokens: int, output_tokens: int) -> None:
        with self._lock:
            self._input_tokens += input_tokens
            self._output_tokens += output_tokens

    @property
    def total_tokens(self) -> int:
        return self._embedding_tokens + self._input_tokens + self._output_tokens

    @property
    def estimated_cost_usd(self) -> float:
        s = self.settings
        embedding_cost = (self._embedding_tokens / 1_000_000) * s.embedding_cost_per_1m_tokens
        input_cost = (self._input_tokens / 1_000_000) * s.input_cost_per_1m_tokens
        output_cost = (self._output_tokens / 1_000_000) * s.output_cost_per_1m_tokens
        return embedding_cost + input_cost + output_cost

    def report(self) -> dict:
        return {
            "embedding_tokens": self._embedding_tokens,
            "input_tokens": self._input_tokens,
            "output_tokens": self._output_tokens,
            "total_tokens": self.total_tokens,
            "estimated_cost_usd": round(self.estimated_cost_usd, 6),
        }

    def log_report(self) -> None:
        logger.info("cost_report", **self.report())


# Singleton
_tracker: CostTracker | None = None


def get_cost_tracker(settings: Settings | None = None) -> CostTracker:
    global _tracker
    if _tracker is None:
        if settings is None:
            from backend.app.config import get_settings
            settings = get_settings()
        _tracker = CostTracker(settings)
    return _tracker
