"""
Tests for document processing pipeline (loader, cleaner, chunker, metadata, validator).
"""
import pytest
from backend.ingestion.document_loader import RawPage, LoadedDocument
from backend.ingestion.text_cleaner import TextCleaner
from backend.ingestion.chunker import TokenAwareChunker
from backend.ingestion.metadata_extractor import MetadataExtractor, extract_version, extract_effective_date
from backend.ingestion.corpus_validator import CorpusValidator


def test_text_cleaner():
    cleaner = TextCleaner()
    raw = "Page 1 of 5\n\n\nConfidential\nHospital   Internal  Use   Only\n\nClinical Protocol Text.\n------------------"
    cleaned = cleaner.clean(raw)
    assert "Clinical Protocol Text." in cleaned
    assert "Page 1 of 5" not in cleaned
    assert "Confidential" not in cleaned


def test_token_aware_chunker():
    chunker = TokenAwareChunker(chunk_size=100, chunk_overlap=10)
    page = RawPage(
        document_name="test.pdf",
        document_type="clinical_protocol",
        source_path="/path/test.pdf",
        page_number=1,
        raw_text="This is a test clinical protocol document. " * 20,
        total_pages=1,
    )
    chunks = chunker.chunk_pages([page])
    assert len(chunks) > 0
    assert chunks[0].document_name == "test.pdf"
    assert chunks[0].token_count <= 120  # includes overlap margin


def test_metadata_extractor():
    text = "Clinical Protocol Version 2.4\nEffective Date: 12/05/2024\nSection 3.1 - Emergency Response"
    assert extract_version(text) == "2.4"
    assert extract_effective_date(text) == "12/05/2024"

    chunker = TokenAwareChunker()
    page = RawPage(
        document_name="test.pdf",
        document_type="clinical_protocol",
        source_path="/path/test.pdf",
        page_number=1,
        raw_text=text,
        total_pages=1,
    )
    chunks = chunker.chunk_pages([page])
    extractor = MetadataExtractor()
    enriched = extractor.enrich_chunks(chunks, document_header_text=text)
    assert enriched[0].version == "2.4"
    assert enriched[0].effective_date == "12/05/2024"


def test_corpus_validator():
    validator = CorpusValidator()
    report = validator.validate([], [])
    assert report.documents_found == 0
    assert not report.validation_passed
