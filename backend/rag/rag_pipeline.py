"""
End-to-end RAG pipeline.
Concept 28 — RAG Pipeline Architecture & Flow Design
Concept 29 — Context Injection & Prompt Augmentation
Concept 30 — Grounded Answer Generation
Concept 32 — Conversational RAG & Follow-Up Context
Concept 33 — Hallucination Guardrails & Refusal Handling
"""
from __future__ import annotations

import time
from typing import AsyncGenerator, Dict, Iterator, List, Optional

from openai import OpenAI

from backend.app.config import Settings
from backend.app.models import ChatMessage, ChatResponse, SourceCitation
from backend.embeddings.cost_tracker import get_cost_tracker
from backend.monitoring.logger import get_logger
from backend.monitoring.metrics import get_metrics
from backend.rag.context_manager import ContextManager
from backend.rag.prompt_templates import (
    CONVERSATIONAL_RAG_PROMPT_TEMPLATE,
    RAG_SYSTEM_PROMPT,
    RAG_USER_PROMPT_TEMPLATE,
    build_context_section,
    format_conversation_history,
)
from backend.rag.response_schema import (
    RAGStructuredResponse,
    parse_llm_response,
    validate_sources_against_retrieved,
)
from backend.retrieval.retriever import RetrievedChunk, Retriever

logger = get_logger(__name__)


