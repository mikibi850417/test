from datetime import datetime

from pydantic import BaseModel


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminMeResponse(BaseModel):
    email: str
    role: str


class PublishRequest(BaseModel):
    hotelId: str
    note: str | None = None


class PublishResponse(BaseModel):
    publish_version_id: str
    hotel_id: str
    version_no: int
    status: str
    snapshot_path: str | None = None
    snapshot_checksum: str | None = None
    published_at: datetime


class ResolveConflictRequest(BaseModel):
    resolution: str
    resolvedValue: str | None = None
    note: str | None = None


class NearbyPlaceUpsert(BaseModel):
    hotel_id: str
    place_id: str | None = None
    place_name: str
    category: str | None = None
    subcategory: str | None = None
    description_short: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    hotel_distance_km: float | None = None
    walk_time_min: int | None = None
    drive_time_min: int | None = None
    transit_time_min: int | None = None
    tags_csv: str | None = None
    verification_status: str | None = None
    source_confidence: str | None = None
    note: str | None = None


class HotelPatchRequest(BaseModel):
    name_ko: str | None = None
    name_en: str | None = None
    address_road: str | None = None
    phone_main: str | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None
    verification_status: str | None = None
    note: str | None = None
