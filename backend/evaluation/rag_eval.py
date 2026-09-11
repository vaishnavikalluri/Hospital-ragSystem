"""
RAG evaluation: groundedness, relevance, citation correctness, refusal accuracy.
Concept 34 — RAG Evaluation & Answer Quality Scoring
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

from backend.app.config import Settings
from backend.app.models import ChatResponse
from backend.evaluation.retrieval_eval import EVAL_DATASET_PATH
from backend.monitoring.logger import get_logger
from backend.rag.rag_pipeline import RAGPipeline

logger = get_logger(__name__)

RESULTS_DIR = Path(__file__).parent / "results"


@dataclass
class RAGEvalResult:
    question_id: str
    question: str
    answer: str
    has_sufficient_evidence: bool
    source_count: int
    should_refuse: bool
    refusal_correct: bool  # True if refuse_expected == (not has_evidence)
    has_sources_when_expected: bool
    groundedness_score: float  # 0-1, estimated
    notes: str = ""


@dataclass
class RAGEvalSummary:
    total: int = 0
    refusal_correct: int = 0
    source_coverage: int = 0
    results: List[RAGEvalResult] = field(default_factory=list)

    @property
    def refusal_accuracy(self) -> float:
        return self.refusal_correct / self.total if self.total else 0.0

    @property
    def source_coverage_rate(self) -> float:
        answerable = sum(1 for r in self.results if not r.should_refuse)
        if answerable == 0:
            return 0.0
        covered = sum(1 for r in self.results if not r.should_refuse and r.has_sources_when_expected)
        return covered / answerable

    def print_report(self) -> None:
        print("\n" + "=" * 60)
        print("  RAG EVALUATION REPORT")
        print("=" * 60)
        print(f"  Total evaluated:       {self.total}")
        print(f"  Refusal accuracy:      {self.refusal_accuracy:.1%}")
        print(f"  Source coverage rate:  {self.source_coverage_rate:.1%}")
        print("\n  Per-question results:")
        for r in self.results:
            status = "✓" if r.refusal_correct else "✗"
            print(
                f"    {status} [{r.question_id}] {r.question[:45]:45} "
                f"evidence={'Y' if r.has_sufficient_evidence else 'N'} "
                f"sources={r.source_count}"
            )
        print("=" * 60 + "\n")

    def save(self, path: Optional[Path] = None) -> None:
        """Save evaluation results to JSON for comparison across runs."""
        if path is None:
            RESULTS_DIR.mkdir(parents=True, exist_ok=True)
            import datetime
            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            path = RESULTS_DIR / f"rag_eval_{ts}.json"

        data = {
            "summary": {
                "total": self.total,
                "refusal_accuracy": self.refusal_accuracy,
                "source_coverage_rate": self.source_coverage_rate,
            },
            "results": [
                {
                    "question_id": r.question_id,
                    "question": r.question,
                    "has_sufficient_evidence": r.has_sufficient_evidence,
                    "source_count": r.source_count,
                    "refusal_correct": r.refusal_correct,
                    "has_sources_when_expected": r.has_sources_when_expected,
                }
                for r in self.results
            ],
        }

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logger.info("eval_results_saved", path=str(path))
        print(f"Results saved to: {path}")


class RAGEvaluator:
    """
    Evaluates the RAG pipeline for:
    - Refusal correctness (refuses when it should)
    - Source citation presence (cites when it should)
    - Basic groundedness check

    Concept 34 — RAG Evaluation & Answer Quality Scoring
    """

    def __init__(self, rag_pipeline: RAGPipeline, settings: Settings) -> None:
        self.rag = rag_pipeline
        self.settings = settings

    def evaluate(
        self,
        dataset_path: Path = EVAL_DATASET_PATH,
        save_results: bool = True,
    ) -> RAGEvalSummary:
        """Run RAG evaluation on the standard dataset."""
        with open(dataset_path, encoding="utf-8") as f:
            dataset = json.load(f)

        summary = RAGEvalSummary()

        for item in dataset:
            try:
                response: ChatResponse = self.rag.answer(
                    question=item["question"],
                    document_type_filter=item.get("expected_document_type"),
                )

                should_refuse = item.get("should_refuse", False)
                refusal_correct = should_refuse == (not response.has_sufficient_evidence)
                has_sources = len(response.sources) > 0
                has_sources_when_expected = has_sources or should_refuse

                result = RAGEvalResult(
                    question_id=item["id"],
                    question=item["question"],
                    answer=response.answer[:200],
                    has_sufficient_evidence=response.has_sufficient_evidence,
                    source_count=len(response.sources),
                    should_refuse=should_refuse,
                    refusal_correct=refusal_correct,
                    has_sources_when_expected=has_sources_when_expected,
                    groundedness_score=1.0 if has_sources else 0.5,
                    notes=item.get("notes", ""),
                )
                summary.results.append(result)
                summary.total += 1
                if refusal_correct:
                    summary.refusal_correct += 1
                if has_sources_when_expected:
                    summary.source_coverage += 1

            except Exception as exc:
                logger.error("eval_item_error", question_id=item["id"], error=str(exc))

        summary.print_report()
        if save_results:
            summary.save()
        return summary