class RAGPipeline:
    """
    Complete RAG pipeline integrating retrieval, context injection,
    grounded generation, and citation validation.

    Concept 28 — RAG Pipeline Architecture & Flow Design
    """

    def __init__(
        self,
        settings: Settings,
        retriever: Retriever,
    ) -> None:
        self.settings = settings
        self.retriever = retriever
        self.context_mgr = ContextManager(
            model_name=settings.effective_chat_model,
            max_context_tokens=settings.max_context_tokens,
        )
        self._llm: Optional[OpenAI] = None
        self._metrics = get_metrics()
        self._cost_tracker = get_cost_tracker(settings)

    def _get_llm(self) -> OpenAI:
        if self._llm is None:
            if not self.settings.active_api_key:
                raise ValueError("API key is not configured. Set GOOGLE_API_KEY in .env")
            kwargs = {"api_key": self.settings.active_api_key}
            if self.settings.api_base_url:
                kwargs["base_url"] = self.settings.api_base_url
            self._llm = OpenAI(**kwargs)
        return self._llm

    def _chunks_to_dicts(self, chunks: List[RetrievedChunk]) -> List[dict]:
        return [
            {
                "id": c.chunk_id,
                "text": c.text,
                "metadata": c.metadata,
                "similarity": c.similarity,
            }
            for c in chunks
        ]

    def answer(
        self,
        question: str,
        conversation_history: Optional[List[ChatMessage]] = None,
        document_type_filter: Optional[str] = None,
    ) -> ChatResponse:
        """
        Full RAG pipeline for a single question.
        Returns a structured ChatResponse with answer + citations.
        """
        total_start = time.time()

        # 1. Retrieval
        retrieval_start = time.time()
        chunks = self.retriever.retrieve(
            question=question,
            document_type_filter=document_type_filter,
        )
        retrieval_ms = (time.time() - retrieval_start) * 1000

        # 2. No documents in KB
        if self.retriever.chroma.collection_count() == 0:
            return ChatResponse(
                answer=(
                    "The hospital knowledge base is currently empty. "
                    "No documents have been indexed yet. "
                    "Please contact an administrator to load documents."
                ),
                has_sufficient_evidence=False,
                sources=[],
            )

        # 3. Context construction with token management
        chunk_dicts = self._chunks_to_dicts(chunks)
        fitted_chunks = self.context_mgr.fit_context_chunks(chunk_dicts)
        context_text = build_context_section(fitted_chunks)

        # 4. Build messages
        history = conversation_history or []
        trimmed_history = self.context_mgr.trim_history(
            [{"role": m.role, "content": m.content} for m in history]
        )

        if trimmed_history:
            user_content = CONVERSATIONAL_RAG_PROMPT_TEMPLATE.substitute(
                history=format_conversation_history(trimmed_history),
                context=context_text,
                question=question,
            )
        else:
            user_content = RAG_USER_PROMPT_TEMPLATE.substitute(
                context=context_text,
                question=question,
            )

        messages = [
            {"role": "system", "content": RAG_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]

        # 5. LLM call
        llm_start = time.time()
        raw_response, input_tokens, output_tokens = self._call_llm(messages)
        llm_ms = (time.time() - llm_start) * 1000

        # 6. Parse structured output
        structured: RAGStructuredResponse = parse_llm_response(raw_response)

        # 7. Validate citations against retrieved documents
        retrieved_doc_names = [c["metadata"].get("document_name", "") for c in fitted_chunks]
        structured = validate_sources_against_retrieved(structured, retrieved_doc_names)

        # 8. Enrich source citations with metadata from retrieved chunks
        enriched_sources = self._enrich_sources(structured, fitted_chunks)

        # 9. Track metrics
        total_ms = (time.time() - total_start) * 1000
        self._metrics.record_query(
            success=True,
            tokens=input_tokens + output_tokens,
            response_ms=total_ms,
            retrieval_ms=retrieval_ms,
            llm_ms=llm_ms,
        )
        self._cost_tracker.record_llm_tokens(input_tokens, output_tokens)

        logger.info(
            "rag_answer_complete",
            question=question[:60],
            has_evidence=structured.has_sufficient_evidence,
            sources=len(enriched_sources),
            total_ms=round(total_ms, 1),
        )

        return ChatResponse(
            answer=structured.answer,
            has_sufficient_evidence=structured.has_sufficient_evidence,
            sources=enriched_sources,
            retrieval_count=len(chunks),
            model_used=self.settings.effective_chat_model,
            tokens_used=input_tokens + output_tokens,
        )

    def _call_llm(self, messages: List[dict]) -> tuple[str, int, int]:
        """
        Call the OpenAI chat completion API.
        Returns (content, input_tokens, output_tokens).
        Concept 3 — LLM API Access & First Completion Call
        """
        client = self._get_llm()
        response = client.chat.completions.create(
            model=self.settings.effective_chat_model,
            messages=messages,
            temperature=self.settings.openai_temperature,
            max_tokens=self.settings.openai_max_tokens,
            top_p=self.settings.openai_top_p,
        )
        content = response.choices[0].message.content or ""
        usage = response.usage
        return content, getattr(usage, "prompt_tokens", 0), getattr(usage, "completion_tokens", 0)

    def stream_answer(
        self,
        question: str,
        conversation_history: Optional[List[ChatMessage]] = None,
        document_type_filter: Optional[str] = None,
    ) -> Iterator[str]:
        """
        Stream the RAG answer as Server-Sent Events.
        Concept 38 — Streaming Responses & Citation Display

        Yields SSE-formatted strings:
        - data: {"type": "token", "content": "..."}
        - data: {"type": "sources", "sources": [...]}
        - data: {"type": "done"}
        """
        import json

        # Retrieve context (non-streaming)
        chunks = self.retriever.retrieve(
            question=question,
            document_type_filter=document_type_filter,
        )

        if self.retriever.chroma.collection_count() == 0:
            yield f"data: {json.dumps({'type': 'error', 'content': 'Knowledge base is empty. No documents have been indexed yet.'})}\n\n"
            yield "data: {\"type\": \"done\"}\n\n"
            return

        chunk_dicts = self._chunks_to_dicts(chunks)
        fitted_chunks = self.context_mgr.fit_context_chunks(chunk_dicts)
        context_text = build_context_section(fitted_chunks)

        history = conversation_history or []
        trimmed_history = self.context_mgr.trim_history(
            [{"role": m.role, "content": m.content} for m in history]
        )

        if trimmed_history:
            user_content = CONVERSATIONAL_RAG_PROMPT_TEMPLATE.substitute(
                history=format_conversation_history(trimmed_history),
                context=context_text,
                question=question,
            )
        else:
            user_content = RAG_USER_PROMPT_TEMPLATE.substitute(
                context=context_text,
                question=question,
            )

        messages = [
            {"role": "system", "content": RAG_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]

        # Stream tokens
        client = self._get_llm()
        full_content = ""

        try:
            stream = client.chat.completions.create(
                model=self.settings.effective_chat_model,
                messages=messages,
                temperature=self.settings.openai_temperature,
                max_tokens=self.settings.openai_max_tokens,
                stream=True,
            )

            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    token = delta.content
                    full_content += token
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

        except Exception as exc:
            logger.error("streaming_error", error=str(exc))
            yield f"data: {json.dumps({'type': 'error', 'content': 'An error occurred while generating the response.'})}\n\n"
            yield "data: {\"type\": \"done\"}\n\n"
            return

        # Parse and emit sources after streaming is complete
        structured = parse_llm_response(full_content)
        retrieved_doc_names = [c["metadata"].get("document_name", "") for c in fitted_chunks]
        structured = validate_sources_against_retrieved(structured, retrieved_doc_names)
        enriched = self._enrich_sources(structured, fitted_chunks)

        sources_payload = [
            {
                "document": s.document,
                "document_type": s.document_type,
                "page": s.page,
                "section": s.section,
                "chunk_id": s.chunk_id,
            }
            for s in enriched
        ]
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources_payload, 'has_sufficient_evidence': structured.has_sufficient_evidence})}\n\n"
        yield "data: {\"type\": \"done\"}\n\n"

        self._metrics.record_query(success=True)

    def _enrich_sources(
        self,
        structured: RAGStructuredResponse,
        fitted_chunks: List[dict],
    ) -> List[SourceCitation]:
        """
        Convert RAG sources to SourceCitation objects, enriched from retrieved metadata.
        """
        enriched: List[SourceCitation] = []
        seen = set()

        for source in structured.sources:
            key = (source.document, source.page)
            if key in seen:
                continue
            seen.add(key)

            # Find the matching chunk for metadata enrichment
            matching_chunk = next(
                (c for c in fitted_chunks if source.document.lower() in c["metadata"].get("document_name", "").lower()),
                None,
            )

            meta = matching_chunk["metadata"] if matching_chunk else {}
            enriched.append(
                SourceCitation(
                    document=source.document,
                    document_type=source.document_type or meta.get("document_type", ""),
                    page=source.page or meta.get("page_number", 0),
                    section=source.section or meta.get("section"),
                    chunk_id=matching_chunk["id"] if matching_chunk else "",
                )
            )

        # If no sources extracted but evidence is present, generate from retrieved chunks
        if not enriched and structured.has_sufficient_evidence and fitted_chunks:
            for chunk in fitted_chunks[:3]:
                meta = chunk["metadata"]
                enriched.append(
                    SourceCitation(
                        document=meta.get("document_name", "Unknown"),
                        document_type=meta.get("document_type", ""),
                        page=meta.get("page_number", 0),
                        section=meta.get("section"),
                        chunk_id=chunk["id"],
                    )
                )

        return enriched
