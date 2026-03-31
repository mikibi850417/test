from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HotelService(Base):
    __tablename__ = "hotel_services"

    service_id: Mapped[str] = mapped_column(String, primary_key=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotel_master.hotel_id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    service_name: Mapped[str] = mapped_column(String, nullable=False)
    service_category: Mapped[str | None] = mapped_column(String, nullable=True)
    request_channel: Mapped[str | None] = mapped_column(String, nullable=True)
    service_hours: Mapped[str | None] = mapped_column(String, nullable=True)
    reservation_required_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    fee_required_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    fee_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    language_support_csv: Mapped[str | None] = mapped_column(Text, nullable=True)
    service_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    source_confidence: Mapped[str | None] = mapped_column(String, nullable=True)
    last_verified_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
