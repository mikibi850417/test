from datetime import date

from sqlalchemy import Date, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HotelMaster(Base):
    __tablename__ = "hotel_master"

    hotel_id: Mapped[str] = mapped_column(String, primary_key=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    name_ko: Mapped[str] = mapped_column(String, nullable=False)
    name_en: Mapped[str | None] = mapped_column(String, nullable=True)
    address_road: Mapped[str | None] = mapped_column(String, nullable=True)
    phone_main: Mapped[str | None] = mapped_column(String, nullable=True)
    check_in_time: Mapped[str | None] = mapped_column(String, nullable=True)
    check_out_time: Mapped[str | None] = mapped_column(String, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    source_confidence: Mapped[str | None] = mapped_column(String, nullable=True)
    verification_status: Mapped[str | None] = mapped_column(String, nullable=True)
    last_verified_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
