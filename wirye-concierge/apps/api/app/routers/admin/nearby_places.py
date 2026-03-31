from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.nearby import NearbyPlace
from app.schemas.admin import NearbyPlaceUpsert
from app.services.audit_service import write_audit

router = APIRouter(prefix="/api/v1/admin/nearby-places", tags=["admin"])


@router.get("")
def list_nearby_places(
    hotel_id: str | None = None,
    _: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[dict]:
    stmt = select(NearbyPlace)
    if hotel_id:
        stmt = stmt.where(NearbyPlace.hotel_id == hotel_id)
    rows = db.execute(stmt.order_by(NearbyPlace.category.asc().nulls_last(), NearbyPlace.place_name.asc())).scalars().all()
    return [
        {
            "place_id": row.place_id,
            "hotel_id": row.hotel_id,
            "place_name": row.place_name,
            "category": row.category,
            "subcategory": row.subcategory,
            "address": row.address,
            "hotel_distance_km": float(row.hotel_distance_km) if row.hotel_distance_km is not None else None,
            "walk_time_min": row.walk_time_min,
            "drive_time_min": row.drive_time_min,
            "verification_status": row.verification_status,
            "source_confidence": row.source_confidence,
            "last_verified_at": row.last_verified_at,
        }
        for row in rows
    ]


@router.post("")
def create_nearby_place(
    payload: NearbyPlaceUpsert,
    subject: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    place_id = payload.place_id or f"PLACE_{uuid4().hex[:12].upper()}"
    if db.get(NearbyPlace, place_id) is not None:
        raise HTTPException(status_code=409, detail="place_id already exists")

    row = NearbyPlace(
        place_id=place_id,
        hotel_id=payload.hotel_id,
        status="active",
        place_name=payload.place_name,
        category=payload.category,
        subcategory=payload.subcategory,
        description_short=payload.description_short,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        hotel_distance_km=payload.hotel_distance_km,
        walk_time_min=payload.walk_time_min,
        drive_time_min=payload.drive_time_min,
        transit_time_min=payload.transit_time_min,
        tags_csv=payload.tags_csv,
        verification_status=payload.verification_status,
        source_confidence=payload.source_confidence,
        note=payload.note,
    )
    db.add(row)
    write_audit(
        db,
        actor=subject,
        action="nearby_place_create",
        entity_type="nearby_place",
        entity_id=place_id,
        detail=payload.model_dump(),
    )
    db.commit()
    return {"place_id": place_id, "status": "created"}


@router.patch("/{place_id}")
def update_nearby_place(
    place_id: str,
    payload: NearbyPlaceUpsert,
    subject: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    row = db.get(NearbyPlace, place_id)
    if row is None:
        raise HTTPException(status_code=404, detail="nearby place not found")

    for key, value in payload.model_dump(exclude_none=True).items():
        if key == "hotel_id":
            row.hotel_id = value
        elif key == "place_name":
            row.place_name = value
        elif hasattr(row, key):
            setattr(row, key, value)

    write_audit(
        db,
        actor=subject,
        action="nearby_place_update",
        entity_type="nearby_place",
        entity_id=place_id,
        detail=payload.model_dump(exclude_none=True),
    )
    db.commit()
    return {"place_id": place_id, "status": "updated"}
