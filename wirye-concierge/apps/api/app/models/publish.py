from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PublishVersion(Base):
    __tablename__ = "publish_versions"

    publish_version_id: Mapped[str] = mapped_column(String, primary_key=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotel_master.hotel_id"), nullable=False)
    version_no: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="draft")
    snapshot_path: Mapped[str | None] = mapped_column(String, nullable=True)
    snapshot_checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
