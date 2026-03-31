from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.home import HomeResponse
from app.services.home_service import get_home_payload

router = APIRouter(prefix="/api/v1/public", tags=["public"])


@router.get("/hotels/{hotel_id}/home", response_model=HomeResponse)
def get_home(
    hotel_id: str,
    lang: str = Query(default="ko"),
    db: Session = Depends(get_db),
) -> HomeResponse:
    try:
        return get_home_payload(db, hotel_id=hotel_id, lang=lang)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
