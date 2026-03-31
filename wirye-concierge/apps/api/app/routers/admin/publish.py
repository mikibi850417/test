from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import require_admin
from app.db.session import get_db
from app.models.conflict import ConflictLog
from app.models.publish import PublishVersion
from app.schemas.admin import PublishRequest, PublishResponse
from app.services.audit_service import write_audit
from app.services.public_content_service import build_snapshot_payload
from app.services.snapshot_store_service import write_snapshot_payload

router = APIRouter(prefix="/api/v1/admin/publish", tags=["admin"])


@router.get("/versions")
def list_publish_versions(
    _: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[dict]:
    stmt = select(PublishVersion).order_by(PublishVersion.version_no.desc())
    versions = db.execute(stmt).scalars().all()
    return [
        {
            "publish_version_id": item.publish_version_id,
            "hotel_id": item.hotel_id,
            "version_no": item.version_no,
            "status": item.status,
            "snapshot_path": item.snapshot_path,
            "snapshot_checksum": item.snapshot_checksum,
            "notes": item.notes,
            "created_at": item.created_at,
            "published_at": item.published_at,
        }
        for item in versions
    ]


@router.post("", response_model=PublishResponse)
def publish_data(
    payload: PublishRequest,
    subject: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> PublishResponse:
    open_conflict_count = db.execute(
        select(func.count()).select_from(ConflictLog).where(
            ConflictLog.hotel_id == payload.hotelId, ConflictLog.status == "open"
        )
    ).scalar_one()
    if open_conflict_count > 0:
        raise HTTPException(status_code=409, detail="publish blocked by open conflicts")

    latest = db.execute(
        select(func.max(PublishVersion.version_no)).where(PublishVersion.hotel_id == payload.hotelId)
    ).scalar_one()
    next_version = (latest or 0) + 1

    settings = get_settings()
    now = datetime.now(timezone.utc)
    try:
        snapshot_payload = build_snapshot_payload(
            db=db,
            hotel_id=payload.hotelId,
            lang="ko",
            publish_version=next_version,
            generated_at=now,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    try:
        snapshot_path, snapshot_checksum = write_snapshot_payload(
            payload=snapshot_payload,
            snapshot_dir=settings.snapshot_dir,
            hotel_id=payload.hotelId,
            version_no=next_version,
        )
    except OSError as exc:
        raise HTTPException(status_code=500, detail="failed to persist snapshot file") from exc

    record = PublishVersion(
        publish_version_id=f"PUB_{uuid4().hex[:12].upper()}",
        hotel_id=payload.hotelId,
        version_no=next_version,
        status="published",
        snapshot_path=snapshot_path,
        snapshot_checksum=snapshot_checksum,
        notes=payload.note,
        published_at=now,
    )
    db.add(record)
    write_audit(
        db,
        actor=subject,
        action="publish_execute",
        entity_type="publish_versions",
        entity_id=record.publish_version_id,
        detail={
            "hotel_id": payload.hotelId,
            "version_no": next_version,
            "note": payload.note,
            "snapshot_path": snapshot_path,
            "snapshot_checksum": snapshot_checksum,
        },
    )
    db.commit()
    db.refresh(record)
    return PublishResponse(
        publish_version_id=record.publish_version_id,
        hotel_id=record.hotel_id,
        version_no=record.version_no,
        status=record.status,
        snapshot_path=record.snapshot_path,
        snapshot_checksum=record.snapshot_checksum,
        published_at=record.published_at or now,
    )
