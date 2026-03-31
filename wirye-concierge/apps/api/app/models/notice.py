from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TemporaryNotice(Base):
    __tablename__ = "temporary_notices"

    notice_id: Mapped[str] = mapped_column(String, primary_key=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotel_master.hotel_id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    target_type: Mapped[str | None] = mapped_column(String, nullable=True)
    target_id: Mapped[str | None] = mapped_column(String, nullable=True)
    notice_title: Mapped[str | None] = mapped_column(String, nullable=True)
    notice_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    impact_level: Mapped[str | None] = mapped_column(String, nullable=True)
    alternate_option: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_confidence: Mapped[str | None] = mapped_column(String, nullable=True)
    last_verified_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
