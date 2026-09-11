"""
Token-aware document chunking.
Concept 12 — Document Chunking Strategies
Concept 14 — Token-Aware Chunk Sizing & Overlap

Uses tiktoken to count tokens, respects CHUNK_SIZE and CHUNK_OVERLAP settings.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import List, Optional

import tiktoken

from backend.ingestion.document_loader import RawPage
from backend.monitoring.logger import get_logger

logger = get_logger(__name__)


@dataclass
class DocumentChunk:
    """
    A processed text chunk with full metadata for ChromaDB storage.
    Concept 13 — Chunk Metadata & Source Tracking
    """
    chunk_id: str
    text: str
    document_name: str
    document_type: str
    source_path: str
    page_number: int
    chunk_index: int        # chunk number within the document
    total_chunks: int       # total chunks in this document (updated after chunking)
    token_count: int
    # Optional metadata populated when available
    section: Optional[str] = None
    version: Optional[str] = None
    effective_date: Optional[str] = None


class TokenAwareChunker:
    """
    Splits cleaned pages into token-aware chunks with configurable overlap.

    Strategy:
    1. For each page, split text into sentences/paragraphs.
    2. Accumulate until token budget hit, then create a chunk.
    3. Overlap: retain last N tokens from previous chunk.
    """

    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 64,
        model_name: str = "cl100k_base",  # used by text-embedding-3-small
    ) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        try:
            self._enc = tiktoken.get_encoding(model_name)
        except Exception:
            self._enc = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """Count the number of tokens in a string."""
        return len(self._enc.encode(text))

    def _split_into_sentences(self, text: str) -> List[str]:
        """
        Split text into logical units (sentences / paragraphs).
        Prefers paragraph splits, falls back to sentence splits.
        """
        # Split on double newlines first (paragraph-level)
        paras = [p.strip() for p in text.split("\n\n") if p.strip()]
        if not paras:
            return [text]

        # If any paragraph is very long, split on single newlines too
        units: List[str] = []
        for para in paras:
            if self.count_tokens(para) > self.chunk_size * 2:
                lines = [ln.strip() for ln in para.split("\n") if ln.strip()]
                units.extend(lines)
            else:
                units.append(para)
        return units

    def chunk_page(self, page: RawPage, doc_chunk_offset: int = 0) -> List[DocumentChunk]:
        """
        Chunk a single page into token-bounded pieces.
        """
        text = page.raw_text.strip()
        if not text:
            return []

        units = self._split_into_sentences(text)
        chunks: List[DocumentChunk] = []

        current_units: List[str] = []
        current_tokens: int = 0
        overlap_buffer: str = ""

        for unit in units:
            unit_tokens = self.count_tokens(unit)

            # If a single unit exceeds chunk_size, split it hard
            if unit_tokens > self.chunk_size:
                tokens = self._enc.encode(unit)
                for start in range(0, len(tokens), self.chunk_size - self.chunk_overlap):
                    segment_tokens = tokens[start : start + self.chunk_size]
                    segment_text = self._enc.decode(segment_tokens)
                    chunk = self._make_chunk(
                        text=segment_text,
                        page=page,
                        idx=doc_chunk_offset + len(chunks),
                        token_count=len(segment_tokens),
                    )
                    chunks.append(chunk)
                continue

            # If adding this unit exceeds budget, flush
            if current_tokens + unit_tokens > self.chunk_size and current_units:
                chunk_text = "\n\n".join(current_units)
                if overlap_buffer:
                    chunk_text = overlap_buffer + "\n\n" + chunk_text
                chunk = self._make_chunk(
                    text=chunk_text.strip(),
                    page=page,
                    idx=doc_chunk_offset + len(chunks),
                    token_count=self.count_tokens(chunk_text),
                )
                chunks.append(chunk)

                # Build overlap from end of current chunk
                overlap_text = "\n\n".join(current_units[-2:])
                overlap_tokens = self.count_tokens(overlap_text)
                if overlap_tokens <= self.chunk_overlap:
                    overlap_buffer = overlap_text
                else:
                    overlap_buffer = ""
                current_units = []
                current_tokens = 0

            current_units.append(unit)
            current_tokens += unit_tokens

        # Flush remaining
        if current_units:
            chunk_text = "\n\n".join(current_units)
            if overlap_buffer and not chunk_text.startswith(overlap_buffer):
                chunk_text = overlap_buffer + "\n\n" + chunk_text
            chunk = self._make_chunk(
                text=chunk_text.strip(),
                page=page,
                idx=doc_chunk_offset + len(chunks),
                token_count=self.count_tokens(chunk_text),
            )
            chunks.append(chunk)

        return chunks

    def _make_chunk(self, text: str, page: RawPage, idx: int, token_count: int) -> DocumentChunk:
        return DocumentChunk(
            chunk_id=str(uuid.uuid4()),
            text=text,
            document_name=page.document_name,
            document_type=page.document_type,
            source_path=page.source_path,
            page_number=page.page_number,
            chunk_index=idx,
            total_chunks=0,  # updated after all chunks generated
            token_count=token_count,
        )

    def chunk_pages(self, pages: List[RawPage]) -> List[DocumentChunk]:
        """
        Chunk all pages of a document.
        Updates total_chunks on each chunk after processing.
        """
        all_chunks: List[DocumentChunk] = []
        for page in pages:
            page_chunks = self.chunk_page(page, doc_chunk_offset=len(all_chunks))
            all_chunks.extend(page_chunks)

        # Update total_chunks
        total = len(all_chunks)
        for chunk in all_chunks:
            chunk.total_chunks = total

        logger.debug(
            "chunks_created",
            doc=pages[0].document_name if pages else "unknown",
            chunks=total,
        )
        return all_chunks
