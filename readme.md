# 🏥 Hospital Knowledge Assistant

An AI-powered **Retrieval-Augmented Generation (RAG)** application that helps authorized hospital staff quickly find precise, source-backed information from clinical protocols, drug interaction guidelines, and policy circulars.

The project is designed as an end-to-end AI application covering document processing, embeddings, vector search, retrieval, RAG, grounding, citations, evaluation, backend APIs, conversational interaction, monitoring, and deployment.

---

# 1. 📌 Problem Statement

A hospital network maintains clinical protocols, drug interaction guidelines, and policy circulars that update frequently, yet on-call staff struggle to get a precise, source-backed answer during time-critical decisions.

Finding the correct information manually from a large collection of hospital documents can be slow and difficult.

The goal is to build a **Hospital Knowledge Assistant** that allows authorized hospital staff to ask questions about the hospital's knowledge base and receive:

* Relevant answers
* Source citations
* Grounded responses
* Current/relevant document information
* A clear refusal when sufficient evidence cannot be found

---

# 2. 🎯 Project Goal

Build a secure, RAG-powered hospital knowledge platform where:

```text
Hospital Staff
      ↓
Hospital ID Authorization
      ↓
Dashboard
      ↓
Ask Question
      ↓
Retrieve Relevant Hospital Information
      ↓
Rerank / Filter Results
      ↓
LLM
      ↓
Grounded Answer
      ↓
Citation + Source
```

The core principle is:

> **Retrieve first. Answer second.**

The application should not behave like a general-purpose chatbot.

The LLM must use the hospital knowledge base as the primary source of information.

If sufficient evidence cannot be found, the system must say so rather than inventing an answer.

---

# 🚀 Quick Start & Execution Guide

### 1. Prerequisites & Environment Setup
- **Python 3.10+** and **Node.js 18+**
- Configure your `.env` file in the project root:
  ```bash
  # Windows
  copy .env.example .env

  # macOS / Linux
  cp .env.example .env
  ```
- Add your API Key in `.env` (supports Google Gemini or OpenAI):
  ```ini
  GOOGLE_API_KEY=your_gemini_api_key_here
  # OR
  OPENAI_API_KEY=your_openai_api_key_here
  ```

---

### 2. Backend Setup & Startup (FastAPI + ChromaDB)
1. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Ingest and index clinical documents into ChromaDB:
   ```bash
   python -m backend.ingest
   ```
   *(To reset and re-index from scratch: `python -m backend.ingest --reset`)*

3. Start the Backend API Server from the **project root**:
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ```
   - **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Health Check Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)

---

### 3. Frontend Setup & Startup (Next.js 14)
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
- **Web App**: [http://localhost:3000](http://localhost:3000)

---

### 4. Staff Login Test Accounts
Log in using any authorized Hospital ID defined in [`data/hospital_staff.csv`](file:///d:/kalvium/sem_5/sprint2/data/hospital_staff.csv):
| Hospital ID | Staff Name | Role | Department |
| :--- | :--- | :--- | :--- |
| `H001` | Dr. Rahul Sharma | Doctor / Staff | Cardiology |
| `H002` | Priya Kumar | Nurse / Staff | ICU |
| `H003` | Dr. Arjun Reddy | Doctor / Staff | Emergency |
| `H004` | Dr. Sneha Rao | Doctor / Staff | Neurology |
| `H006` | Ananya Mehta | Pharmacist / Staff | Pharmacy |
| `ADMIN01` | Admin Staff | Administrator | Administration |

---

### 5. Running Automated Tests
```bash
pytest
```

---

# 🛠️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **LLM & Generation** | Google Gemini / OpenAI | `gemini-2.5-flash` / `gpt-4o-mini` |
| **Embedding Model** | Google Gemini / OpenAI | `gemini-embedding-001` / `text-embedding-3-small` |
| **Vector Database** | ChromaDB | Local persistent cosine similarity store (`chroma_data/`) |
| **PDF Processing** | PyMuPDF (`fitz`) | PDF text and section metadata extraction |
| **Tokenization** | Tiktoken | Token-aware chunking with sliding window overlap |
| **Backend API** | FastAPI + Uvicorn | Async REST API with Server-Sent Events (SSE) streaming |
| **Security / Auth** | JWT + HTTPBearer | Hospital ID verification against staff directory |
| **Logging & Metrics**| Structlog | Structured JSON logs + latency & uptime metrics |
| **Caching** | In-Memory LRU & TTL | Embedding vector cache & query response cache |
| **Frontend UI** | Next.js 14 + React 18 | TypeScript, Tailwind CSS, Lucide Icons, App Router |
| **Testing** | Pytest + Httpx | End-to-end integration & unit test suite |

---

# 3. 👥 Target Users

### Hospital Staff

Authorized hospital staff can:

* Log in using their Hospital ID
* Access the knowledge assistant
* Ask questions
* View answers
* View source citations
* Continue conversations with follow-up questions
* View available documents

### Hospital Admin

Authorized administrators can additionally:

* Upload new documents
* Trigger document indexing
* View document processing status
* Manage the knowledge base
* Replace/update documents where required

The initial knowledge base is pre-loaded.

---

# 4. 🔐 Authentication & Authorization

The MVP uses a simple **Hospital ID-based authorization system**.

There is no:

* Signup
* Password
* OTP
* Email registration

for the initial staff login.

---

## Login Flow

```text
              LOGIN PAGE
                   ↓
          Enter Hospital ID
                   ↓
             Click Continue
                   ↓
        Check hospital_staff.csv
                   ↓
            Is ID present?
             /          \
           YES           NO
            ↓             ↓
       Authorized      Access Denied
            ↓
        Dashboard
