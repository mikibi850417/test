from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.hotel import HotelMaster
from app.schemas.admin import HotelPatchRequest
from app.services.audit_service import write_audit

router = APIRouter(prefix="/api/v1/admin/hotels", tags=["admin"])


@router.get("/{hotel_id}")
def get_hotel(hotel_id: str, _: str = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    row = db.get(HotelMaster, hotel_id)
    if row is None:
        raise HTTPException(status_code=404, detail="hotel not found")
    return {
        "hotel_id": row.hotel_id,
        "status": row.status,
        "name_ko": row.name_ko,
        "name_en": row.name_en,
        "address_road": row.address_road,
        "phone_main": row.phone_main,
        "check_in_time": row.check_in_time,
        "check_out_time": row.check_out_time,
        "verification_status": row.verification_status,
        "last_verified_at": row.last_verified_at,
        "note": row.note,
    }


@router.patch("/{hotel_id}")
def patch_hotel(
    hotel_id: str,
    payload: HotelPatchRequest,
    subject: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    row = db.get(HotelMaster, hotel_id)
    if row is None:
        raise HTTPException(status_code=404, detail="hotel not found")

    update_fields = payload.model_dump(exclude_none=True)
    for key, value in update_fields.items():
        setattr(row, key, value)

    write_audit(
        db,
        actor=subject,
        action="hotel_update",
        entity_type="hotel_master",
        entity_id=hotel_id,
        detail=update_fields,
    )
    db.commit()
    return {"hotel_id": hotel_id, "status": "updated"}
