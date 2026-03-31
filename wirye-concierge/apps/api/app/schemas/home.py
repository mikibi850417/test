from datetime import date, datetime

from pydantic import BaseModel


class ResponseMeta(BaseModel):
    hotel_id: str
    publish_version: int | None
    generated_at: datetime
    language: str


class HotelSummary(BaseModel):
    hotel_id: str
    name_kr: str
    name_en: str | None
    address: str | None
    phone: str | None
    check_in_time: str | None
    check_out_time: str | None
    latitude: float | None
    longitude: float | None
    verification_status: str | None
    last_verified_at: date | None


class NoticeItem(BaseModel):
    notice_id: str
    title: str | None
    body: str | None
    starts_at: datetime | None
    ends_at: datetime | None


class HomeResponse(BaseModel):
    meta: ResponseMeta
    hotel: HotelSummary
    notices: list[NoticeItem]
