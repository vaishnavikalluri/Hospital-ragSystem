"""
Pydantic schemas for all API request/response models.
Concept 8 — Structured Output & JSON Response Handling
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Auth models ────────────────────────────────────────────────────────────────

class AuthRequest(BaseModel):
    hospital_id: str = Field(..., min_length=1, max_length=20)


class AuthResponse(BaseModel):
    authorized: bool
    hospital_id: str
    name: str
    is_admin: bool
    token: str
    message: str


class StaffMember(BaseModel):
    hospital_id: str
    name: str
    is_admin: bool


# ── Chat / RAG models ──────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    document_type_filter: Optional[str] = None  # optional metadata filter


class SourceCitation(BaseModel):
    """A single citation from the retrieved context."""
    document: str
    document_type: str
    page: int
    section: Optional[str] = None
    chunk_id: str


class ChatResponse(BaseModel):
    """Structured RAG response (Concept 8)."""
    answer: str
    has_sufficient_evidence: bool
    sources: List[SourceCitation] = Field(default_factory=list)
    retrieval_count: int = 0
    model_used: str = ""
    tokens_used: int = 0


# ── Document models ────────────────────────────────────────────────────────────

class DocumentInfo(BaseModel):
    name: str
    document_type: str
    page_count: int
    chunk_count: int
    file_size_bytes: int
    indexed: bool
    indexed_at: Optional[str] = None
    uploaded_at: Optional[str] = None
    created_at: Optional[str] = None


class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]
    total: int
    by_type: Dict[str, int]


# ── Admin models ───────────────────────────────────────────────────────────────

class IndexRequest(BaseModel):
    document_type: Optional[str] = None  # if None, index all
    force_reindex: bool = False


class IndexResponse(BaseModel):
    success: bool
    documents_processed: int
    chunks_created: int
    errors: List[str] = Field(default_factory=list)
    summary: str


class UploadResponse(BaseModel):
    success: bool
    filename: str
    document_type: str
    message: str
    chunk_count: int = 0


# ── Monitoring models ──────────────────────────────────────────────────────────

class MetricsResponse(BaseModel):
    total_queries: int
    successful_queries: int
    failed_queries: int
    total_tokens_used: int
    avg_response_time_ms: float
    avg_retrieval_time_ms: float
    avg_llm_time_ms: float
    documents_indexed: int
    chunks_indexed: int
    cache_hits: int
    cache_misses: int
    uptime_seconds: float


# ── Corpus validation models ───────────────────────────────────────────────────

class ValidationSummary(BaseModel):
    documents_found: int
    by_type: Dict[str, int]
    pages_processed: int
    chunks_created: int
    errors: List[str]
    warnings: List[str]
    validation_passed: bool
