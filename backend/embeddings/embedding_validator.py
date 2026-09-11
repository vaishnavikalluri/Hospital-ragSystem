"""
Embedding quality validation and sanity checks.
Concept 20 — Embedding Quality Checks & Sanity Tests
Concept 18 — Embedding Similarity & Distance Metrics
"""
from __future__ import annotations

import math
from typing import List, Tuple

from backend.monitoring.logger import get_logger

logger = get_logger(__name__)

EXPECTED_DIMS = {
    "text-embedding-3-small": 1536,
    "text-embedding-3-large": 3072,
    "text-embedding-ada-002": 1536,
    "text-embedding-004": 768,
}


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """
    Compute cosine similarity between two vectors.
    Concept 18 — Embedding Similarity & Distance Metrics

    Returns a value in [-1, 1]. Higher = more similar.
    Cosine similarity is used because:
    - Scale-invariant (direction matters, not magnitude)
    - Standard for semantic similarity with OpenAI embeddings
    - Natively supported by ChromaDB's 'cosine' distance
    """
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def euclidean_distance(vec_a: List[float], vec_b: List[float]) -> float:
    """Euclidean distance — lower is more similar."""
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(vec_a, vec_b)))


class EmbeddingValidator:
    """
    Validates generated embeddings for correctness.
    Concept 20 — Embedding Quality Checks & Sanity Tests
    """

    def __init__(self, model_name: str = "text-embedding-3-small") -> None:
        self.expected_dim = EXPECTED_DIMS.get(model_name, 1536)
        self.model_name = model_name

    def validate_single(self, embedding: List[float], label: str = "") -> List[str]:
        """Return list of validation errors for a single embedding."""
        errors = []

        if not embedding:
            errors.append(f"Empty embedding vector{' for ' + label if label else ''}")
            return errors

        if len(embedding) != self.expected_dim:
            errors.append(
                f"Wrong dimension: expected {self.expected_dim}, got {len(embedding)}"
                + (f" for {label}" if label else "")
            )

        if all(v == 0.0 for v in embedding):
            errors.append(f"All-zero embedding vector{' for ' + label if label else ''}")

        return errors

    def validate_batch(
        self, embeddings: List[List[float]], labels: List[str] | None = None
    ) -> Tuple[int, List[str]]:
        """
        Validate a batch of embeddings.
        Returns (valid_count, error_list).
        """
        errors = []
        valid = 0
        for i, emb in enumerate(embeddings):
            label = labels[i] if labels else str(i)
            errs = self.validate_single(emb, label)
            if errs:
                errors.extend(errs)
            else:
                valid += 1
        return valid, errors

    def similarity_sanity_check(
        self,
        embedding_client,
        test_pairs: List[Tuple[str, str, str]],
    ) -> List[dict]:
        """
        Run similarity sanity checks on text pairs.
        test_pairs: list of (text_a, text_b, expected: "high"|"low")
        """
        results = []
        for text_a, text_b, expected in test_pairs:
            emb_a = embedding_client.embed_query(text_a)
            emb_b = embedding_client.embed_query(text_b)
            sim = cosine_similarity(emb_a, emb_b)
            passed = (expected == "high" and sim > 0.7) or (expected == "low" and sim < 0.6)
            result = {
                "text_a": text_a[:50],
                "text_b": text_b[:50],
                "similarity": round(sim, 4),
                "expected": expected,
                "passed": passed,
            }
            results.append(result)
            logger.info("similarity_check", **result)
        return results