```

---

## Hospital Staff File

The application will use:

```text
data/hospital_staff.csv
```

Example:

```csv
hospital_id,name
H001,Rahul Sharma
H002,Priya Kumar
H003,Arjun Reddy
```

The actual file will be provided by the project team.

The application must not create fake staff records.

---

## Authorized User

If the user enters:

```text
H002
```

and H002 exists:

```text
✓ Authorized

Welcome, Priya Kumar
```

The user can continue to the dashboard.

---

## Unauthorized User

If the user enters:

```text
H999
```

and H999 does not exist:

```text
✕ Access Denied

Hospital ID not found.
You are not authorized to access this application.
```

The user must not receive access to protected application features.

---

## Protected Access

Authorization must be enforced by the backend, not only the frontend.

Protected routes and APIs should require a valid authenticated session/token.

---

# 5. 📚 Knowledge Base

The initial knowledge base consists of pre-loaded hospital documents.

The expected document categories are:

```text
data/
└── documents/
    ├── clinical_protocols/
    ├── drug_interaction_guidelines/
    └── policy_circulars/
```

The team will manually add the actual PDFs.

---

# 6. 📂 Data Structure

The project should contain:

```text
data/
├── hospital_staff.csv
│
└── documents/
    ├── clinical_protocols/
    │   └── *.pdf
    │
    ├── drug_interaction_guidelines/
    │   └── *.pdf
    │
    └── policy_circulars/
        └── *.pdf
```

### Important

The application must:

* Automatically discover PDFs
* Never hardcode PDF filenames
* Work with new PDFs added later
* Determine document type from its folder
* Handle empty folders without crashing

The actual PDFs will be added manually.

---

# 7. 📄 Document Processing Pipeline

The complete ingestion pipeline is:

```text
PDF
 ↓
Document Loading
 ↓
Text Extraction
 ↓
Cleaning
 ↓
Chunking
 ↓
Metadata
 ↓
Token-Aware Processing
 ↓
Embeddings
 ↓
Quality Checks
 ↓
Vector Database
```

---

# 8. 📖 Document Loading & Multi-Format Intake

The initial corpus consists of PDFs.

Use **PyMuPDF** for PDF processing.

The architecture should be modular enough to support additional document formats later if required.

Possible future formats:

* PDF
* TXT
* DOCX
* HTML

---

# 9. 🧹 Text Extraction & Cleaning

Extract text from each document while preserving page information.

The processing pipeline should:

* Extract text
* Remove unnecessary whitespace
* Handle empty pages
* Preserve page numbers
* Preserve meaningful headings
* Remove obvious extraction artifacts where possible

Each processed chunk should retain its source information.

---

# 10. ✂️ Document Chunking

Large documents must be divided into smaller chunks.

The system should use a configurable chunking strategy.

Example:

```text
Clinical Protocol
       ↓
 ┌──────────────┐
 │ Chunk 1      │
 ├──────────────┤
 │ Chunk 2      │
 ├──────────────┤
 │ Chunk 3      │
 ├──────────────┤
 │ Chunk 4      │
 └──────────────┘
```

Chunk size and overlap must be configurable.

---

# 11. 🏷️ Chunk Metadata & Source Tracking

Each chunk should store metadata such as:

```text
document_name
document_type
source
page
section
version
effective_date
chunk_id
```

Only metadata actually available should be populated.

At minimum:

* Source filename
* Document type
* Page number
* Chunk ID

must be available.

This metadata is later used for:

* Retrieval
* Filtering
* Citations
* Evaluation
* Document tracking

---

# 12. 🧮 Token-Aware Chunking

Chunking should consider token limits rather than relying only on character count.

The implementation should:

* Estimate token counts
* Keep chunks within a configurable token budget
* Use overlap where useful
* Avoid splitting important information unnecessarily

Example configuration:

```text
CHUNK_SIZE
CHUNK_OVERLAP
MAX_CONTEXT_TOKENS
```

---

# 13. 🧪 Corpus Preparation & Validation

Before indexing the corpus, validate:

* Number of documents
* Document categories
* Pages
* Extracted text
* Empty documents
* Chunk counts
* Missing metadata
* Duplicate documents
* Processing failures

The ingestion process should generate a useful summary.

Example:

```text
Documents found: 25

