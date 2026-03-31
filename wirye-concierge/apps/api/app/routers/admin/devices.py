from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.device import KioskDevice

router = APIRouter(prefix="/api/v1/admin/devices", tags=["admin"])


@router.get("")
def list_devices(_: str = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(select(KioskDevice).order_by(KioskDevice.created_at.desc())).scalars().all()
    return [
        {
            "device_id": row.device_id,
            "hotel_id": row.hotel_id,
            "device_name": row.device_name,
            "status": row.status,
            "current_url": row.current_url,
            "app_version": row.app_version,
            "content_version": row.content_version,
            "last_seen_at": row.last_seen_at,
            "created_at": row.created_at,
        }
        for row in rows
    ]
