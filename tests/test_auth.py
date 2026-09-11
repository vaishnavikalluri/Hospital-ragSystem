"""
Tests for Hospital ID authentication module.
"""
import csv
import tempfile
from pathlib import Path
import pytest

from backend.app.config import Settings
from backend.auth.hospital_auth import HospitalAuth


@pytest.fixture
def temp_staff_csv():
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["hospital_id", "name"])
        writer.writerow(["H001", "Rahul Sharma"])
        writer.writerow(["H002", "Priya Kumar"])
        writer.writerow(["ADMIN01", "Admin User"])
        f_path = f.name

    yield Path(f_path)
    Path(f_path).unlink(missing_ok=True)


def test_auth_valid_id(temp_staff_csv):
    settings = Settings(
        hospital_staff_csv=str(temp_staff_csv),
        admin_hospital_ids="ADMIN01",
        jwt_secret_key="test-secret-key",
    )
    auth = HospitalAuth(settings)

    name = auth.verify_hospital_id("H001")
    assert name == "Rahul Sharma"
    assert not auth.is_admin("H001")

    admin_name = auth.verify_hospital_id("admin01")
    assert admin_name == "Admin User"
    assert auth.is_admin("ADMIN01")


def test_auth_invalid_id(temp_staff_csv):
    settings = Settings(
        hospital_staff_csv=str(temp_staff_csv),
        jwt_secret_key="test-secret-key",
    )
    auth = HospitalAuth(settings)

    assert auth.verify_hospital_id("H999") is None


def test_jwt_token_creation_and_verification(temp_staff_csv):
    settings = Settings(
        hospital_staff_csv=str(temp_staff_csv),
        admin_hospital_ids="ADMIN01",
        jwt_secret_key="test-secret-key",
    )
    auth = HospitalAuth(settings)

    token = auth.create_token("H001", "Rahul Sharma")
    assert token is not None

    payload = auth.verify_token(token)
    assert payload is not None
    assert payload.hospital_id == "H001"
    assert payload.name == "Rahul Sharma"
    assert payload.is_admin is False


def test_missing_staff_file():
    settings = Settings(
        hospital_staff_csv="./non_existent_staff.csv",
        jwt_secret_key="test-secret-key",
    )
    auth = HospitalAuth(settings)
    assert auth.verify_hospital_id("H001") is None
    assert not auth.staff_file_exists()
