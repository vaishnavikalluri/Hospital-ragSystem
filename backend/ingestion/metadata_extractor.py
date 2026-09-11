"""
Metadata extraction for document chunks.
Concept 13 — Chunk Metadata & Source Tracking

Attempts to extract version, effective_date, and section information
from document text where possible.
"""
from __future__ import annotations

import re
from typing import Optional, Tuple

from backend.ingestion.chunker import DocumentChunk
from backend.monitoring.logger import get_logger

logger = get_logger(__name__)

# Regex patterns for common metadata patterns in hospital documents
_VERSION_RE = re.compile(
    r"(?:version|ver|v)[\s.:]+(\d+(?:\.\d+)*)", re.IGNORECASE
)
_DATE_RE = re.compile(
    r"(?:effective|date|issued|valid from)[\s:]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})",
    re.IGNORECASE,
)
_SECTION_RE = re.compile(
    r"^(?:section|sec\.?|§)\s+(\d+(?:\.\d+)*(?:\s+[A-Za-z].{0,60})?)",
    re.IGNORECASE | re.MULTILINE,
)


def extract_version(text: str) -> Optional[str]:
    match = _VERSION_RE.search(text[:1000])  # search in first 1000 chars
    return match.group(1) if match else None


def extract_effective_date(text: str) -> Optional[str]:
    match = _DATE_RE.search(text[:2000])
    return match.group(1) if match else None


def extract_section(text: str) -> Optional[str]:
    """Find the first section heading in the chunk."""
    match = _SECTION_RE.search(text)
    if match:
        return match.group(1).strip()[:100]
    return None


class MetadataExtractor:
    """
    Enriches DocumentChunks with extracted metadata.
    Populates: version, effective_date, section.
    """

    def enrich_chunk(self, chunk: DocumentChunk, document_header_text: str = "") -> DocumentChunk:
        """
        Attempt to extract metadata from chunk text and document header.
        """
        # Try to extract version from the document header first
        if not chunk.version:
            version = extract_version(document_header_text) or extract_version(chunk.text)
            chunk.version = version

        # Extract effective date from header or chunk
        if not chunk.effective_date:
            eff_date = extract_effective_date(document_header_text) or extract_effective_date(chunk.text)
            chunk.effective_date = eff_date

        # Extract section heading from chunk text
        if not chunk.section:
            chunk.section = extract_section(chunk.text)

        return chunk

    def enrich_chunks(
        self,
        chunks: list[DocumentChunk],
        document_header_text: str = "",
    ) -> list[DocumentChunk]:
        """Enrich all chunks in a document."""
        for chunk in chunks:
            self.enrich_chunk(chunk, document_header_text)
        return chunks