Clinical Protocols: 10
Drug Guidelines: 8
Policy Circulars: 7

Pages processed: 420
Chunks created: 1,250

Validation: PASSED
```

---

# 14. 🧠 Embeddings

Use OpenAI Embeddings to convert chunks into vector representations.

```text
Text Chunk
    ↓
Embedding Model
    ↓
Vector
```

The same embedding model should be used consistently for document chunks and user queries.

---

# 15. 📦 Batch Embedding

Large document corpora should not necessarily be embedded one chunk at a time.

Implement batching where appropriate.

The system should consider:

* API limits
* Rate limits
* Token usage
* Cost
* Retry handling

---

# 16. 💰 Token & Cost Estimation

Track token usage where possible.

The system should provide utilities for estimating:

* Input tokens
* Output tokens
* Embedding tokens
* Approximate API cost

Configuration should allow model pricing to be updated without changing core code.

---

# 17. 🔍 Embedding Quality Checks

Implement basic embedding sanity checks.

Examples:

* Verify embeddings are generated
* Verify vector dimensions
* Check for empty vectors
* Check duplicate/near-duplicate chunks
* Compare similarity between sample texts

The system should include an embedding validation/evaluation script.

---

# 18. 📏 Similarity & Distance Metrics

Use semantic similarity to compare:

```text
User Question
       ↓
Question Vector
       ↓
Document Vectors
```

Use an appropriate distance/similarity metric supported by the vector database.

Document the selected metric and why it is appropriate.

---

# 19. 🗄️ Vector Database

Use **ChromaDB**.

The vector database should store:

* Embeddings
* Chunk text
* Metadata
* Document identifiers

Use a clearly named collection for the hospital knowledge base.

---

# 20. 🔎 Similarity Search & Top-K Retrieval

When the user asks a question:

```text
Question
   ↓
Embedding
   ↓
ChromaDB
   ↓
Similarity Search
   ↓
Top-K Chunks
```

The value of K must be configurable.

Example:

```text
TOP_K = 10
```

---

# 21. 🏷️ Metadata Filtering

Retrieval should support filters such as:

```text
document_type
version
effective_date
```

Example:

```text
Question:
"What is the drug interaction guideline?"

Filter:
document_type = drug_interaction_guideline
```

This allows retrieval to focus on the correct category.

---

# 22. 🔄 Hybrid Search

Where useful, combine semantic retrieval with keyword-based matching.

This can improve retrieval for:

* Drug names
* Hospital policy numbers
* Protocol names
* Exact terms
* Section identifiers

The retrieval architecture should support semantic + keyword/hybrid search where appropriate.

---

# 23. 🎯 Retrieval Relevance Tuning

The retrieval system should expose configurable parameters such as:

```text
TOP_K
SIMILARITY_THRESHOLD
FILTERS
RERANK_TOP_N
```

These should be tested and tuned using evaluation data.

---

# 24. 🥇 Chunk Re-Ranking

Implement a re-ranking stage.

Example:

```text
Vector Search
     ↓
Top 10 chunks
     ↓
Re-Ranker
     ↓
Best 5 chunks
     ↓
LLM
```

The purpose is to improve the precision of the context given to the LLM.

---

# 25. 📊 Retrieval Evaluation

Create a retrieval evaluation dataset.

Example:

```text
Question                     Expected Source
------------------------------------------------
Drug A interaction?          Drug_Guideline.pdf
Emergency protocol?          Emergency.pdf
Policy X?                    Policy_X.pdf
```

Measure metrics such as:

* Recall@K
* Precision where applicable
* Hit rate
* Correct source retrieval

The evaluation should be reproducible.

---

# 26. 🧠 RAG Architecture

The complete RAG flow is:

```text
User Question
      ↓
Question Embedding
      ↓
Initial Retrieval
      ↓
Metadata Filtering
      ↓
Hybrid Search where useful
      ↓
Re-Ranking
      ↓
Relevant Context
      ↓
Prompt Construction
      ↓
LLM
      ↓
Grounded Answer
      ↓
