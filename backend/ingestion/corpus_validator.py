"""
Corpus validation before indexing.
Concept 15 — Corpus Preparation & Ingestion Validation

Validates the full set of loaded documents and reports:
- Document count by category
- Pages processed
- Chunk counts
- Empty documents
- Duplicate filenames
- Processing failures
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List

from backend.ingestion.chunker import DocumentChunk
from backend.ingestion.document_loader import LoadedDocument
from backend.monitoring.logger import get_logger

logger = get_logger(__name__)


@dataclass
class CorpusReport:
    documents_found: int = 0
    by_type: Dict[str, int] = field(default_factory=dict)
    pages_processed: int = 0
    chunks_created: int = 0
    failed_documents: List[str] = field(default_factory=list)
    empty_documents: List[str] = field(default_factory=list)
    duplicate_names: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    validation_passed: bool = False

    def print_summary(self) -> None:
        print("\n" + "=" * 50)
        print("  CORPUS VALIDATION REPORT")
        print("=" * 50)
        print(f"  Documents found:   {self.documents_found}")
        for dtype, count in self.by_type.items():
            print(f"    {dtype}: {count}")
        print(f"  Pages processed:   {self.pages_processed}")
        print(f"  Chunks created:    {self.chunks_created}")
        if self.failed_documents:
            print(f"  Failed documents:  {len(self.failed_documents)}")
            for f in self.failed_documents:
                print(f"    [FAILED] {f}")
        if self.empty_documents:
            print(f"  Empty documents:   {len(self.empty_documents)}")
        if self.duplicate_names:
            print(f"  Duplicate names:   {self.duplicate_names}")
        if self.warnings:
            for w in self.warnings:
                print(f"  [WARN] {w}")
        if self.errors:
            for e in self.errors:
                print(f"  [ERROR] {e}")
        status = "[PASSED]" if self.validation_passed else "[FAILED]"
        print(f"\n  Validation: {status}")
        print("=" * 50 + "\n")


class CorpusValidator:
    """
    Validates documents and chunks before indexing.
    Concept 15 — Corpus Preparation & Ingestion Validation
    """

    MIN_CHUNKS_PER_DOC = 1
    MIN_PAGES_PER_DOC = 1

    def validate(
        self,
        loaded_docs: List[LoadedDocument],
        all_chunks: List[DocumentChunk],
    ) -> CorpusReport:
        report = CorpusReport()
        report.documents_found = len(loaded_docs)

        seen_names: Dict[str, int] = {}

        for doc in loaded_docs:
            # Count by type
            dtype = doc.document_type
            report.by_type[dtype] = report.by_type.get(dtype, 0) + 1

            # Detect load errors
            if not doc.loaded_successfully:
                report.failed_documents.append(doc.document_name)
                report.errors.append(
                    f"Failed to load '{doc.document_name}': {doc.load_error}"
                )
                continue

            # Count pages
            report.pages_processed += len(doc.pages)

            # Detect empty documents
            if len(doc.pages) < self.MIN_PAGES_PER_DOC:
                report.empty_documents.append(doc.document_name)
                report.warnings.append(f"Document '{doc.document_name}' has no extractable pages.")

            # Detect duplicates
            name = doc.document_name.lower()
            seen_names[name] = seen_names.get(name, 0) + 1
            if seen_names[name] > 1:
                report.duplicate_names.append(doc.document_name)

        # Count chunks
        report.chunks_created = len(all_chunks)
        doc_chunk_counts: Dict[str, int] = {}
        for chunk in all_chunks:
            doc_chunk_counts[chunk.document_name] = (
                doc_chunk_counts.get(chunk.document_name, 0) + 1
            )

        # Check documents with no chunks
        for doc in loaded_docs:
            if doc.loaded_successfully:
                if doc_chunk_counts.get(doc.document_name, 0) < self.MIN_CHUNKS_PER_DOC:
                    report.warnings.append(
                        f"Document '{doc.document_name}' produced no chunks."
                    )

        # Check for missing chunk metadata
        missing_meta = 0
        for chunk in all_chunks:
            if not chunk.document_name or not chunk.document_type:
                missing_meta += 1
        if missing_meta:
            report.warnings.append(f"{missing_meta} chunks have incomplete metadata.")

        # Pass/fail decision
        has_critical_error = (
            len(report.errors) > 0
            or report.documents_found == 0
        )
        report.validation_passed = not has_critical_error

        logger.info(
            "corpus_validation_complete",
            docs=report.documents_found,
            chunks=report.chunks_created,
            passed=report.validation_passed,
        )
        report.print_summary()
        return report
