"""
Query result caching.
Concept 39 — Caching

Implements:
- SHA256-keyed LRU cache for embedding vectors
- TTL-aware query result cache (invalidated on new indexing)
"""
from __future__ import annotations

import hashlib
import json
import time
from threading import Lock
from typing import Any, Dict, List, Optional, Tuple


class EmbeddingCache:
    """
    Thread-safe LRU cache for query embeddings.
    Avoids re-embedding the same query text.
    """

    def __init__(self, maxsize: int = 512) -> None:
        self._cache: Dict[str, List[float]] = {}
        self._order: List[str] = []
        self._maxsize = maxsize
        self._lock = Lock()

    @staticmethod
    def _key(text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def get(self, text: str) -> Optional[List[float]]:
        key = self._key(text)
        with self._lock:
            if key in self._cache:
                # Move to end (most recently used)
                self._order.remove(key)
                self._order.append(key)
                return self._cache[key]
        return None

    def set(self, text: str, vector: List[float]) -> None:
        key = self._key(text)
        with self._lock:
            if key in self._cache:
                self._order.remove(key)
            elif len(self._order) >= self._maxsize:
                # Evict LRU entry
                oldest = self._order.pop(0)
                del self._cache[oldest]
            self._cache[key] = vector
            self._order.append(key)

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()
            self._order.clear()

    @property
    def size(self) -> int:
        return len(self._cache)


class QueryResultCache:
    """
    TTL-based cache for full retrieval results.
    Keyed on (question, document_type_filter).
    Invalidated when documents are re-indexed.
    """

    def __init__(self, ttl_seconds: int = 300, maxsize: int = 256) -> None:
        self._cache: Dict[str, Tuple[Any, float]] = {}  # key -> (value, timestamp)
        self._ttl = ttl_seconds
        self._maxsize = maxsize
        self._lock = Lock()
        self._index_version: int = 0  # incremented on each indexing run

    @staticmethod
    def _key(question: str, doc_filter: Optional[str]) -> str:
        raw = json.dumps({"q": question, "f": doc_filter}, sort_keys=True)
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def get(self, question: str, doc_filter: Optional[str] = None) -> Optional[Any]:
        key = self._key(question, doc_filter)
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return None
            value, ts = entry
            if time.time() - ts > self._ttl:
                del self._cache[key]
                return None
            return value

    def set(self, question: str, doc_filter: Optional[str], value: Any) -> None:
        key = self._key(question, doc_filter)
        with self._lock:
            if len(self._cache) >= self._maxsize:
                # Evict oldest entry
                oldest_key = min(self._cache, key=lambda k: self._cache[k][1])
                del self._cache[oldest_key]
            self._cache[key] = (value, time.time())

    def invalidate_all(self) -> None:
        """Called after document indexing to prevent stale retrieval results."""
        with self._lock:
            self._cache.clear()
            self._index_version += 1

    @property
    def size(self) -> int:
        return len(self._cache)


# Singletons
_embedding_cache = EmbeddingCache()
_query_cache = QueryResultCache()


def get_embedding_cache() -> EmbeddingCache:
    return _embedding_cache


def get_query_cache() -> QueryResultCache:
    return _query_cache
