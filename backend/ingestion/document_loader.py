"""
Document discovery and loading.
Concept 10 — Document Loading & Multi-Format Intake

Automatically discovers PDFs in the three document category directories.
Never hardcodes filenames.
Architecture is modular to support additional formats later.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterator, List, Optional, Tuple

import fitz  # PyMuPDF

from backend.monitoring.logger import get_logger

logger = get_logger(__name__)

# Document type mapped from directory name
DOCUMENT_TYPE_MAP: Dict[str, str] = {
    "clinical_protocols": "clinical_protocol",
    "drug_interaction_guidelines": "drug_interaction_guideline",
    "policy_circulars": "policy_circular",
}


@dataclass
class RawPage:
    """A single page extracted from a PDF."""
    document_name: str
    document_type: str
    source_path: str
    page_number: int  # 1-indexed
    raw_text: str
    total_pages: int


@dataclass
class LoadedDocument:
    """All pages from a single PDF."""
    document_name: str
    document_type: str
    source_path: str
    total_pages: int
    pages: List[RawPage] = field(default_factory=list)
    load_error: Optional[str] = None

    @property
    def loaded_successfully(self) -> bool:
        return self.load_error is None and len(self.pages) > 0

    @property
    def file_size_bytes(self) -> int:
        try:
            return Path(self.source_path).stat().st_size
        except OSError:
            return 0


class DocumentLoader:
    """
    Discovers and loads PDFs from the documents directory.
    Concept 10 — Document Loading & Multi-Format Intake
    """

    SUPPORTED_EXTENSIONS = {".pdf"}

    def __init__(self, documents_dir: Path) -> None:
        self.documents_dir = documents_dir

    def discover_documents(self) -> List[Tuple[Path, str]]:
        """
        Recursively discover all PDF files, returning (path, document_type) pairs.
        Supports both predefined categories and any custom category folder.
        """
        found: List[Tuple[Path, str]] = []

        if not self.documents_dir.exists():
            logger.warning("documents_dir_missing", path=str(self.documents_dir))
            return found

        seen_paths = set()
        for pdf_path in sorted(self.documents_dir.glob("**/*.pdf")):
            if pdf_path.is_file() and pdf_path not in seen_paths:
                seen_paths.add(pdf_path)
                parent_name = pdf_path.parent.name
                if parent_name == self.documents_dir.name or not parent_name:
                    doc_type = "general_document"
                else:
                    doc_type = DOCUMENT_TYPE_MAP.get(parent_name, parent_name.rstrip("s"))
                found.append((pdf_path, doc_type))
                logger.debug("pdf_discovered", path=str(pdf_path), doc_type=doc_type)

        logger.info("documents_discovered", total=len(found))
        return found

    def load_document(self, path: Path, document_type: str) -> LoadedDocument:
        """
        Load a single PDF using PyMuPDF.
        Concept 11 — Text Extraction & Cleaning Pipeline
        """
        doc_name = path.name
        pages: List[RawPage] = []
        total_pages = 0

        try:
            pdf = fitz.open(str(path))
            total_pages = len(pdf)

            for page_idx in range(total_pages):
                page = pdf[page_idx]
                text = page.get_text("text")  # plain text extraction

                pages.append(
                    RawPage(
                        document_name=doc_name,
                        document_type=document_type,
                        source_path=str(path),
                        page_number=page_idx + 1,
                        raw_text=text,
                        total_pages=total_pages,
                    )
                )

            pdf.close()
            logger.info("document_loaded", name=doc_name, pages=total_pages)

        except Exception as exc:
            logger.error("document_load_error", name=doc_name, error=str(exc))
            return LoadedDocument(
                document_name=doc_name,
                document_type=document_type,
                source_path=str(path),
                total_pages=0,
                pages=[],
                load_error=str(exc),
            )

        return LoadedDocument(
            document_name=doc_name,
            document_type=document_type,
            source_path=str(path),
            total_pages=total_pages,
            pages=pages,
        )

    def load_all(self) -> List[LoadedDocument]:
        """Load all discovered documents."""
        discovered = self.discover_documents()

        if not discovered:
            logger.warning("no_documents_found", dir=str(self.documents_dir))
            return []

        loaded: List[LoadedDocument] = []
        for path, doc_type in discovered:
            doc = self.load_document(path, doc_type)
            loaded.append(doc)

        successful = sum(1 for d in loaded if d.loaded_successfully)
        failed = len(loaded) - successful
        logger.info("all_documents_loaded", total=len(loaded), successful=successful, failed=failed)
        return loaded

    def load_single(self, path: Path, document_type: Optional[str] = None) -> LoadedDocument:
        """Load a single uploaded document. Infers type from path if not provided."""
        if document_type is None:
            parent = path.parent.name
            document_type = DOCUMENT_TYPE_MAP.get(parent, "clinical_protocol")
        return self.load_document(path, document_type)