Citation + Guardrails
```

---

# 27. 📝 Prompt Construction

Use separate:

### System message

Contains instructions such as:

* Use retrieved hospital context
* Do not hallucinate
* Cite sources
* Refuse unsupported questions

### User message

Contains the actual user question.

### Retrieved context

Contains relevant document chunks.

---

# 28. ♻️ Reusable Prompt Templates

Create reusable prompt templates instead of hardcoding prompts throughout the code.

Examples:

```text
RAG_SYSTEM_PROMPT
RAG_USER_PROMPT
REFUSAL_PROMPT
```

---

# 29. 🔢 Model Parameters

Make model parameters configurable.

Examples:

```text
temperature
max_tokens
top_p
```

Use conservative settings suitable for a factual document-grounded assistant.

---

# 30. 📦 Structured Output

Where appropriate, request structured output from the LLM.

A response can follow a structure such as:

```json
{
  "answer": "...",
  "has_sufficient_evidence": true,
  "sources": [
    {
      "document": "...",
      "page": 12,
      "section": "..."
    }
  ]
}
```

Validate the returned structure before displaying it.

---

# 31. 🪟 Context Window Management

The system must prevent excessive retrieved context from exceeding the model's context window.

Implement:

* Context size estimation
* Maximum context limits
* Context trimming
* Relevant chunk selection
* Token-aware prompt construction

---

# 32. 💬 Conversational RAG

The assistant should support follow-up questions.

Example:

**User:**

> What is the protocol for X?

**Assistant:**

> According to Protocol A...

**User:**

> What about the second step?

The system should use relevant conversation context while still grounding the answer in the hospital documents.

---

# 33. 🛡️ Hallucination Guardrails

The RAG system must:

* Answer from retrieved evidence
* Avoid unsupported claims
* Detect insufficient context
* Refuse when necessary
* Never fabricate citations
* Never fabricate document names
* Never fabricate page numbers

---

# 34. ❌ Refusal Behavior

If sufficient evidence is unavailable:

> I couldn't find sufficient information in the available hospital documents to answer this question.

Do not answer from general model knowledge.

---

# 35. 📚 Source Citation & Attribution

Every grounded answer should show its sources.

Example:

```text
Answer
────────────────────

According to the current protocol...

Sources
────────────────────

📄 Clinical_Protocol_v3.pdf
Page 12
Section 4.2
```

Citation information must come from actual retrieved metadata.

---

# 36. 📊 RAG Evaluation & Answer Scoring

Create an evaluation framework for:

### Retrieval

* Was the correct source retrieved?

### Groundedness

* Is the answer supported by retrieved context?

### Relevance

* Does the answer actually address the question?

### Citation correctness

* Does the citation correspond to supporting evidence?

### Refusal correctness

* Does the system refuse when evidence is insufficient?

Store evaluation results so that retrieval/prompt changes can be compared.

---

# 37. 🤖 LLM API

Use an OpenAI-compatible API.

Implement:

* API configuration
* Model selection
* Completion calls
* Error handling
* Token tracking
* Retry handling where appropriate

Keep credentials in `.env`.

---

# 38. 💻 Backend API

Use **FastAPI**.

Provide APIs for:

```text
POST /api/auth/verify
GET  /api/auth/me
POST /api/auth/logout

GET  /api/documents

POST /api/chat

POST /api/admin/documents/upload
POST /api/admin/documents/index
```

Protect appropriate routes with authorization.

---

# 39. 📤 Admin Document Upload

The main knowledge base is pre-loaded.

However, the project must also implement an **admin-only document upload and indexing endpoint** to support document updates and Sprint Concept #36.

Normal staff cannot upload documents.

Admin flow:

```text
Admin
 ↓
Upload PDF
 ↓
Validate File
 ↓
Determine Document Type
 ↓
Extract Text
 ↓
Chunk
 ↓
Generate Embeddings
 ↓
Index in ChromaDB
 ↓
Knowledge Base Updated
```

The uploaded document should receive the same metadata and processing pipeline as pre-loaded documents.

---

# 40. 💬 Chat Interface

Build a clean chat/query interface.

Users should be able to:

* Ask questions
* See loading status
* Receive answers
* See citations
* Ask follow-up questions
* Start a new conversation

---

# 41. 🌊 Streaming Responses

Where supported, stream LLM responses to the frontend.

Example:

```text
Generating answer...

According to the clinical...
protocol...
the recommended procedure...
```

Citations should be displayed correctly once the relevant source information is available.

---

# 42. ⚡ Caching

Implement appropriate caching for repeated requests where safe.

Possible cache targets:

* Repeated embeddings
* Repeated retrieval queries
* Repeated identical questions

Do not cache in a way that causes outdated hospital information to be returned when document versions have changed.

---

# 43. 📝 Logging

Implement structured logging for:

* API requests
* Errors
* Document processing
* Retrieval
* LLM calls
* Processing time
* Token usage
* Indexing operations

Do not log sensitive information unnecessarily.

---

# 44. 📈 Usage Monitoring

Track useful application metrics such as:

* Number of questions
* Response time
* Retrieval latency
* LLM latency
* Token usage
* Errors
* Document processing count

Do not expose sensitive user information unnecessarily.

---

# 45. 🖥️ Frontend

Use:

* Next.js
* React
* Tailwind CSS

Required pages:

```text
/login
/dashboard
/assistant
/documents
/admin
```

Admin pages must be protected.

---

# 46. 🎨 UI Requirements

The interface should be:

* Clean
* Professional
* Modern
* Responsive
* Easy to understand
* Suitable for a hospital environment

Main navigation can include:

```text
Dashboard
Assistant
Documents
Admin (authorized admins only)
Logout
```

---

# 47. 🏠 Dashboard

Display:

```text
Welcome, [Name]

