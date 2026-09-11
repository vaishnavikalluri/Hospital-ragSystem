"""
Backend configuration — loads from .env file.
All settings are centralized here; never hardcode values elsewhere.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Google Gemini / OpenAI-Compatible Endpoint ────────────
    # Accepts GOOGLE_API_KEY or OPENAI_API_KEY — both work
    google_api_key: str = ""
    openai_api_key: str = ""
    openai_base_url: str = ""
    openai_chat_model: str = "gemini-2.5-flash"
    openai_embedding_model: str = "gemini-embedding-001"

    @property
    def active_api_key(self) -> str:
        """Returns whichever API key is set — Google preferred."""
        return self.google_api_key or self.openai_api_key

    @property
    def api_base_url(self) -> str | None:
        if self.openai_base_url:
            return self.openai_base_url
        key = self.active_api_key
        # Google API keys start with AIza or AQ.
        if key.startswith("AQ.") or key.startswith("AIza"):
            return "https://generativelanguage.googleapis.com/v1beta/openai/"
        return None

    @property
    def effective_chat_model(self) -> str:
        if self.api_base_url and "generativelanguage.googleapis.com" in self.api_base_url:
            # If user left the default GPT model names, switch to Gemini
            if self.openai_chat_model in ("gpt-4o-mini", "gpt-4o"):
                return "gemini-2.5-flash"
        return self.openai_chat_model

    @property
    def effective_embedding_model(self) -> str:
        if self.api_base_url and "generativelanguage.googleapis.com" in self.api_base_url:
            if self.openai_embedding_model in ("text-embedding-3-small", "text-embedding-3-large"):
                return "gemini-embedding-001"
        return self.openai_embedding_model

    # Model parameters (Concept 7 — Model Parameters & Output Control)
    openai_temperature: float = 0.0
    openai_max_tokens: int = 1024
    openai_top_p: float = 1.0

    # ── ChromaDB ──────────────────────────────────────────────
    chroma_host: str = ""
    chroma_port: int = 8000
    chroma_collection_name: str = "hospital_knowledge_base"
    chroma_data_dir: str = "./chroma_data"

    # ── Retrieval (Concept 25 — Retrieval Relevance Tuning) ───
    top_k: int = 10
    similarity_threshold: float = 0.3
    rerank_top_n: int = 5

    # ── Chunking (Concept 14 — Token-Aware Chunk Sizing) ──────
    chunk_size: int = 512
    chunk_overlap: int = 64
    max_context_tokens: int = 6000

    # ── Auth / JWT ────────────────────────────────────────────
    jwt_secret_key: str = "change-this-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 8

    # Admin hospital IDs (comma-separated)
    admin_hospital_ids: str = ""

    # ── Paths ─────────────────────────────────────────────────
    hospital_staff_csv: str = "./data/hospital_staff.csv"
    documents_dir: str = "./data/documents"

    # ── App ───────────────────────────────────────────────────
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    log_level: str = "INFO"

    # ── Cost estimation pricing (per 1M tokens, USD) ──────────
    embedding_cost_per_1m_tokens: float = 0.02   # text-embedding-3-small
    input_cost_per_1m_tokens: float = 0.15       # gpt-4o-mini input
    output_cost_per_1m_tokens: float = 0.60      # gpt-4o-mini output

    @property
    def admin_ids_list(self) -> List[str]:
        if not self.admin_hospital_ids:
            return []
        return [i.strip().upper() for i in self.admin_hospital_ids.split(",") if i.strip()]

    @property
    def documents_path(self) -> Path:
        return Path(self.documents_dir)

    @property
    def staff_csv_path(self) -> Path:
        return Path(self.hospital_staff_csv)

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() == "development"

    @property
    def use_local_chroma(self) -> bool:
        return not bool(self.chroma_host)


@lru_cache()
def get_settings() -> Settings:
    return Settings()
