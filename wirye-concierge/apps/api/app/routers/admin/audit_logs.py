import json

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.audit import AuditLog

router = APIRouter(prefix="/api/v1/admin/audit-logs", tags=["admin"])


@router.get("")
def list_audit_logs(_: str = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(500)).scalars().all()
    return [
        {
            "audit_id": row.audit_id,
            "actor": row.actor,
            "action": row.action,
            "entity_type": row.entity_type,
            "entity_id": row.entity_id,
            "detail": json.loads(row.detail_json or "{}"),
            "created_at": row.created_at,
        }
        for row in rows
    ]