Hospital ID: [ID]

Knowledge Base
[Number of Documents]

[ Ask AI Assistant ]

[ View Documents ]
```

Admins should additionally see:

```text
[ Manage Documents ]
```

---

# 48. 📚 Documents Page

Display:

* Document name
* Document type
* Version if available
* Date if available
* Page count where available
* Processing status

Documents should be dynamically loaded from the backend.

Do not hardcode filenames.

---

# 49. 🔐 Admin Authorization

The application should distinguish normal staff from administrators.

The authorization design should allow the application to identify which Hospital IDs have admin privileges.

The exact admin mapping should be configurable rather than hardcoded into frontend code.

For example, use configuration/environment data or an appropriate authorized admin list.

---

# 50. 🧪 Testing

Create tests for:

### Authentication

```text
Valid Hospital ID → Authorized
Invalid Hospital ID → Denied
```

### Document ingestion

```text
PDF → Successfully discovered
PDF → Text extracted
PDF → Chunks created
```

### Embeddings

```text
Chunk → Embedding
Embedding → Valid dimensions
```

### Retrieval

```text
Question → Relevant chunks
```

### Filtering

```text
Document type filter → Correct category
```

### Reranking

```text
Initial results → Reordered results
```

### RAG

```text
Question + context → Grounded answer
```

### Refusal

```text
Unsupported question → Refusal
```

### Citations

```text
Answer → Correct source
```

---

# 51. 🚫 What This Project Is NOT

This is not:

* A hospital management system
* A patient management system
* An appointment system
* A billing system
* A pharmacy inventory system
* A patient medical record system
* A general-purpose chatbot
* A replacement for medical professionals

It is a:

> **Hospital document-based AI knowledge assistant.**

---

# 52. 🧩 Technology Stack

| Layer               | Technology                  |
| ------------------- | --------------------------- |
| Frontend            | Next.js + React             |
| Styling             | Tailwind CSS                |
| Backend             | Python + FastAPI            |
| LLM                 | OpenAI API                  |
| Embeddings          | OpenAI Embeddings           |
| RAG                 | LangChain                   |
| Vector Database     | ChromaDB                    |
| PDF Processing      | PyMuPDF                     |
| Staff Authorization | CSV + backend authorization |
| Configuration       | `.env`                      |
| Version Control     | Git + GitHub                |

---

# 53. 📁 Suggested Project Structure

```text
hospital-knowledge-assistant/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── services/
│   └── ...
│
├── backend/
│   ├── app/
│   ├── auth/
│   ├── ingestion/
│   ├── embeddings/
│   ├── retrieval/
│   ├── rag/
│   ├── evaluation/
│   └── ...
│
├── data/
│   ├── hospital_staff.csv
│   └── documents/
│       ├── clinical_protocols/
│       ├── drug_interaction_guidelines/
│       └── policy_circulars/
│
├── chroma_data/
│
├── tests/
│
├── .env.example
├── .gitignore
├── README.md
└── ...
```

---

# 54. 🔑 Environment Variables

Create `.env.example`.

Example:

```env
OPENAI_API_KEY=

OPENAI_CHAT_MODEL=
OPENAI_EMBEDDING_MODEL=

CHROMA_HOST=
CHROMA_PORT=

