from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(prefix="/api/v1/internal", tags=["internal"])


@router.get("/health")
def internal_health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "scope": "internal",
        "app_name": settings.app_name,
        "environment": settings.app_env,
        "dependencies": {
            "database": "unchecked",
            "redis": "unchecked",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
