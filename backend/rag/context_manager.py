"""
Context window management and token counting.
Concept 6 — Context Windows & Message History Management
Concept 31 — Context Window Management
Concept 5 — Token counting
"""
from __future__ import annotations

from typing import List

import tiktoken

from backend.monitoring.logger import get_logger

logger = get_logger(__name__)

# Model context window sizes
MODEL_CONTEXT_WINDOWS = {
    "gpt-4o-mini": 128_000,
    "gpt-4o": 128_000,
    "gpt-4-turbo": 128_000,
    "gpt-3.5-turbo": 16_385,
}

DEFAULT_CONTEXT_WINDOW = 128_000


class ContextManager:
    """
    Manages context window usage for RAG prompts.

    Responsibilities:
    - Count tokens in prompts and context
    - Trim conversation history when context grows too long
    - Ensure retrieved context fits within budget
    - Track token usage per request
    """

    def __init__(
        self,
        model_name: str = "gpt-4o-mini",
        max_context_tokens: int = 6000,
        max_history_messages: int = 10,
    ) -> None:
        self.model_name = model_name
        self.max_context_tokens = max_context_tokens
        self.max_history_messages = max_history_messages

        try:
            self._enc = tiktoken.encoding_for_model(model_name)
        except Exception:
            self._enc = tiktoken.get_encoding("cl100k_base")

        context_window = MODEL_CONTEXT_WINDOWS.get(model_name, DEFAULT_CONTEXT_WINDOW)
        # Reserve tokens for system prompt + answer
        self._response_budget = min(
            max_context_tokens,
            context_window - 2000,  # reserve 2k for output
        )

    def count_tokens(self, text: str) -> int:
        """Count tokens in a string. Concept 5."""
        return len(self._enc.encode(text))

    def count_messages_tokens(self, messages: List[dict]) -> int:
        """Count total tokens in a list of chat messages."""
        total = 0
        for msg in messages:
            total += self.count_tokens(msg.get("content", ""))
            total += 4  # per-message overhead
        return total + 2  # conversation overhead

    def trim_history(self, history: List[dict]) -> List[dict]:
        """
        Trim conversation history to fit within context window.
        Keeps the most recent messages, always preserving the last user message.
        Concept 6 — Context Windows & Message History Management
        """
        if not history:
            return []

        # Limit to max_history_messages
        if len(history) > self.max_history_messages:
            history = history[-self.max_history_messages:]

        # Token trim if still too large
        while len(history) > 2:
            total = self.count_messages_tokens(history)
            if total <= self._response_budget // 3:  # history gets 1/3 of budget
                break
            history = history[2:]  # remove oldest pair

        return history

    def fit_context_chunks(
        self,
        chunks: List[dict],
        reserved_tokens: int = 1000,
    ) -> List[dict]:
        """
        Select chunks that fit within the context token budget.
        Concept 31 — Context Window Management
        """
        budget = self._response_budget - reserved_tokens
        selected = []
        used = 0

        for chunk in chunks:
            text = chunk.get("text", "")
            tokens = self.count_tokens(text)
            if used + tokens <= budget:
                selected.append(chunk)
                used += tokens
            else:
                # Try to include a truncated version
                remaining = budget - used
                if remaining > 100:
                    tokens_enc = self._enc.encode(text)
                    truncated = self._enc.decode(tokens_enc[:remaining])
                    chunk = dict(chunk)
                    chunk["text"] = truncated + "... [truncated]"
                    selected.append(chunk)
                break

        if len(selected) < len(chunks):
            logger.info(
                "context_trimmed",
                original=len(chunks),
                selected=len(selected),
                tokens_used=used,
            )

        return selected

    def estimate_prompt_tokens(
        self,
        system_prompt: str,
        context: str,
        question: str,
        history: List[dict],
    ) -> int:
        """Estimate total tokens for a RAG request."""
        return (
            self.count_tokens(system_prompt)
            + self.count_tokens(context)
            + self.count_tokens(question)
            + self.count_messages_tokens(history)
        )
