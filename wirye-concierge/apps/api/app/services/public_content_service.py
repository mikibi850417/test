from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.dining import HotelDining
from app.models.emergency import EmergencySafety
from app.models.facility import HotelFacility
from app.models.faq import FaqIntent
from app.models.hotel_service import HotelService
from app.models.nearby import NearbyPlace
from app.models.nearby_route import NearbyRoute
from app.models.notice import TemporaryNotice
from app.models.publish import PublishVersion
from app.models.transport import TransportAccess
from app.services.home_service import get_home_payload
from app.services.snapshot_store_service import read_snapshot_payload


def _float(value: Decimal | float | None) -> float | None:
    if value is None:
        return None
    return float(value)


def _meta(db: Session, hotel_id: str, lang: str) -> dict:
    version_stmt = (
        select(PublishVersion.version_no)
        .where(PublishVersion.hotel_id == hotel_id)
        .order_by(PublishVersion.version_no.desc())
        .limit(1)
    )
    version = db.execute(version_stmt).scalar_one_or_none()
    return {
        "hotel_id": hotel_id,
        "publish_version": version,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "language": lang,
    }


def _latest_publish(db: Session, hotel_id: str) -> PublishVersion | None:
    stmt = (
        select(PublishVersion)
        .where(PublishVersion.hotel_id == hotel_id)
        .order_by(PublishVersion.version_no.desc())
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none()


def get_dining(db: Session, hotel_id: str, lang: str) -> dict:
    rows = db.execute(
        select(HotelDining).where(HotelDining.hotel_id == hotel_id).order_by(HotelDining.venue_name.asc())
    ).scalars().all()
    return {
        "meta": _meta(db, hotel_id, lang),
        "items": [
            {
                "dining_id": row.dining_id,
                "venue_name_kr": row.venue_name,
                "venue_name_en": None,
                "meal_types": [
                    name
                    for name, flag in (
                        ("breakfast", row.breakfast_yn),
                        ("lunch", row.lunch_yn),
                        ("dinner", row.dinner_yn),
                        ("bar", row.bar_yn),
                    )
                    if flag
                ],
                "operating_hours": ", ".join(
                    value
                    for value in [
                        row.hours_mon,
                        row.hours_tue,
                        row.hours_wed,
                        row.hours_thu,
                        row.hours_fri,
                        row.hours_sat,
                        row.hours_sun,
                    ]
                    if value
                )
                or None,
                "price_info": row.pricing_notes,
                "source_confidence": row.source_confidence,
                "last_verified_at": row.last_verified_at,
            }
            for row in rows
        ],
    }


def get_facilities(db: Session, hotel_id: str, lang: str) -> dict:
    rows = db.execute(
        select(HotelFacility)
        .where(HotelFacility.hotel_id == hotel_id)
        .order_by(HotelFacility.facility_name.asc())
    ).scalars().all()
    return {
        "meta": _meta(db, hotel_id, lang),
        "items": [
            {
                "facility_id": row.facility_id,
                "facility_name": row.facility_name,
                "facility_type": row.facility_type,
                "floor_location": row.floor_location,
                "description": row.description,
                "fee_required_yn": row.fee_required_yn,
                "fee_note": row.fee_note,
                "age_limit_min": row.age_limit_min,
                "age_policy_note": row.age_policy_note,
                "phone": row.phone,
                "source_confidence": row.source_confidence,
                "last_verified_at": row.last_verified_at,
            }
            for row in rows
        ],
    }


def get_services(db: Session, hotel_id: str, lang: str) -> dict:
    rows = db.execute(
        select(HotelService).where(HotelService.hotel_id == hotel_id).order_by(HotelService.service_name.asc())
    ).scalars().all()
    return {
        "meta": _meta(db, hotel_id, lang),
        "items": [
            {
                "service_id": row.service_id,
                "service_name": row.service_name,
                "service_category": row.service_category,
                "request_channel": row.request_channel,
                "service_hours": row.service_hours,
                "reservation_required_yn": row.reservation_required_yn,
                "fee_required_yn": row.fee_required_yn,
                "fee_note": row.fee_note,
                "language_support_csv": row.language_support_csv,
                "service_note": row.service_note,
                "phone": row.phone,
                "source_confidence": row.source_confidence,
                "last_verified_at": row.last_verified_at,
            }
            for row in rows
        ],
    }


def get_transport(db: Session, hotel_id: str, lang: str) -> dict:
    rows = db.execute(
        select(TransportAccess)
        .where(TransportAccess.hotel_id == hotel_id)
        .order_by(TransportAccess.recommended_yn.desc(), TransportAccess.duration_min.asc())
    ).scalars().all()
    return {
        "meta": _meta(db, hotel_id, lang),
        "items": [
            {
                "transport_id": row.transport_id,
                "origin_name": row.origin_name,
                "origin_type": row.origin_type,
                "transport_mode": row.transport_mode,
                "recommended_yn": row.recommended_yn,
                "distance_km": _float(row.distance_km),
                "duration_min": row.duration_min,
                "fare_note": row.fare_note,
                "first_service_time": row.first_service_time,
                "last_service_time": row.last_service_time,
                "route_detail": row.route_detail,
                "source_confidence": row.source_confidence,
                "last_verified_at": row.last_verified_at,
            }
            for row in rows
        ],
    }


def get_nearby_places(
    db: Session,
    hotel_id: str,
    lang: str,
    category: str | None,
    subcategory: str | None,
    tag: str | None,
    sort: str | None,
    limit: int,
) -> dict:
    stmt: Select[tuple[NearbyPlace]] = select(NearbyPlace).where(NearbyPlace.hotel_id == hotel_id)
    if category:
        stmt = stmt.where(NearbyPlace.category == category)
    if subcategory:
        stmt = stmt.where(NearbyPlace.subcategory == subcategory)
    if tag:
        stmt = stmt.where(NearbyPlace.tags_csv.ilike(f"%{tag}%"))

    if sort == "name":
        stmt = stmt.order_by(NearbyPlace.place_name.asc())
    elif sort == "distance":
        stmt = stmt.order_by(NearbyPlace.hotel_distance_km.asc().nulls_last())
    else:
        stmt = stmt.order_by(NearbyPlace.category.asc().nulls_last(), NearbyPlace.place_name.asc())

    rows = db.execute(stmt.limit(limit)).scalars().all()

    return {
        "meta": _meta(db, hotel_id, lang),
        "items": [
            {
                "place_id": row.place_id,
                "name_kr": row.place_name,
                "name_en": None,
                "category": row.category,
                "subcategory": row.subcategory,
                "short_desc": row.description_short,
                "address": row.address,
                "distance_m_display": _float(row.hotel_distance_km) * 1000
                if row.hotel_distance_km is not None
                else None,
                "walk_minutes_display": row.walk_time_min,
                "drive_minutes_display": row.drive_time_min,
                "verification_status": row.verification_status,
                "last_verified_at": row.last_verified_at,
            }
            for row in rows
        ],
    }


def get_nearby_place_detail(db: Session, hotel_id: str, place_id: str, lang: str) -> dict:
    row = db.get(NearbyPlace, place_id)
    if row is None or row.hotel_id != hotel_id:
        raise ValueError("nearby place not found")

    return {
        "meta": _meta(db, hotel_id, lang),
        "item": {
            "place_id": row.place_id,
            "name_kr": row.place_name,
            "name_en": None,
            "category": row.category,
            "subcategory": row.subcategory,
            "short_desc": row.description_short,
            "address": row.address,
            "latitude": _float(row.latitude),
            "longitude": _float(row.longitude),
            "distance_km": _float(row.hotel_distance_km),
            "walk_time_min": row.walk_time_min,
            "drive_time_min": row.drive_time_min,
            "transit_time_min": row.transit_time_min,
            "tags_csv": row.tags_csv,
            "source_confidence": row.source_confidence,
            "verification_status": row.verification_status,
            "last_verified_at": row.last_verified_at,
            "note": row.note,
        },
    }


def get_routes_for_place(db: Session, hotel_id: str, place_id: str, lang: str) -> dict:
    rows = db.execute(
        select(NearbyRoute)
        .where(NearbyRoute.hotel_id == hotel_id, NearbyRoute.destination_place_id == place_id)
        .order_by(NearbyRoute.estimated_duration_min.asc().nulls_last())
    ).scalars().all()
    return {
        "meta": _meta(db, hotel_id, lang),
        "items": [
            {
                "route_id": row.route_id,
                "destination_place_id": row.destination_place_id,
                "start_point": row.start_point,
                "transport_mode": row.transport_mode,
                "estimated_duration_min": row.estimated_duration_min,
                "steps": [step for step in [row.step_1, row.step_2, row.step_3, row.step_4] if step],
                "stairs_yn": row.stairs_yn,
                "elevator_yn": row.elevator_yn,
                "wheelchair_note": row.wheelchair_note,
                "source_confidence": row.source_confidence,
                "last_verified_at": row.last_verified_at,
            }
            for row in rows
        ],
    }


def get_emergency(db: Session, hotel_id: str, lang: str) -> dict:
    rows = db.execute(
        select(EmergencySafety)
        .where(EmergencySafety.hotel_id == hotel_id)
        .order_by(EmergencySafety.category.asc().nulls_last(), EmergencySafety.contact_name.asc())
    ).scalars().all()
    return {
        "meta": _meta(db, hotel_id, lang),
        "items": [
            {
                "emergency_id": row.emergency_id,
                "contact_name": row.contact_name,
                "category": row.category,
                "phone": row.phone,
                "address": row.address,
                "hotel_distance_km": _float(row.hotel_distance_km),
                "drive_time_min": row.drive_time_min,
                "available_24h_yn": row.available_24h_yn,
                "language_support_note": row.language_support_note,
                "description": row.description,
                "source_confidence": row.source_confidence,
                "last_verified_at": row.last_verified_at,
            }
            for row in rows
        ],
    }


def get_notices(db: Session, hotel_id: str, lang: str) -> dict:
    now = datetime.now(timezone.utc)
    rows = db.execute(
        select(TemporaryNotice)
        .where(TemporaryNotice.hotel_id == hotel_id)
        .where(or_(TemporaryNotice.start_at.is_(None), TemporaryNotice.start_at <= now))
        .where(or_(TemporaryNotice.end_at.is_(None), TemporaryNotice.end_at >= now))
        .order_by(TemporaryNotice.created_at.desc())
    ).scalars().all()
    return {
        "meta": _meta(db, hotel_id, lang),
        "items": [
            {
                "notice_id": row.notice_id,
                "title": row.notice_title,
                "body": row.notice_body,
                "start_at": row.start_at,
                "end_at": row.end_at,
                "impact_level": row.impact_level,
                "target_type": row.target_type,
                "target_id": row.target_id,
                "source_confidence": row.source_confidence,
                "last_verified_at": row.last_verified_at,
            }
            for row in rows
        ],
    }


def search_faq(db: Session, hotel_id: str, lang: str, query: str) -> dict:
    q = query.strip()
    stmt = select(FaqIntent).where(FaqIntent.hotel_id == hotel_id)
    if q:
        stmt = stmt.where(
            or_(
                FaqIntent.user_question_example_ko.ilike(f"%{q}%"),
                FaqIntent.user_question_example_en.ilike(f"%{q}%"),
                FaqIntent.answer_template_ko.ilike(f"%{q}%"),
                FaqIntent.answer_template_en.ilike(f"%{q}%"),
            )
        )
    rows = db.execute(stmt.order_by(FaqIntent.intent_group.asc().nulls_last())).scalars().all()
    return {
        "meta": _meta(db, hotel_id, lang),
        "items": [
            {
                "intent_id": row.intent_id,
                "intent_group": row.intent_group,
                "question_example_ko": row.user_question_example_ko,
                "question_example_en": row.user_question_example_en,
                "answer_template_ko": row.answer_template_ko,
                "answer_template_en": row.answer_template_en,
                "escalation_required_yn": row.escalation_required_yn,
                "note": row.note,
            }
            for row in rows
        ],
    }


def build_snapshot_payload(
    db: Session,
    hotel_id: str,
    lang: str,
    publish_version: int | None = None,
    generated_at: datetime | None = None,
) -> dict:
    snapshot_meta = _meta(db, hotel_id, lang)
    if publish_version is not None:
        snapshot_meta["publish_version"] = publish_version
    generated_ts = generated_at or datetime.now(timezone.utc)
    snapshot_meta["generated_at"] = generated_ts.isoformat()

    home_payload = get_home_payload(db, hotel_id, lang).model_dump(mode="json")
    home_payload["meta"]["publish_version"] = snapshot_meta["publish_version"]
    home_payload["meta"]["generated_at"] = snapshot_meta["generated_at"]
    home_payload["meta"]["language"] = lang

    return {
        "hotel_id": hotel_id,
        "publish_version": snapshot_meta["publish_version"],
        "generated_at": snapshot_meta["generated_at"],
        "language": lang,
        "home": home_payload,
        "dining": get_dining(db, hotel_id, lang)["items"],
        "facilities": get_facilities(db, hotel_id, lang)["items"],
        "services": get_services(db, hotel_id, lang)["items"],
        "transport": get_transport(db, hotel_id, lang)["items"],
        "nearby_places": get_nearby_places(db, hotel_id, lang, None, None, None, "distance", 200)[
            "items"
        ],
        "routes": [
            {
                "route_id": row.route_id,
                "destination_place_id": row.destination_place_id,
                "transport_mode": row.transport_mode,
                "estimated_duration_min": row.estimated_duration_min,
            }
            for row in db.execute(select(NearbyRoute).where(NearbyRoute.hotel_id == hotel_id)).scalars().all()
        ],
        "emergency": get_emergency(db, hotel_id, lang)["items"],
        "notices": get_notices(db, hotel_id, lang)["items"],
        "faq": search_faq(db, hotel_id, lang, "")["items"],
    }


def get_snapshot(db: Session, hotel_id: str, lang: str) -> dict:
    latest_publish = _latest_publish(db, hotel_id)
    if latest_publish is not None and latest_publish.snapshot_path:
        settings = get_settings()
        snapshot_payload = read_snapshot_payload(settings.snapshot_dir, latest_publish.snapshot_path)
        if snapshot_payload is not None:
            return snapshot_payload

    return build_snapshot_payload(
        db=db,
        hotel_id=hotel_id,
        lang=lang,
        publish_version=latest_publish.version_no if latest_publish else None,
    )
