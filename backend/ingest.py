"""
Document ingestion CLI.
Usage:
  python -m backend.ingest              # Ingest all documents
  python -m backend.ingest --validate   # Validate without indexing
  python -m backend.ingest --reset      # Reset ChromaDB and re-index all
  python -m backend.ingest --eval       # Run retrieval evaluation after indexing
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Ensure the project root is in the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))


def main():
    parser = argparse.ArgumentParser(
        description="Hospital Knowledge Assistant — Document Ingestion Pipeline"
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Only validate documents, do not index",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Reset ChromaDB collection and re-index all documents",
    )
    parser.add_argument(
        "--eval",
        action="store_true",
        help="Run retrieval evaluation after indexing",
    )
    parser.add_argument(
        "--doc-type",
        choices=["clinical_protocol", "drug_interaction_guideline", "policy_circular"],
        help="Only index documents of this type",
    )
    args = parser.parse_args()

    from backend.app.config import get_settings
    from backend.embeddings.cost_tracker import get_cost_tracker
    from backend.embeddings.embedding_client import EmbeddingClient
    from backend.ingestion.chunker import TokenAwareChunker
    from backend.ingestion.corpus_validator import CorpusValidator
    from backend.ingestion.document_loader import DocumentLoader
    from backend.ingestion.metadata_extractor import MetadataExtractor
    from backend.ingestion.text_cleaner import TextCleaner
    from backend.monitoring.logger import configure_logging
    from backend.vectordb.chroma_client import ChromaClient

    settings = get_settings()
    configure_logging(settings.log_level)

    print("\n[INFO] Hospital Knowledge Assistant — Document Ingestion")
    print("=" * 55)
    print(f"   Documents dir: {settings.documents_dir}")
    print(f"   ChromaDB dir:  {settings.chroma_data_dir}")
    print(f"   Embedding model: {settings.effective_embedding_model}")
    print(f"   Chunk size: {settings.chunk_size} tokens")
    print("=" * 55 + "\n")

    # Load documents
    loader = DocumentLoader(settings.documents_path)
    docs = loader.load_all()

    if not docs:
        print(
            "\n[WARN] No documents found.\n"
            "   Add PDFs to:\n"
            "     data/documents/clinical_protocols/\n"
            "     data/documents/drug_interaction_guidelines/\n"
            "     data/documents/policy_circulars/\n"
        )
        sys.exit(0)

    # Clean
    cleaner = TextCleaner()
    chunker = TokenAwareChunker(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )
    meta_extractor = MetadataExtractor()

    all_chunks = []
    for doc in docs:
        if not doc.loaded_successfully:
            continue
        if args.doc_type and doc.document_type != args.doc_type:
            continue

        cleaned = cleaner.clean_pages(doc.pages)
        if not cleaned:
            continue

        chunks = chunker.chunk_pages(cleaned)
        header = cleaned[0].raw_text if cleaned else ""
        chunks = meta_extractor.enrich_chunks(chunks, header)
        all_chunks.extend(chunks)

    # Validate
    validator = CorpusValidator()
    report = validator.validate(docs, all_chunks)

    if args.validate:
        print("[OK] Validation complete. Run without --validate to index.")
        sys.exit(0 if report.validation_passed else 1)

    if not all_chunks:
        print("[ERROR] No chunks produced. Check document content.")
        sys.exit(1)

    # ChromaDB
    chroma = ChromaClient(settings)
    if args.reset:
        print("[WARN] Resetting ChromaDB collection...")
        chroma.reset_collection()

    # Embed and index
    if not settings.active_api_key:
        print(
            "\n[ERROR] API key is not set.\n"
            "   Set GOOGLE_API_KEY in your .env file and run again.\n"
        )
        sys.exit(1)

    cost_tracker = get_cost_tracker(settings)
    embedding_client = EmbeddingClient(settings, cost_tracker)

    print(f"[INFO] Embedding {len(all_chunks)} chunks...")
    texts = [c.text for c in all_chunks]
    embeddings = embedding_client.embed_texts(texts)

    print("[INFO] Indexing into ChromaDB...")
    chroma.index_chunks(all_chunks, embeddings)

    cost_tracker.log_report()
    total_in_db = chroma.collection_count()
    print(f"\n[OK] Ingestion complete. {total_in_db} total chunks in ChromaDB.\n")

    if args.eval:
        print("🔍 Running retrieval evaluation...")
        from backend.embeddings.embedding_client import EmbeddingClient as EC
        from backend.evaluation.retrieval_eval import RetrievalEvaluator
        from backend.retrieval.retriever import Retriever
        from backend.retrieval.reranker import Reranker

        ec = EC(settings)
        reranker = Reranker(settings)
        retriever = Retriever(settings, chroma, ec, reranker)
        evaluator = RetrievalEvaluator(retriever)
        evaluator.evaluate(top_k=settings.top_k)


if __name__ == "__main__":
    main()
