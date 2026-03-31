from datetime import datetime, timezone

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.hotel import HotelMaster
from app.models.notice import TemporaryNotice
from app.models.publish import PublishVersion
from app.schemas.home import HomeResponse, HotelSummary, NoticeItem, ResponseMeta


def _get_latest_publish_version(db: Session, hotel_id: str) -> int | None:
    stmt: Select[tuple[int]] = (
        select(PublishVersion.version_no)
        .where(PublishVersion.hotel_id == hotel_id)
        .order_by(PublishVersion.version_no.desc())
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none()


def get_home_payload(db: Session, hotel_id: str, lang: str = "ko") -> HomeResponse:
    hotel = db.get(HotelMaster, hotel_id)
    if hotel is None:
        raise ValueError(f"hotel not found: {hotel_id}")

    notices_stmt = (
        select(TemporaryNotice)
        .where(TemporaryNotice.hotel_id == hotel_id)
        .order_by(TemporaryNotice.created_at.desc())
        .limit(20)
    )
    notices = db.execute(notices_stmt).scalars().all()
    publish_version = _get_latest_publish_version(db, hotel_id)

    return HomeResponse(
        meta=ResponseMeta(
            hotel_id=hotel_id,
            publish_version=publish_version,
            generated_at=datetime.now(timezone.utc),
            language=lang,
        ),
        hotel=HotelSummary(
            hotel_id=hotel.hotel_id,
            name_kr=hotel.name_ko,
            name_en=hotel.name_en,
            address=hotel.address_road,
            phone=hotel.phone_main,
            check_in_time=hotel.check_in_time,
            check_out_time=hotel.check_out_time,
            latitude=float(hotel.latitude) if hotel.latitude is not None else None,
            longitude=float(hotel.longitude) if hotel.longitude is not None else None,
            verification_status=hotel.verification_status,
            last_verified_at=hotel.last_verified_at,
        ),
        notices=[
            NoticeItem(
                notice_id=item.notice_id,
                title=item.notice_title,
                body=item.notice_body,
                starts_at=item.start_at,
                ends_at=item.end_at,
            )
            for item in notices
        ],
    )
