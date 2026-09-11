"""
Structured RAG response schema.
Concept 8 — Structured Output & JSON Response Handling
Concept 31 — Source Citation & Attribution
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ValidationError

from backend.monitoring.logger import get_logger

logger = get_logger(__name__)


class SourceReference(BaseModel):
    """A source citation from the LLM response."""
    document: str
    document_type: str = ""
    page: int = 0
    section: Optional[str] = None


class RAGStructuredResponse(BaseModel):
    """
    The structured output the LLM must return.
    Concept 8 — Structured Output & JSON Response Handling
    """
    answer: str
    has_sufficient_evidence: bool
    sources: List[SourceReference] = Field(default_factory=list)


def parse_llm_response(content: str) -> RAGStructuredResponse:
    """
    Parse LLM JSON response into a validated RAGStructuredResponse.
    Falls back gracefully on parse errors.

    Concept 8 — Structured Output & JSON Response Handling
    """
    # Try to extract JSON from the response
    content = content.strip()

    # Remove markdown code fences if present
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:-1])  # strip first and last ```

    try:
        data = json.loads(content)
        return RAGStructuredResponse(**data)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.warning("response_parse_error", error=str(exc), content=content[:200])

    # Attempt partial extraction
    try:
        import re
        # Try to find JSON object pattern
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            data = json.loads(match.group())
            return RAGStructuredResponse(**data)
    except Exception:
        pass

    # Last resort: treat entire content as plain answer
    has_evidence = "couldn't find" not in content.lower() and "insufficient" not in content.lower()
    return RAGStructuredResponse(
        answer=content,
        has_sufficient_evidence=has_evidence,
        sources=[],
    )


def validate_sources_against_retrieved(
    response: RAGStructuredResponse,
    retrieved_docs: List[str],
) -> RAGStructuredResponse:
    """
    Validate that cited sources actually exist in retrieved documents.
    Removes fabricated citations.
    Concept 33 — Hallucination Guardrails & Refusal Handling
    """
    if not response.sources:
        return response

    validated_sources = []
    retrieved_lower = [d.lower() for d in retrieved_docs]

    for source in response.sources:
        # Check if the cited document was actually retrieved
        cited_lower = source.document.lower()
        if any(cited_lower in r or r in cited_lower for r in retrieved_lower):
            validated_sources.append(source)
        else:
            logger.warning(
                "fabricated_citation_removed",
                document=source.document,
            )

    response.sources = validated_sources
    return response
