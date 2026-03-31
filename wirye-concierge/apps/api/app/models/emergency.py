from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EmergencySafety(Base):
    __tablename__ = "emergency_safety"

    emergency_id: Mapped[str] = mapped_column(String, primary_key=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotel_master.hotel_id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    contact_name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    hotel_distance_km: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    drive_time_min: Mapped[int | None] = mapped_column(nullable=True)
    available_24h_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    language_support_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_confidence: Mapped[str | None] = mapped_column(String, nullable=True)
    last_verified_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
