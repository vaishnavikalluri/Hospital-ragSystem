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
