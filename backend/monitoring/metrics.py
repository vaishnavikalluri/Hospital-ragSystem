"""
In-memory usage metrics store.
Concept 39 — Usage Monitoring
Tracks: query count, latency, tokens, errors, cache stats, indexing.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from threading import Lock
from typing import List


@dataclass
class MetricsStore:
    _lock: Lock = field(default_factory=Lock, init=False, repr=False)
    _start_time: float = field(default_factory=time.time, init=False, repr=False)

    total_queries: int = 0
    successful_queries: int = 0
    failed_queries: int = 0

    total_tokens_used: int = 0

    # Latency accumulators (ms)
    _total_response_ms: float = 0.0
    _total_retrieval_ms: float = 0.0
    _total_llm_ms: float = 0.0

    documents_indexed: int = 0
    chunks_indexed: int = 0

    cache_hits: int = 0
    cache_misses: int = 0

    auth_attempts: int = 0
    auth_successes: int = 0
    auth_failures: int = 0

    def record_query(
        self,
        *,
        success: bool,
        tokens: int = 0,
        response_ms: float = 0.0,
        retrieval_ms: float = 0.0,
        llm_ms: float = 0.0,
    ) -> None:
        with self._lock:
            self.total_queries += 1
            if success:
                self.successful_queries += 1
            else:
                self.failed_queries += 1
            self.total_tokens_used += tokens
            self._total_response_ms += response_ms
            self._total_retrieval_ms += retrieval_ms
            self._total_llm_ms += llm_ms

    def record_indexing(self, *, docs: int, chunks: int) -> None:
        with self._lock:
            self.documents_indexed += docs
            self.chunks_indexed += chunks

    def record_cache(self, *, hit: bool) -> None:
        with self._lock:
            if hit:
                self.cache_hits += 1
            else:
                self.cache_misses += 1

    def record_auth(self, *, success: bool) -> None:
        with self._lock:
            self.auth_attempts += 1
            if success:
                self.auth_successes += 1
            else:
                self.auth_failures += 1

    @property
    def avg_response_time_ms(self) -> float:
        if self.total_queries == 0:
            return 0.0
        return self._total_response_ms / self.total_queries

    @property
    def avg_retrieval_time_ms(self) -> float:
        if self.total_queries == 0:
            return 0.0
        return self._total_retrieval_ms / self.total_queries

    @property
    def avg_llm_time_ms(self) -> float:
        if self.total_queries == 0:
            return 0.0
        return self._total_llm_ms / self.total_queries

    @property
    def uptime_seconds(self) -> float:
        return time.time() - self._start_time

    def to_dict(self) -> dict:
        return {
            "total_queries": self.total_queries,
            "successful_queries": self.successful_queries,
            "failed_queries": self.failed_queries,
            "total_tokens_used": self.total_tokens_used,
            "avg_response_time_ms": round(self.avg_response_time_ms, 2),
            "avg_retrieval_time_ms": round(self.avg_retrieval_time_ms, 2),
            "avg_llm_time_ms": round(self.avg_llm_time_ms, 2),
            "documents_indexed": self.documents_indexed,
            "chunks_indexed": self.chunks_indexed,
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "auth_attempts": self.auth_attempts,
            "auth_successes": self.auth_successes,
            "auth_failures": self.auth_failures,
            "uptime_seconds": round(self.uptime_seconds, 1),
        }


# Singleton
_metrics = MetricsStore()


def get_metrics() -> MetricsStore:
    return _metrics
