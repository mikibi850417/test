from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/health")
def admin_health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "scope": "admin",
        "app_name": settings.app_name,
        "environment": settings.app_env,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
