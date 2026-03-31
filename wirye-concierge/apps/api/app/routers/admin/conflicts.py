from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.conflict import ConflictLog
from app.schemas.admin import ResolveConflictRequest
from app.services.audit_service import write_audit

router = APIRouter(prefix="/api/v1/admin/conflicts", tags=["admin"])


@router.get("")
def list_conflicts(
    status: str | None = None,
    _: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[dict]:
    stmt = select(ConflictLog).order_by(ConflictLog.created_at.desc())
    if status:
        stmt = stmt.where(ConflictLog.status == status)
    conflicts = db.execute(stmt).scalars().all()
    return [
        {
            "conflict_id": item.conflict_id,
            "hotel_id": item.hotel_id,
            "entity_type": item.entity_type,
            "entity_id": item.entity_id,
            "field_name": item.field_name,
            "status": item.status,
            "value_a": item.value_a,
            "value_b": item.value_b,
            "recommended_action": item.recommended_action,
            "resolved_note": item.resolved_note,
            "resolved_by": item.resolved_by,
            "resolved_at": item.resolved_at,
        }
        for item in conflicts
    ]


@router.patch("/{conflict_id}/resolve")
def resolve_conflict(
    conflict_id: str,
    payload: ResolveConflictRequest,
    subject: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    conflict = db.get(ConflictLog, conflict_id)
    if conflict is None:
        raise HTTPException(status_code=404, detail="conflict not found")
    if conflict.status == "resolved":
        raise HTTPException(status_code=409, detail="conflict already resolved")

    conflict.status = "resolved"
    conflict.resolved_value = payload.resolvedValue
    conflict.resolved_note = payload.note or payload.resolution
    conflict.resolved_by = subject
    conflict.resolved_at = datetime.now(timezone.utc)
    write_audit(
        db,
        actor=subject,
        action="conflict_resolve",
        entity_type="conflicts_log",
        entity_id=conflict_id,
        detail={"resolution": payload.resolution, "resolved_value": payload.resolvedValue},
    )
    db.commit()
    db.refresh(conflict)

    return {
        "conflict_id": conflict.conflict_id,
        "status": conflict.status,
        "resolved_by": conflict.resolved_by,
        "resolved_at": conflict.resolved_at,
    }
