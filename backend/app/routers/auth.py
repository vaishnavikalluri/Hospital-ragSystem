"""
Authentication API router.
POST /api/auth/verify  — Hospital ID login
GET  /api/auth/me      — Get current user info
POST /api/auth/logout  — Logout (client-side token deletion)
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.config import get_settings
from backend.app.dependencies import get_auth, get_current_user
from backend.app.models import AuthRequest, AuthResponse, StaffMember
from backend.auth.hospital_auth import HospitalAuth, TokenPayload
from backend.monitoring.logger import get_logger
from backend.monitoring.metrics import get_metrics

logger = get_logger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/verify", response_model=AuthResponse)
async def verify_hospital_id(
    request: AuthRequest,
    auth: HospitalAuth = Depends(get_auth),
) -> AuthResponse:
    """
    Verify a Hospital ID against hospital_staff.csv.
    Returns a JWT token on success.
    Concept 1 — Hospital ID Authorization
    """
    metrics = get_metrics()
    hospital_id = request.hospital_id.strip().upper()

    # Check if staff file exists
    if not auth.staff_file_exists():
        logger.error("staff_file_missing")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Hospital staff configuration is not available. "
                "Please contact the system administrator."
            ),
        )

    name = auth.verify_hospital_id(hospital_id)

    if name is None:
        metrics.record_auth(success=False)
        logger.warning("auth_denied", hospital_id=hospital_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Access Denied. Hospital ID not found. "
                "You are not authorized to access this application."
            ),
        )

    is_admin = auth.is_admin(hospital_id)
    token = auth.create_token(hospital_id, name)

    metrics.record_auth(success=True)
    logger.info("auth_success", hospital_id=hospital_id, is_admin=is_admin)

    return AuthResponse(
        authorized=True,
        hospital_id=hospital_id,
        name=name,
        is_admin=is_admin,
        token=token,
        message=f"Welcome, {name}",
    )


@router.get("/me", response_model=StaffMember)
async def get_me(current_user: TokenPayload = Depends(get_current_user)) -> StaffMember:
    """Return current authenticated user info."""
    settings = get_settings()
    return StaffMember(
        hospital_id=current_user.hospital_id,
        name=current_user.name,
        is_admin=current_user.is_admin,
    )


@router.post("/logout")
async def logout(current_user: TokenPayload = Depends(get_current_user)) -> dict:
    """
    Logout endpoint. JWT is stateless — client must delete the token.
    """
    logger.info("user_logout", hospital_id=current_user.hospital_id)
    return {"message": "Logged out successfully. Please clear your session."}
