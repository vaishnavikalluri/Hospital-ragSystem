"""
Tests for retrieval pipeline components (BM25, metadata filtering, retrieved chunk models).
"""
import pytest
from backend.retrieval.retriever import BM25Scorer, RetrievedChunk


def test_bm25_scorer():
    scorer = BM25Scorer()
    docs = [
        "Clinical protocol for cardiac arrest and resuscitation in the ICU",
        "Drug interaction guidelines for Warfarin and Aspirin",
        "Hospital policy circular regarding staff attendance and leave",
    ]
    query = "cardiac arrest protocol"
    scores = scorer.score_batch(query, docs)

    assert len(scores) == 3
    assert scores[0] > scores[1]
    assert scores[0] > scores[2]


def test_retrieved_chunk_model():
    chunk = RetrievedChunk(
        chunk_id="chunk_123",
        text="Sample text content",
        metadata={
            "document_name": "Protocol_ICU.pdf",
            "document_type": "clinical_protocol",
            "page_number": 3,
            "section": "Section 2",
        },
        similarity=0.85,
        bm25_score=0.6,
        final_score=0.775,
    )
    assert chunk.document_name == "Protocol_ICU.pdf"
    assert chunk.document_type == "clinical_protocol"
    assert chunk.page_number == 3
    assert chunk.section == "Section 2"
