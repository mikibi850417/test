from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HotelFacility(Base):
    __tablename__ = "hotel_facilities"

    facility_id: Mapped[str] = mapped_column(String, primary_key=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotel_master.hotel_id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    facility_name: Mapped[str] = mapped_column(String, nullable=False)
    facility_type: Mapped[str | None] = mapped_column(String, nullable=True)
    floor_location: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    hours_mon: Mapped[str | None] = mapped_column(String, nullable=True)
    hours_tue: Mapped[str | None] = mapped_column(String, nullable=True)
    hours_wed: Mapped[str | None] = mapped_column(String, nullable=True)
    hours_thu: Mapped[str | None] = mapped_column(String, nullable=True)
    hours_fri: Mapped[str | None] = mapped_column(String, nullable=True)
    hours_sat: Mapped[str | None] = mapped_column(String, nullable=True)
    hours_sun: Mapped[str | None] = mapped_column(String, nullable=True)
    fee_required_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    fee_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    age_limit_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    age_policy_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    source_confidence: Mapped[str | None] = mapped_column(String, nullable=True)
    last_verified_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
