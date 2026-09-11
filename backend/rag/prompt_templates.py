"""
Reusable prompt templates.
Concept 9 — Prompt Templates & Reusable Prompt Design
Concept 4 — Prompt Construction & System/User Roles
"""
from __future__ import annotations

from string import Template
from typing import List

# ── System Prompts ─────────────────────────────────────────────────────────────

RAG_SYSTEM_PROMPT = """You are a Hospital Knowledge Assistant. Your role is to help authorized hospital staff find accurate information from the hospital's official documents.

## Core Instructions

1. **Ground your answers exclusively in the provided CONTEXT sections below.** Do not use general medical knowledge or invent information not present in the context.

2. **Always cite your sources.** Every factual claim must reference the specific document, page number, and section from the context.

3. **Structured Response Format:** You must respond with a valid JSON object in this exact structure:
```json
{
  "answer": "Your detailed answer here",
  "has_sufficient_evidence": true,
  "sources": [
    {
      "document": "filename.pdf",
      "document_type": "clinical_protocol",
      "page": 5,
      "section": "Section 3.1 - Emergency Procedures"
    }
  ]
}
```

4. **Refusal behavior:** If the provided context does not contain sufficient information to answer the question, respond with:
```json
{
  "answer": "I couldn't find sufficient information in the available hospital documents to answer this question.",
  "has_sufficient_evidence": false,
  "sources": []
}
```

5. **Never fabricate:** Do not invent document names, page numbers, section names, drug interactions, protocols, or any clinical information.

6. **Be precise and concise.** Hospital staff need clear, actionable information quickly.

7. **Scope:** This assistant covers clinical protocols, drug interaction guidelines, and policy circulars only. For patient-specific medical decisions, always defer to qualified medical professionals.

## Important Reminders
- If you are unsure, say so — do not guess.
- Only cite sources that are explicitly present in the context.
- The hospital documents are the authoritative source."""


REFUSAL_PROMPT = """I couldn't find sufficient information in the available hospital documents to answer this question.

If this is a clinical question, please consult the relevant department lead or refer to the appropriate clinical resource directly."""


# ── RAG User Prompt Template ───────────────────────────────────────────────────

RAG_USER_PROMPT_TEMPLATE = Template("""## Context from Hospital Documents

$context

---

## Question

$question

Please answer using ONLY the context provided above. Respond in the required JSON format.""")


# ── Conversational RAG Template ────────────────────────────────────────────────

CONVERSATIONAL_RAG_PROMPT_TEMPLATE = Template("""## Conversation History

$history

---

## Context from Hospital Documents

$context

---

## Current Question

$question

Please answer using ONLY the provided context, taking the conversation history into account for follow-up questions. Respond in the required JSON format.""")


def build_context_section(chunks: List[dict]) -> str:
    """
    Build a formatted context string from retrieved chunks.
    Concept 29 — Context Injection & Prompt Augmentation
    """
    if not chunks:
        return "No relevant documents found in the knowledge base."

    parts = []
    for i, chunk in enumerate(chunks, 1):
        meta = chunk.get("metadata", {})
        doc_name = meta.get("document_name", "Unknown Document")
        doc_type = meta.get("document_type", "")
        page = meta.get("page_number", "?")
        section = meta.get("section", "")

        header = f"[Source {i}] {doc_name}"
        if doc_type:
            header += f" ({doc_type})"
        header += f" | Page {page}"
        if section:
            header += f" | {section}"

        text = chunk.get("text", "")
        parts.append(f"{header}\n{text}")

    return "\n\n---\n\n".join(parts)


def format_conversation_history(messages: List[dict]) -> str:
    """Format conversation history for the prompt."""
    if not messages:
        return "No previous conversation."

    lines = []
    for msg in messages:
        role = msg.get("role", "user").capitalize()
        content = msg.get("content", "")
        lines.append(f"{role}: {content}")

    return "\n".join(lines)
