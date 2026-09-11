"""
Chat API router — streaming and non-streaming RAG endpoints.
POST /api/chat          — Non-streaming RAG
POST /api/chat/stream   — Streaming RAG (SSE)
Concept 35 — Backend API for the RAG Service
Concept 38 — Streaming Responses & Citation Display
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from backend.app.config import Settings, get_settings
from backend.app.dependencies import get_current_user
from backend.app.models import ChatRequest, ChatResponse
from backend.auth.hospital_auth import TokenPayload
from backend.embeddings.cost_tracker import get_cost_tracker
from backend.embeddings.embedding_client import EmbeddingClient
from backend.monitoring.logger import get_logger
from backend.monitoring.metrics import get_metrics
from backend.rag.rag_pipeline import RAGPipeline
from backend.retrieval.retriever import Retriever
from backend.retrieval.reranker import Reranker
from backend.vectordb.chroma_client import ChromaClient

logger = get_logger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])

# Module-level lazy singletons
_rag_pipeline: RAGPipeline | None = None


def _get_rag_pipeline(settings: Settings) -> RAGPipeline:
    global _rag_pipeline
    if _rag_pipeline is None:
        cost_tracker = get_cost_tracker(settings)
        embedding_client = EmbeddingClient(settings, cost_tracker)
        chroma = ChromaClient(settings)
        reranker = Reranker(settings)
        retriever = Retriever(settings, chroma, embedding_client, reranker)
        _rag_pipeline = RAGPipeline(settings, retriever)
    return _rag_pipeline


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: TokenPayload = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> ChatResponse:
    """
    Non-streaming RAG chat endpoint.
    Requires authentication.
    """
    logger.info(
        "chat_request",
        hospital_id=current_user.hospital_id,
        question=request.question[:60],
    )

    if not settings.active_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service is not configured. Please contact the administrator.",
        )

    try:
        pipeline = _get_rag_pipeline(settings)
        response = pipeline.answer(
            question=request.question,
            conversation_history=request.conversation_history,
            document_type_filter=request.document_type_filter,
        )
        return response
    except ValueError as exc:
        logger.error("chat_config_error", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    except Exception as exc:
        logger.error("chat_error", error=str(exc))
        get_metrics().record_query(success=False)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your question. Please try again.",
        )


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: TokenPayload = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> StreamingResponse:
    """
    Streaming RAG chat endpoint using Server-Sent Events.
    Concept 38 — Streaming Responses
    """
    logger.info(
        "chat_stream_request",
        hospital_id=current_user.hospital_id,
        question=request.question[:60],
    )

    if not settings.active_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service is not configured.",
        )

    pipeline = _get_rag_pipeline(settings)

    def event_generator():
        try:
            yield from pipeline.stream_answer(
                question=request.question,
                conversation_history=request.conversation_history,
                document_type_filter=request.document_type_filter,
            )
        except Exception as exc:
            import json
            logger.error("stream_error", error=str(exc))
            yield f"data: {json.dumps({'type': 'error', 'content': 'Streaming error occurred.'})}\n\n"
            yield "data: {\"type\": \"done\"}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
