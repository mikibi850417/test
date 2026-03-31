from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TransportAccess(Base):
    __tablename__ = "transport_access"

    transport_id: Mapped[str] = mapped_column(String, primary_key=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotel_master.hotel_id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    origin_name: Mapped[str] = mapped_column(String, nullable=False)
    origin_type: Mapped[str | None] = mapped_column(String, nullable=True)
    transport_mode: Mapped[str | None] = mapped_column(String, nullable=True)
    recommended_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    distance_km: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    duration_min: Mapped[int | None] = mapped_column(nullable=True)
    fare_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    first_service_time: Mapped[str | None] = mapped_column(String, nullable=True)
    last_service_time: Mapped[str | None] = mapped_column(String, nullable=True)
    route_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_confidence: Mapped[str | None] = mapped_column(String, nullable=True)
    last_verified_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
