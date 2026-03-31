from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.public_content_service import (
    get_dining,
    get_emergency,
    get_facilities,
    get_nearby_place_detail,
    get_nearby_places,
    get_notices,
    get_routes_for_place,
    get_services,
    get_snapshot,
    get_transport,
    search_faq,
)

router = APIRouter(prefix="/api/v1/public", tags=["public"])


@router.get("/hotels/{hotel_id}/dining")
def public_dining(hotel_id: str, lang: str = Query(default="ko"), db: Session = Depends(get_db)) -> dict:
    return get_dining(db, hotel_id, lang)


@router.get("/hotels/{hotel_id}/facilities")
def public_facilities(
    hotel_id: str, lang: str = Query(default="ko"), db: Session = Depends(get_db)
) -> dict:
    return get_facilities(db, hotel_id, lang)


@router.get("/hotels/{hotel_id}/services")
def public_services(hotel_id: str, lang: str = Query(default="ko"), db: Session = Depends(get_db)) -> dict:
    return get_services(db, hotel_id, lang)


@router.get("/hotels/{hotel_id}/transport")
def public_transport(hotel_id: str, lang: str = Query(default="ko"), db: Session = Depends(get_db)) -> dict:
    return get_transport(db, hotel_id, lang)


@router.get("/hotels/{hotel_id}/nearby-places")
def public_nearby_places(
    hotel_id: str,
    lang: str = Query(default="ko"),
    category: str | None = None,
    subcategory: str | None = None,
    tag: str | None = None,
    sort: str | None = Query(default="distance"),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> dict:
    return get_nearby_places(db, hotel_id, lang, category, subcategory, tag, sort, limit)


@router.get("/hotels/{hotel_id}/nearby-places/{place_id}")
def public_nearby_place_detail(
    hotel_id: str, place_id: str, lang: str = Query(default="ko"), db: Session = Depends(get_db)
) -> dict:
    try:
        return get_nearby_place_detail(db, hotel_id, place_id, lang)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/hotels/{hotel_id}/routes/{place_id}")
def public_routes(
    hotel_id: str, place_id: str, lang: str = Query(default="ko"), db: Session = Depends(get_db)
) -> dict:
    return get_routes_for_place(db, hotel_id, place_id, lang)


@router.get("/hotels/{hotel_id}/emergency")
def public_emergency(
    hotel_id: str, lang: str = Query(default="ko"), db: Session = Depends(get_db)
) -> dict:
    return get_emergency(db, hotel_id, lang)


@router.get("/hotels/{hotel_id}/notices")
def public_notices(hotel_id: str, lang: str = Query(default="ko"), db: Session = Depends(get_db)) -> dict:
    return get_notices(db, hotel_id, lang)


@router.get("/hotels/{hotel_id}/faq/search")
def public_faq_search(
    hotel_id: str,
    q: str = Query(default=""),
    lang: str = Query(default="ko"),
    db: Session = Depends(get_db),
) -> dict:
    return search_faq(db, hotel_id, lang, q)


@router.get("/hotels/{hotel_id}/snapshot")
def public_snapshot(hotel_id: str, lang: str = Query(default="ko"), db: Session = Depends(get_db)) -> dict:
    return get_snapshot(db, hotel_id, lang)