ADMIN_HOSPITAL_IDS=
```

Do not hardcode secrets.

I will add actual credentials/configuration later.

---

# 55. 🚀 Development Roadmap

## Phase 1 — Setup

* Development environment
* Repository
* Git workflow
* Backend
* Frontend
* Environment configuration

## Phase 2 — LLM Basics

* First LLM call
* Prompts
* System/user roles
* Token counting
* Model parameters
* Structured output
* Prompt templates

## Phase 3 — Document Processing

* PDF loading
* Text extraction
* Cleaning
* Chunking
* Metadata
* Token-aware chunking
* Corpus validation

## Phase 4 — Embeddings

* Embedding generation
* Batch processing
* Similarity
* Cost management
* Quality checks

## Phase 5 — Vector Database & Retrieval

* ChromaDB
* Collections
* Metadata
* Top-K retrieval
* Filtering
* Hybrid search
* Re-ranking
* Retrieval evaluation

## Phase 6 — RAG

* RAG architecture
* Context injection
* Grounded generation
* Citations
* Guardrails
* Conversational RAG
* Evaluation

## Phase 7 — Application

* Backend API
* Chat UI
* Admin upload
* Streaming
* Citation display

## Phase 8 — Delivery

* Caching
* Logging
* Monitoring
* Testing
* Deployment
* Documentation

---

# 56. 🏆 Sprint 2 — 40 Concept Mapping

The project is intentionally designed to provide implementation evidence for all 40 Sprint concepts.

| #  | Concept                                           | Project Implementation                 | Relevant File/Module | Technical Evidence |
| -- | ------------------------------------------------- | -------------------------------------- | -------------------- | ------------------ |
| 1  | Development Environment & Project Workspace Setup | Full frontend/backend workspace        | [`backend/app/main.py`](file:///d:/kalvium/sem_5/sprint2/backend/app/main.py) | Workspace structure with FastAPI & Next.js |
| 2  | GitHub Repository & Team Workflow Setup           | Git/GitHub project workflow            | [`.gitignore`](file:///d:/kalvium/sem_5/sprint2/.gitignore) | `.gitignore`, `.env.example`, modular packages |
| 3  | LLM API Access & First Completion Call            | OpenAI integration                     | [`backend/rag/rag_pipeline.py`](file:///d:/kalvium/sem_5/sprint2/backend/rag/rag_pipeline.py#L189) | `_call_llm()` completion call |
| 4  | Prompt Construction & System/User Roles           | RAG prompt architecture                | [`backend/rag/prompt_templates.py`](file:///d:/kalvium/sem_5/sprint2/backend/rag/prompt_templates.py#L11) | System prompt, user templates, context formatters |
| 5  | Tokens, Tokenization & Cost Estimation            | Token counter + cost utility           | [`backend/embeddings/cost_tracker.py`](file:///d:/kalvium/sem_5/sprint2/backend/embeddings/cost_tracker.py) | `CostTracker` class & `tiktoken` token counting |
| 6  | Context Windows & Message History Management      | Context manager + conversation history | [`backend/rag/context_manager.py`](file:///d:/kalvium/sem_5/sprint2/backend/rag/context_manager.py#L58) | `trim_history()` & `fit_context_chunks()` budget trimming |
| 7  | Model Parameters & Output Control                 | Configurable temperature/max tokens    | [`backend/app/config.py`](file:///d:/kalvium/sem_5/sprint2/backend/app/config.py#L25) | Settings `openai_temperature`, `openai_max_tokens`, `top_p` |
| 8  | Structured Output & JSON Response Handling        | Structured RAG response schema         | [`backend/rag/response_schema.py`](file:///d:/kalvium/sem_5/sprint2/backend/rag/response_schema.py#L22) | `RAGStructuredResponse` Pydantic model + `parse_llm_response()` |
| 9  | Prompt Templates & Reusable Prompt Design         | Reusable prompt templates              | [`backend/rag/prompt_templates.py`](file:///d:/kalvium/sem_5/sprint2/backend/rag/prompt_templates.py#L64) | `RAG_USER_PROMPT_TEMPLATE` & `CONVERSATIONAL_RAG_PROMPT_TEMPLATE` |
| 10 | Document Loading & Multi-Format Intake            | Document loader architecture           | [`backend/ingestion/document_loader.py`](file:///d:/kalvium/sem_5/sprint2/backend/ingestion/document_loader.py#L65) | `DocumentLoader` with auto-discovery & PyMuPDF |
| 11 | Text Extraction & Cleaning Pipeline               | PyMuPDF extraction/cleaning            | [`backend/ingestion/text_cleaner.py`](file:///d:/kalvium/sem_5/sprint2/backend/ingestion/text_cleaner.py#L14) | `TextCleaner` regex header/footer removal & whitespace normalization |
| 12 | Document Chunking Strategies                      | Configurable chunking                  | [`backend/ingestion/chunker.py`](file:///d:/kalvium/sem_5/sprint2/backend/ingestion/chunker.py#L38) | Paragraph and sentence split strategies |
| 13 | Chunk Metadata & Source Tracking                  | Metadata on every chunk                | [`backend/ingestion/metadata_extractor.py`](file:///d:/kalvium/sem_5/sprint2/backend/ingestion/metadata_extractor.py#L42) | Extracted version, effective date, section metadata |
| 14 | Token-Aware Chunk Sizing & Overlap                | Token-based chunk configuration        | [`backend/ingestion/chunker.py`](file:///d:/kalvium/sem_5/sprint2/backend/ingestion/chunker.py#L45) | `TokenAwareChunker` using `tiktoken` with chunk overlap |
| 15 | Corpus Preparation & Ingestion Validation         | Corpus validation pipeline             | [`backend/ingestion/corpus_validator.py`](file:///d:/kalvium/sem_5/sprint2/backend/ingestion/corpus_validator.py#L64) | `CorpusValidator` checking doc count, empty docs, duplicates |
| 16 | Embeddings Fundamentals & Vector Representation   | Embedding pipeline                     | [`backend/embeddings/embedding_client.py`](file:///d:/kalvium/sem_5/sprint2/backend/embeddings/embedding_client.py) | OpenAI vector generation |
| 17 | Generating Embeddings via API                     | OpenAI embeddings                      | [`backend/embeddings/embedding_client.py`](file:///d:/kalvium/sem_5/sprint2/backend/embeddings/embedding_client.py#L48) | `embed_texts()` and `embed_query()` API wrapper |
| 18 | Embedding Similarity & Distance Metrics           | Similarity testing                     | [`backend/embeddings/embedding_validator.py`](file:///d:/kalvium/sem_5/sprint2/backend/embeddings/embedding_validator.py#L19) | `cosine_similarity()` & `euclidean_distance()` |
| 19 | Batch Embedding & Rate/Cost Management            | Batch embedding                        | [`backend/embeddings/embedding_client.py`](file:///d:/kalvium/sem_5/sprint2/backend/embeddings/embedding_client.py#L71) | `_embed_batch_with_retry()` exponential backoff |
| 20 | Embedding Quality Checks & Sanity Tests           | Embedding validation                   | [`backend/embeddings/embedding_validator.py`](file:///d:/kalvium/sem_5/sprint2/backend/embeddings/embedding_validator.py#L41) | `EmbeddingValidator` dimension & zero-vector check |
| 21 | Vector Database Setup & Collection Design         | ChromaDB collection                    | [`backend/vectordb/chroma_client.py`](file:///d:/kalvium/sem_5/sprint2/backend/vectordb/chroma_client.py#L51) | Cosine collection initialization in ChromaDB |
| 22 | Indexing Embeddings & Metadata Storage            | ChromaDB indexing                      | [`backend/vectordb/chroma_client.py`](file:///d:/kalvium/sem_5/sprint2/backend/vectordb/chroma_client.py#L68) | `index_chunks()` metadata & vector upserts |
| 23 | Similarity Search & Top-K Retrieval               | Top-K retrieval                        | [`backend/retrieval/retriever.py`](file:///d:/kalvium/sem_5/sprint2/backend/retrieval/retriever.py#L104) | Configurable Top-K search in `Retriever` |
| 24 | Metadata Filtering & Hybrid Search                | Metadata + keyword/semantic search     | [`backend/retrieval/retriever.py`](file:///d:/kalvium/sem_5/sprint2/backend/retrieval/retriever.py#L189) | `BM25Scorer` combined with cosine distance & `where` filters |
| 25 | Retrieval Relevance Tuning                        | Configurable retrieval parameters      | [`backend/app/config.py`](file:///d:/kalvium/sem_5/sprint2/backend/app/config.py#L30) | `TOP_K`, `SIMILARITY_THRESHOLD`, `RERANK_TOP_N` tuning settings |
| 26 | Chunk Re-Ranking for Precision                    | Re-ranking pipeline                    | [`backend/retrieval/reranker.py`](file:///d:/kalvium/sem_5/sprint2/backend/retrieval/reranker.py#L37) | `Reranker` cross-encoder style LLM scoring |
| 27 | Retrieval Evaluation & Recall Testing             | Retrieval test dataset/metrics         | [`backend/evaluation/retrieval_eval.py`](file:///d:/kalvium/sem_5/sprint2/backend/evaluation/retrieval_eval.py#L67) | `RetrievalEvaluator` Recall@K & Hit Rate tests |
| 28 | RAG Pipeline Architecture & Flow Design           | End-to-end RAG pipeline                | [`backend/rag/rag_pipeline.py`](file:///d:/kalvium/sem_5/sprint2/backend/rag/rag_pipeline.py#L37) | `RAGPipeline` class flow |
| 29 | Context Injection & Prompt Augmentation           | Retrieved context in prompt            | [`backend/rag/prompt_templates.py`](file:///d:/kalvium/sem_5/sprint2/backend/rag/prompt_templates.py#L82) | `build_context_section()` prompt context injection |
| 30 | Grounded Answer Generation                        | Evidence-based generation              | [`backend/rag/prompt_templates.py`](file:///d:/kalvium/sem_5/sprint2/backend/rag/prompt_templates.py#L11) | Strict system prompt context grounding instructions |
| 31 | Source Citation & Attribution                     | Source/page/section citations          | [`backend/rag/rag_pipeline.py`](file:///d:/kalvium/sem_5/sprint2/backend/rag/rag_pipeline.py#L273) | `_enrich_sources()` mapping chunk metadata |
| 32 | Hallucination Guardrails & Refusal Handling       | Don't-know/refusal logic               | [`backend/rag/response_schema.py`](file:///d:/kalvium/sem_5/sprint2/backend/rag/response_schema.py#L66) | `validate_sources_against_retrieved()` & refusal prompts |
| 33 | Conversational RAG & Follow-Up Context            | Conversation history                   | [`backend/rag/context_manager.py`](file:///d:/kalvium/sem_5/sprint2/backend/rag/context_manager.py#L58) | `trim_history()` & conversational context buffer |
| 34 | RAG Evaluation & Answer Quality Scoring           | RAG evaluation framework               | [`backend/evaluation/rag_eval.py`](file:///d:/kalvium/sem_5/sprint2/backend/evaluation/rag_eval.py#L77) | `RAGEvaluator` refusal accuracy & groundedness |
| 35 | Backend API for the RAG Service                   | FastAPI                                | [`backend/app/main.py`](file:///d:/kalvium/sem_5/sprint2/backend/app/main.py) | FastAPI app with REST endpoints |
| 36 | Document Upload & Indexing Endpoint               | Admin-only upload/index endpoint       | [`backend/app/routers/admin.py`](file:///d:/kalvium/sem_5/sprint2/backend/app/routers/admin.py#L48) | `POST /api/admin/documents/upload` |
| 37 | Chat Interface & Query UI                         | Next.js chat UI                        | [`frontend/components/ChatWindow.tsx`](file:///d:/kalvium/sem_5/sprint2/frontend/components/ChatWindow.tsx) | Next.js interactive chat interface |
| 38 | Streaming Responses & Citation Display            | Streaming LLM responses                | [`backend/rag/rag_pipeline.py`](file:///d:/kalvium/sem_5/sprint2/backend/rag/rag_pipeline.py#L202) | SSE stream output via `stream_answer()` |
| 39 | Caching, Logging & Usage Monitoring               | Cache + logs + metrics                 | [`backend/cache/query_cache.py`](file:///d:/kalvium/sem_5/sprint2/backend/cache/query_cache.py) | LRU embedding cache, TTL query cache, structlog, & metrics |
| 40 | Deployment, Documentation & Delivery              | Deployment + README                    | [`backend/app/main.py`](file:///d:/kalvium/sem_5/sprint2/backend/app/main.py) | Fast API (Uvicorn) & Next.js local server deployment & README |

---

# 57. 🎯 MVP Success Criteria
 
The project satisfies all of the following requirements:
 
### Authentication
 
* [x] Hospital ID login
* [x] Continue button
* [x] Staff file validation
* [x] Valid ID authorization
* [x] Invalid ID rejection
* [x] Protected backend APIs
* [x] Protected frontend routes
* [x] Logout
 
### Knowledge Base
 
* [x] Pre-loaded PDFs
* [x] Three document categories
* [x] Automatic PDF discovery
* [x] Document metadata
* [x] Document version/date handling
 
### Document Processing
 
* [x] PDF extraction
* [x] Cleaning
* [x] Chunking
* [x] Token-aware chunking
* [x] Metadata
* [x] Corpus validation
 
### Embeddings
 
* [x] Gemini & OpenAI embeddings
* [x] Batch embedding
* [x] Similarity metrics
* [x] Cost/token tracking
* [x] Embedding quality checks
 
### Retrieval
 
* [x] ChromaDB
* [x] Top-K search
* [x] Metadata filtering
* [x] Hybrid search
* [x] Re-ranking
* [x] Retrieval evaluation
 
### RAG
 
* [x] Prompt templates
* [x] Context injection
* [x] Grounded answers
* [x] Structured output
* [x] Citations
* [x] Refusal behavior
* [x] Conversational RAG
* [x] RAG evaluation
 
### Application
 
* [x] FastAPI
* [x] Next.js
* [x] Chat UI
* [x] Streaming
* [x] Admin upload/indexing
* [x] Logging
* [x] Caching
* [x] Monitoring
 
### Delivery
 
* [x] Tests
* [x] Environment configuration
* [x] Deployment
* [x] Documentation
* [x] Concept mapping

---

# 58. ⭐ Final Product

The final system will be:

> **A secure, RAG-powered Hospital Knowledge Assistant where authorized hospital staff log in using their Hospital ID, access a pre-loaded hospital knowledge base, ask natural-language questions, and receive grounded answers with source citations. The system uses document processing, token-aware chunking, embeddings, vector search, filtering, re-ranking, RAG, guardrails, conversational context, evaluation, streaming, monitoring, and deployment to demonstrate all 40 Sprint 2 concepts.**

The system prioritizes:

**Accuracy → Grounding → Traceability → Reliability**

over simply generating fluent answers.
