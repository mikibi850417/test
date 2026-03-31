from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class NearbyPlace(Base):
    __tablename__ = "nearby_places"

    place_id: Mapped[str] = mapped_column(String, primary_key=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotel_master.hotel_id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    place_name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    subcategory: Mapped[str | None] = mapped_column(String, nullable=True)
    description_short: Mapped[str | None] = mapped_column(Text, nullable=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    hotel_distance_km: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    walk_time_min: Mapped[int | None] = mapped_column(nullable=True)
    drive_time_min: Mapped[int | None] = mapped_column(nullable=True)
    transit_time_min: Mapped[int | None] = mapped_column(nullable=True)
    child_friendly_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    pet_friendly_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    late_night_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    tags_csv: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_confidence: Mapped[str | None] = mapped_column(String, nullable=True)
    verification_status: Mapped[str | None] = mapped_column(String, nullable=True)
    last_verified_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
