from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.routers.admin.auth import router as admin_auth_router
from app.routers.admin.audit_logs import router as admin_audit_logs_router
from app.routers.admin.conflicts import router as admin_conflicts_router
from app.routers.admin.devices import router as admin_devices_router
from app.routers.admin.health import router as admin_health_router
from app.routers.admin.hotels import router as admin_hotels_router
from app.routers.admin.imports import router as admin_imports_router
from app.routers.admin.nearby_places import router as admin_nearby_places_router
from app.routers.admin.publish import router as admin_publish_router
from app.routers.internal.health import router as internal_health_router
from app.routers.public.content import router as public_content_router
from app.routers.public.health import router as public_health_router
from app.routers.public.home import router as public_home_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.include_router(public_health_router)
app.include_router(public_home_router)
app.include_router(public_content_router)
app.include_router(admin_auth_router)
app.include_router(admin_audit_logs_router)
app.include_router(admin_conflicts_router)
app.include_router(admin_devices_router)
app.include_router(admin_health_router)
app.include_router(admin_hotels_router)
app.include_router(admin_imports_router)
app.include_router(admin_nearby_places_router)
app.include_router(admin_publish_router)
app.include_router(internal_health_router)
