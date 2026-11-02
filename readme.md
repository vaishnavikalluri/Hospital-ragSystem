# 🏥 Hospital Knowledge Assistant

An AI-powered **Retrieval-Augmented Generation (RAG)** application that helps authorized hospital staff quickly find accurate, source-backed information from clinical protocols, drug interaction guidelines, and hospital policy documents.

The system uses document retrieval and LLM-based generation to provide grounded answers with citations while refusing to answer when sufficient supporting evidence is unavailable.

## 🎯 Key Features

- **Hospital ID Authentication** – Secure access for authorized hospital staff with role-based admin permissions.
- **Document Processing** – Automatically discovers and processes hospital PDFs using text extraction, cleaning, and token-aware chunking.
- **Embedding Generation** – Converts document chunks into vector representations for semantic search.
- **Vector Search** – Uses ChromaDB for similarity search, metadata filtering, and Top-K retrieval.
- **Hybrid Retrieval & Re-ranking** – Combines semantic and keyword-based retrieval to improve relevance.
- **Grounded AI Responses** – Generates answers using retrieved hospital documents rather than general model knowledge.
- **Source Citations** – Displays document names, page numbers, and available section information.
- **Hallucination Guardrails** – Refuses unsupported questions when sufficient evidence is unavailable.
- **Conversational RAG** – Supports follow-up questions with conversation context.
- **Admin Document Management** – Allows authorized administrators to upload and index new documents.
- **Streaming Responses** – Supports real-time answer generation.
- **Monitoring & Evaluation** – Includes structured logging, caching, retrieval evaluation, and RAG quality checks.

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, Lucide Icons |
| Backend | Python, FastAPI, Uvicorn |
| LLM | OpenAI API / Google Gemini |
| Embeddings | OpenAI Embeddings / Gemini Embeddings |
| RAG Framework | LangChain |
| Vector Database | ChromaDB |
| PDF Processing | PyMuPDF |
| Tokenization | Tiktoken |
| Authentication | Hospital ID, JWT |
| Testing | Pytest, HTTPX |
| Monitoring & Logging | Structlog |
| Version Control | Git, GitHub |

## 🏗️ System Architecture

```text
Authorized Hospital Staff
          |
          v
    Hospital ID Login
          |
          v
       Dashboard
          |
          v
      Ask Question
          |
          v
   Question Embedding
          |
          v
  ChromaDB Retrieval
          |
          v
 Filtering & Re-ranking
          |
          v
    Relevant Context
          |
          v
     LLM Generation
          |
          v
   Grounded Response
          |
          v
   Citations & Sources
```

## 📚 Knowledge Base

The application supports three categories of hospital documents:

- Clinical Protocols
- Drug Interaction Guidelines
- Policy Circulars

PDF documents are automatically discovered, processed, chunked, embedded, and indexed into ChromaDB. Document metadata is maintained to support retrieval and source attribution.

## 👥 User Roles

**Hospital Staff**
- Log in using an authorized Hospital ID.
- Ask questions about hospital documents.
- View grounded answers and source citations.
- Continue conversations with follow-up questions.
- Browse available documents.

**Hospital Admin**
- Access all staff features.
- Upload new hospital documents.
- Trigger document indexing.
- Manage and update the knowledge base.

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI or Google Gemini API key

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hospital-knowledge-assistant
```

### 2. Configure Environment Variables

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Add your API credentials and required configuration to `.env`.

### 3. Install Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Ingest Hospital Documents

```bash
python -m backend.ingest
```

To reset and re-index:

```bash
python -m backend.ingest --reset
```

### 5. Start the Backend

```bash
uvicorn backend.app.main:app --reload --port 8000
```

API Documentation: `http://localhost:8000/docs`

### 6. Start the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Web Application: `http://localhost:3000`

## 🔐 Authentication

The initial application uses Hospital ID-based authorization.

Staff access is validated against the hospital staff directory:

```text
data/hospital_staff.csv
```

Only authorized users can access protected application features. Administrative permissions are configured separately.

## 🧪 Testing

Run the automated test suite:

```bash
pytest
```

Tests cover authentication, document ingestion, embeddings, retrieval, RAG responses, refusal handling, and source citations.

## 📁 Project Structure

```text
hospital-knowledge-assistant/
│
├── frontend/           # Next.js application
│
├── backend/
│   ├── app/            # FastAPI application and routes
│   ├── auth/           # Authentication
│   ├── ingestion/      # Document processing
│   ├── embeddings/     # Embedding generation
│   ├── vectordb/       # ChromaDB integration
│   ├── retrieval/      # Search and re-ranking
│   ├── rag/            # RAG pipeline and prompts
│   └── evaluation/     # Retrieval and RAG evaluation
│
├── data/
│   ├── hospital_staff.csv
│   └── documents/
│       ├── clinical_protocols/
│       ├── drug_interaction_guidelines/
│       └── policy_circulars/
│
├── chroma_data/
├── tests/
├── .env.example
├── .gitignore
└── README.md
```

## 🛡️ Design Principles

- **Accuracy First:** Prioritize reliable information over fluent generation.
- **Grounded Responses:** Use retrieved hospital documents as the primary source of truth.
- **Traceability:** Provide citations for generated answers.
- **Security:** Restrict access to authorized hospital personnel.
- **Reliability:** Refuse unsupported questions instead of generating assumptions.

## ⚠️ Project Scope

This project is a hospital document-based AI knowledge assistant. It is not a hospital management system, patient record system, or replacement for medical professionals.

All generated responses are intended to support information retrieval and should not replace professional clinical judgment.

---

**Built as an end-to-end AI/RAG project demonstrating document processing, embeddings, vector search, retrieval optimization, grounded generation, evaluation, and full-stack application development.**
