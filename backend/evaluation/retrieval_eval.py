"""
Retrieval evaluation: Recall@K, hit rate, precision.
Concept 27 — Retrieval Evaluation & Recall Testing
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

from backend.monitoring.logger import get_logger
from backend.retrieval.retriever import Retriever

logger = get_logger(__name__)

EVAL_DATASET_PATH = Path(__file__).parent / "eval_dataset.json"


@dataclass
class RetrievalEvalResult:
    question_id: str
    question: str
    expected_doc_type: Optional[str]
    expected_keywords: List[str]
    retrieved_doc_types: List[str]
    retrieved_texts: List[str]
    hit: bool  # was expected doc type retrieved?
    keyword_recall: float  # fraction of expected keywords found
    retrieval_time_ms: float
    top_k: int
    notes: str = ""


@dataclass
class RetrievalEvalSummary:
    total: int = 0
    hits: int = 0
    keyword_recall_sum: float = 0.0
    avg_retrieval_time_ms: float = 0.0
    results: List[RetrievalEvalResult] = field(default_factory=list)

    @property
    def hit_rate(self) -> float:
        return self.hits / self.total if self.total else 0.0

    @property
    def avg_keyword_recall(self) -> float:
        return self.keyword_recall_sum / self.total if self.total else 0.0

    def print_report(self) -> None:
        print("\n" + "=" * 60)
        print("  RETRIEVAL EVALUATION REPORT")
        print("=" * 60)
        print(f"  Total questions:    {self.total}")
        print(f"  Hit rate:           {self.hit_rate:.1%}")
        print(f"  Avg keyword recall: {self.avg_keyword_recall:.1%}")
        print(f"  Avg retrieval time: {self.avg_retrieval_time_ms:.1f}ms")
        print("\n  Per-question results:")
        for r in self.results:
            status = "✓" if r.hit else "✗"
            print(
                f"    {status} [{r.question_id}] {r.question[:50]:50} "
                f"kw_recall={r.keyword_recall:.0%}"
            )
        print("=" * 60 + "\n")


class RetrievalEvaluator:
    """
    Evaluates retrieval quality using the eval dataset.
    Concept 27 — Retrieval Evaluation & Recall Testing

    Metrics:
    - Hit rate: was the expected document type retrieved?
    - Keyword recall: fraction of expected keywords found in retrieved text
    - Recall@K: did the correct source appear in top K?
    """

    def __init__(self, retriever: Retriever) -> None:
        self.retriever = retriever

    def load_dataset(self, path: Path = EVAL_DATASET_PATH) -> List[dict]:
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    def evaluate(
        self,
        top_k: int = 5,
        dataset_path: Path = EVAL_DATASET_PATH,
        skip_refusal_tests: bool = False,
    ) -> RetrievalEvalSummary:
        """
        Run retrieval evaluation on the dataset.
        Returns a summary with hit rate and keyword recall.
        """
        dataset = self.load_dataset(dataset_path)
        summary = RetrievalEvalSummary()
        total_time = 0.0

        for item in dataset:
            if item.get("should_refuse") and skip_refusal_tests:
                continue

            start = time.time()
            chunks = self.retriever.retrieve(
                question=item["question"],
                document_type_filter=item.get("expected_document_type"),
                top_k=top_k,
            )
            elapsed = (time.time() - start) * 1000

            retrieved_types = [c.document_type for c in chunks]
            retrieved_texts = " ".join(c.text for c in chunks).lower()

            # Hit: expected doc type in retrieved results
            expected_type = item.get("expected_document_type")
            hit = (
                expected_type is None  # refusal test — skip hit check
                or expected_type in retrieved_types
            )

            # Keyword recall
            keywords = [kw.lower() for kw in item.get("expected_keywords", [])]
            if keywords:
                found = sum(1 for kw in keywords if kw in retrieved_texts)
                kw_recall = found / len(keywords)
            else:
                kw_recall = 1.0  # refusal test

            result = RetrievalEvalResult(
                question_id=item["id"],
                question=item["question"],
                expected_doc_type=expected_type,
                expected_keywords=keywords,
                retrieved_doc_types=retrieved_types,
                retrieved_texts=[c.text[:100] for c in chunks],
                hit=hit,
                keyword_recall=kw_recall,
                retrieval_time_ms=elapsed,
                top_k=top_k,
                notes=item.get("notes", ""),
            )
            summary.results.append(result)
            summary.total += 1
            if hit:
                summary.hits += 1
            summary.keyword_recall_sum += kw_recall
            total_time += elapsed

        summary.avg_retrieval_time_ms = total_time / max(summary.total, 1)
        summary.print_report()

        return summary

    def recall_at_k(
        self, question: str, expected_doc_type: str, k: int
    ) -> bool:
        """Check if expected doc type appears in top-K results."""
        chunks = self.retriever.retrieve(question=question, top_k=k)
        retrieved_types = [c.document_type for c in chunks]
        return expected_doc_type in retrieved_types
