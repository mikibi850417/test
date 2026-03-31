import json
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def write_audit(
    db: Session,
    *,
    actor: str,
    action: str,
    entity_type: str,
    entity_id: str | None,
    detail: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            audit_id=f"AUD_{uuid4().hex[:16].upper()}",
            actor=actor,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            detail_json=json.dumps(detail or {}, ensure_ascii=False),
        )
    )
