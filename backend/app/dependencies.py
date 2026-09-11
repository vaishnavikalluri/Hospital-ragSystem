"""
JWT-based authentication dependencies for FastAPI.
Concept 35 — Backend API; Concept 1 — Auth & Authorization
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.app.config import get_settings
from backend.auth.hospital_auth import HospitalAuth, TokenPayload

security = HTTPBearer()
_auth = None


def get_auth() -> HospitalAuth:
    global _auth
    if _auth is None:
        _auth = HospitalAuth(get_settings())
    return _auth


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth: HospitalAuth = Depends(get_auth),
) -> TokenPayload:
    """
    FastAPI dependency — verifies Bearer JWT token.
    Raises 401 if token is missing, expired, or invalid.
    """
    token = credentials.credentials
    payload = auth.verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


async def get_admin_user(
    current_user: TokenPayload = Depends(get_current_user),
) -> TokenPayload:
    """
    FastAPI dependency — requires admin privileges.
    Raises 403 if user is not an admin.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required for this operation.",
        )
    return current_user
