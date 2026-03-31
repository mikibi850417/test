from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class NearbyRoute(Base):
    __tablename__ = "nearby_routes"

    route_id: Mapped[str] = mapped_column(String, primary_key=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotel_master.hotel_id"), nullable=False)
    destination_place_id: Mapped[str | None] = mapped_column(
        ForeignKey("nearby_places.place_id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    start_point: Mapped[str | None] = mapped_column(String, nullable=True)
    transport_mode: Mapped[str | None] = mapped_column(String, nullable=True)
    estimated_duration_min: Mapped[int | None] = mapped_column(nullable=True)
    step_1: Mapped[str | None] = mapped_column(Text, nullable=True)
    step_2: Mapped[str | None] = mapped_column(Text, nullable=True)
    step_3: Mapped[str | None] = mapped_column(Text, nullable=True)
    step_4: Mapped[str | None] = mapped_column(Text, nullable=True)
    stairs_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    elevator_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    wheelchair_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_confidence: Mapped[str | None] = mapped_column(String, nullable=True)
    last_verified_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
