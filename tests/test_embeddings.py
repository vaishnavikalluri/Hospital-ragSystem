"""
Tests for embedding metrics and validation.
"""
import pytest
from backend.embeddings.embedding_validator import cosine_similarity, EmbeddingValidator
from backend.embeddings.cost_tracker import CostTracker
from backend.app.config import Settings


def test_cosine_similarity():
    vec_a = [1.0, 0.0, 0.0]
    vec_b = [1.0, 0.0, 0.0]
    assert pytest.approx(cosine_similarity(vec_a, vec_b), 0.001) == 1.0

    vec_c = [0.0, 1.0, 0.0]
    assert pytest.approx(cosine_similarity(vec_a, vec_c), 0.001) == 0.0


def test_embedding_validator():
    validator = EmbeddingValidator(model_name="text-embedding-3-small")
    valid_vec = [0.1] * 1536
    errors = validator.validate_single(valid_vec)
    assert len(errors) == 0

    invalid_dim_vec = [0.1] * 500
    errors_dim = validator.validate_single(invalid_dim_vec)
    assert len(errors_dim) == 1

    zero_vec = [0.0] * 1536
    errors_zero = validator.validate_single(zero_vec)
    assert len(errors_zero) == 1


def test_cost_tracker():
    settings = Settings(
        embedding_cost_per_1m_tokens=0.02,
        input_cost_per_1m_tokens=0.15,
        output_cost_per_1m_tokens=0.60,
    )
    tracker = CostTracker(settings)
    tracker.record_embedding_tokens(1_000_000)
    tracker.record_llm_tokens(1_000_000, 1_000_000)

    report = tracker.report()
    assert report["total_tokens"] == 3_000_000
    assert pytest.approx(report["estimated_cost_usd"], 0.001) == 0.77
