"""
Hospital ID-based authentication module.
Concept 1 — Hospital ID Authorization via CSV lookup.
Concept 35 — Backend API auth enforcement.

Flow:
  Hospital ID → CSV lookup → authorized/denied → JWT token
"""
from __future__ import annotations

import csv
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Optional

from jose import JWTError, jwt
from pydantic import BaseModel

from backend.app.config import Settings
from backend.monitoring.logger import get_logger

logger = get_logger(__name__)


class TokenPayload(BaseModel):
    hospital_id: str
    name: str
    is_admin: bool
    exp: Optional[datetime] = None


class HospitalAuth:
    """
    Handles Hospital ID validation against hospital_staff.csv and JWT issuance.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._staff: Dict[str, str] = {}  # hospital_id -> name
        self._loaded = False

    def _load_staff(self) -> None:
        """Load staff records from CSV. Raises clear errors on failure."""
        csv_path = self.settings.staff_csv_path

        if not csv_path.exists():
            logger.warning(
                "staff_csv_missing",
                path=str(csv_path),
                message="hospital_staff.csv not found — authentication will fail for all IDs",
            )
            self._staff = {}
            self._loaded = True
            return

        staff: Dict[str, str] = {}
        try:
            with open(csv_path, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                if reader.fieldnames is None or "hospital_id" not in reader.fieldnames:
                    raise ValueError(
                        f"hospital_staff.csv must have a 'hospital_id' column. "
                        f"Found: {reader.fieldnames}"
                    )
                for row in reader:
                    hid = row.get("hospital_id", "").strip().upper()
                    name = row.get("name", "").strip()
                    if hid and name:
                        staff[hid] = name

        except Exception as exc:
            logger.error("staff_csv_load_error", error=str(exc))
            raise RuntimeError(f"Failed to load hospital staff file: {exc}") from exc

        self._staff = staff
        self._loaded = True
        logger.info("staff_loaded", count=len(staff))

    def _ensure_loaded(self) -> None:
        if not self._loaded:
            self._load_staff()

    def reload(self) -> None:
        """Force-reload staff from CSV (used after admin updates)."""
        self._loaded = False
        self._load_staff()

    def verify_hospital_id(self, hospital_id: str) -> Optional[str]:
        """
        Check if hospital_id exists. Returns staff name or None.
        Raises RuntimeError if staff file is misconfigured.
        """
        self._ensure_loaded()
        uid = hospital_id.strip().upper()
        return self._staff.get(uid)

    def is_admin(self, hospital_id: str) -> bool:
        """Check if this hospital ID has admin privileges."""
        uid = hospital_id.strip().upper()
        return uid in self.settings.admin_ids_list

    def create_token(self, hospital_id: str, name: str) -> str:
        """Create a signed JWT for the given staff member."""
        expire = datetime.now(timezone.utc) + timedelta(hours=self.settings.jwt_expire_hours)
        payload = {
            "hospital_id": hospital_id.upper(),
            "name": name,
            "is_admin": self.is_admin(hospital_id),
            "exp": expire,
        }
        return jwt.encode(
            payload,
            self.settings.jwt_secret_key,
            algorithm=self.settings.jwt_algorithm,
        )

    def verify_token(self, token: str) -> Optional[TokenPayload]:
        """Decode and verify a JWT. Returns None on failure."""
        try:
            data = jwt.decode(
                token,
                self.settings.jwt_secret_key,
                algorithms=[self.settings.jwt_algorithm],
            )
            return TokenPayload(**data)
        except JWTError as exc:
            logger.warning("token_verification_failed", error=str(exc))
            return None

    def staff_file_exists(self) -> bool:
        return self.settings.staff_csv_path.exists()

    @property
    def staff_count(self) -> int:
        self._ensure_loaded()
        return len(self._staff)
