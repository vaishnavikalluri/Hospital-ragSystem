"""
API integration tests for FastAPI backend endpoints.
"""
import csv
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.app.config import get_settings
from backend.app.main import app


@pytest.fixture
def test_csv_file(monkeypatch):
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["hospital_id", "name"])
        writer.writerow(["H001", "Rahul Sharma"])
        writer.writerow(["ADMIN01", "Admin User"])
        path = f.name

    settings = get_settings()
    monkeypatch.setattr(settings, "hospital_staff_csv", path)
    monkeypatch.setattr(settings, "admin_hospital_ids", "ADMIN01")
    monkeypatch.setattr(settings, "jwt_secret_key", "test-secret-key-12345")

    yield path
    Path(path).unlink(missing_ok=True)


def test_health_check():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_auth_verify_success(test_csv_file):
    client = TestClient(app)
    response = client.post("/api/auth/verify", json={"hospital_id": "H001"})
    assert response.status_code == 200
    data = response.json()
    assert data["authorized"] is True
    assert data["name"] == "Rahul Sharma"
    assert data["is_admin"] is False
    assert "token" in data


def test_auth_verify_denied(test_csv_file):
    client = TestClient(app)
    response = client.post("/api/auth/verify", json={"hospital_id": "INVALID99"})
    assert response.status_code == 401
    assert "Access Denied" in response.json()["detail"]


def test_protected_routes_unauthorized():
    client = TestClient(app)
    # Chat requires auth
    chat_resp = client.post("/api/chat", json={"question": "What is protocol X?"})
    assert chat_resp.status_code == 403 or chat_resp.status_code == 401

    # Documents require auth
    docs_resp = client.get("/api/documents")
    assert docs_resp.status_code == 403 or docs_resp.status_code == 401


def test_admin_route_forbidden_for_normal_user(test_csv_file):
    client = TestClient(app)
    # Verify H001 to get normal token
    auth_resp = client.post("/api/auth/verify", json={"hospital_id": "H001"})
    token = auth_resp.json()["token"]

    headers = {"Authorization": f"Bearer {token}"}
    admin_resp = client.get("/api/admin/metrics", headers=headers)
    assert admin_resp.status_code == 403


def test_admin_upload_and_delete_pdf(test_csv_file, monkeypatch, tmp_path):
    import io
    import fitz
    from backend.embeddings.embedding_client import EmbeddingClient

    # Create dummy PDF in memory
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "Hospital Policy Circular Version 1.0\nEffective Date: 01/01/2025\nAll staff must follow standard sanitization procedures.")
    pdf_bytes = doc.write()
    doc.close()

    settings = get_settings()
    docs_dir = tmp_path / "documents"
    docs_dir.mkdir()
    chroma_dir = tmp_path / "chroma"
    chroma_dir.mkdir()

    monkeypatch.setattr(settings, "documents_dir", str(docs_dir))
    monkeypatch.setattr(settings, "chroma_data_dir", str(chroma_dir))
    monkeypatch.setattr(
        EmbeddingClient,
        "embed_texts",
        lambda self, texts: [[0.1] * 768 for _ in texts],
    )

    client = TestClient(app)
    # Login as admin
    auth_resp = client.post("/api/auth/verify", json={"hospital_id": "ADMIN01"})
    admin_token = auth_resp.json()["token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Upload PDF
    files = {"file": ("test_policy.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    data = {"document_type": "policy_circular"}
    upload_resp = client.post("/api/admin/documents/upload", headers=headers, files=files, data=data)
    assert upload_resp.status_code == 200
    upload_data = upload_resp.json()
    assert upload_data["success"] is True
    assert upload_data["filename"] == "test_policy.pdf"

    # Verify document listed in GET /api/documents
    docs_resp = client.get("/api/documents", headers=headers)
    assert docs_resp.status_code == 200
    doc_names = [d["name"] for d in docs_resp.json()["documents"]]
    assert "test_policy.pdf" in doc_names

    # Delete document
    del_resp = client.delete("/api/admin/documents/test_policy.pdf", headers=headers)
    assert del_resp.status_code == 200


def test_staff_can_query_admin_uploaded_pdf_and_staff_cannot_upload(test_csv_file, monkeypatch, tmp_path):
    import io
    import fitz
    from backend.embeddings.embedding_client import EmbeddingClient
    from backend.rag.rag_pipeline import RAGPipeline
    from backend.app.models import ChatResponse, SourceCitation

    # 1. Create dummy PDF
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "Hospital ICU Protocol Version 3.0\nEffective Date: 02/01/2025\nPatients must receive hourly vitals monitoring.")
    pdf_bytes = doc.write()
    doc.close()

    settings = get_settings()
    docs_dir = tmp_path / "documents"
    docs_dir.mkdir()
    chroma_dir = tmp_path / "chroma"
    chroma_dir.mkdir()

    monkeypatch.setattr(settings, "documents_dir", str(docs_dir))
    monkeypatch.setattr(settings, "chroma_data_dir", str(chroma_dir))
    monkeypatch.setattr(
        EmbeddingClient,
        "embed_texts",
        lambda self, texts: [[0.1] * 768 for _ in texts],
    )

    client = TestClient(app)

    # 2. Staff H001 tries to upload PDF -> MUST BE FORBIDDEN (403)
    staff_auth = client.post("/api/auth/verify", json={"hospital_id": "H001"}).json()
    staff_token = staff_auth["token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    files = {"file": ("icu_protocol.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    data = {"document_type": "clinical_protocol"}
    staff_upload = client.post("/api/admin/documents/upload", headers=staff_headers, files=files, data=data)
    assert staff_upload.status_code == 403
    assert "Admin access required" in staff_upload.json()["detail"]

    # 3. ADMIN01 uploads the PDF -> SUCCESS (200)
    admin_auth = client.post("/api/auth/verify", json={"hospital_id": "ADMIN01"}).json()
    admin_token = admin_auth["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    files = {"file": ("icu_protocol.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    admin_upload = client.post("/api/admin/documents/upload", headers=admin_headers, files=files, data=data)
    assert admin_upload.status_code == 200
    assert admin_upload.json()["success"] is True

    # 4. Staff H001 asks questions about the new PDF -> SUCCESS (200)
    # Mock RAG pipeline answer to simulate grounded retrieval
    monkeypatch.setattr(
        RAGPipeline,
        "answer",
        lambda self, question, conversation_history=None, document_type_filter=None: ChatResponse(
            answer="According to Hospital ICU Protocol Version 3.0, patients must receive hourly vitals monitoring.",
            has_sufficient_evidence=True,
            sources=[
                SourceCitation(
                    document="icu_protocol.pdf",
                    document_type="clinical_protocol",
                    page=1,
                    section="ICU Protocol",
                    chunk_id="chk_1",
                )
            ],
            retrieval_count=1,
            model_used="gemini-2.5-flash",
            tokens_used=120,
        ),
    )

    chat_resp = client.post(
        "/api/chat",
        headers=staff_headers,
        json={"question": "What is the vitals monitoring protocol in the ICU?"},
    )
    assert chat_resp.status_code == 200
    chat_data = chat_resp.json()
    assert "hourly vitals monitoring" in chat_data["answer"]
    assert chat_data["sources"][0]["document"] == "icu_protocol.pdf"

    # 5. Staff H001 views the PDF file via /api/documents/icu_protocol.pdf/file -> SUCCESS (200)
    file_resp = client.get(f"/api/documents/icu_protocol.pdf/file?token={staff_token}")
    assert file_resp.status_code == 200
    assert file_resp.headers["content-type"] == "application/pdf"
    assert file_resp.content == pdf_bytes




