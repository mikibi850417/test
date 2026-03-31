from fastapi import APIRouter, Depends, HTTPException

from app.core.config import get_settings
from app.core.security import create_access_token, require_admin
from app.schemas.admin import AdminLoginRequest, AdminLoginResponse, AdminMeResponse

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.post("/auth/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest) -> AdminLoginResponse:
    settings = get_settings()
    if (
        payload.email.lower() != settings.admin_bootstrap_email.lower()
        or payload.password != settings.admin_bootstrap_password
    ):
        raise HTTPException(status_code=401, detail="invalid credentials")

    token = create_access_token(subject=payload.email.lower())
    return AdminLoginResponse(access_token=token)


@router.get("/me", response_model=AdminMeResponse)
def admin_me(subject: str = Depends(require_admin)) -> AdminMeResponse:
    return AdminMeResponse(email=subject, role="super_admin")
