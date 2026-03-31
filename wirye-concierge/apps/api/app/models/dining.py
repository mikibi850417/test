from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HotelDining(Base):
    __tablename__ = "hotel_dining"

    dining_id: Mapped[str] = mapped_column(String, primary_key=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotel_master.hotel_id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    venue_name: Mapped[str] = mapped_column(String, nullable=False)
    venue_type: Mapped[str | None] = mapped_column(String, nullable=True)
    floor_location: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    breakfast_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    lunch_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    dinner_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    bar_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    hours_mon: Mapped[str | None] = mapped_column(String, nullable=True)
    hours_tue: Mapped[str | None] = mapped_column(String, nullable=True)
    hours_wed: Mapped[str | None] = mapped_column(String, nullable=True)
    hours_thu: Mapped[str | None] = mapped_column(String, nullable=True)
    hours_fri: Mapped[str | None] = mapped_column(String, nullable=True)
    hours_sat: Mapped[str | None] = mapped_column(String, nullable=True)
    hours_sun: Mapped[str | None] = mapped_column(String, nullable=True)
    holiday_hours: Mapped[str | None] = mapped_column(String, nullable=True)
    pricing_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    breakfast_adult_price_krw: Mapped[int | None] = mapped_column(Integer, nullable=True)
    breakfast_child_price_krw: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_confidence: Mapped[str | None] = mapped_column(String, nullable=True)
    last_verified_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
