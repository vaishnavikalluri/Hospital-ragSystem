"""
Text cleaning pipeline for extracted PDF text.
Concept 11 — Text Extraction & Cleaning Pipeline
"""
from __future__ import annotations

import re
from typing import List

from backend.ingestion.document_loader import RawPage
from backend.monitoring.logger import get_logger

logger = get_logger(__name__)


class TextCleaner:
    """
    Cleans raw extracted text from PDFs.
    Preserves page numbers, headings, and meaningful content.
    """

    # Patterns to remove
    _HEADER_FOOTER_RE = re.compile(
        r"(?m)^(page\s+\d+\s*of\s*\d+|confidential|hospital\s+internal\s+use\s+only)$",
        re.IGNORECASE,
    )
    _EXCESSIVE_WHITESPACE_RE = re.compile(r"\n{3,}")
    _TRAILING_WHITESPACE_RE = re.compile(r"[ \t]+\n")
    _REPEATED_DASH_RE = re.compile(r"-{4,}")
    _REPEATED_UNDERSCORE_RE = re.compile(r"_{4,}")
    _NON_PRINTABLE_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

    def clean(self, text: str) -> str:
        """Apply all cleaning steps to a raw text string."""
        if not text:
            return ""

        # Remove non-printable characters
        text = self._NON_PRINTABLE_RE.sub("", text)

        # Remove common header/footer lines
        text = self._HEADER_FOOTER_RE.sub("", text)

        # Replace repeated dashes/underscores with a single separator
        text = self._REPEATED_DASH_RE.sub("---", text)
        text = self._REPEATED_UNDERSCORE_RE.sub("___", text)

        # Normalize whitespace
        text = self._TRAILING_WHITESPACE_RE.sub("\n", text)
        text = self._EXCESSIVE_WHITESPACE_RE.sub("\n\n", text)

        return text.strip()

    def clean_page(self, page: RawPage) -> RawPage:
        """Return a new RawPage with cleaned text. Original is not mutated."""
        cleaned = self.clean(page.raw_text)
        return RawPage(
            document_name=page.document_name,
            document_type=page.document_type,
            source_path=page.source_path,
            page_number=page.page_number,
            raw_text=cleaned,
            total_pages=page.total_pages,
        )

    def is_empty_page(self, text: str, min_chars: int = 20) -> bool:
        """A page with very few characters after cleaning is considered empty."""
        return len(text.strip()) < min_chars

    def clean_pages(self, pages: List[RawPage]) -> List[RawPage]:
        """Clean and filter empty pages."""
        cleaned = []
        skipped = 0
        for page in pages:
            cp = self.clean_page(page)
            if self.is_empty_page(cp.raw_text):
                skipped += 1
                logger.debug(
                    "empty_page_skipped",
                    doc=page.document_name,
                    page=page.page_number,
                )
            else:
                cleaned.append(cp)
        if skipped:
            logger.info("pages_skipped_empty", count=skipped)
        return cleaned
