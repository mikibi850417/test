from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ImportJob(Base):
    __tablename__ = "import_jobs"

    import_job_id: Mapped[str] = mapped_column(String, primary_key=True)
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    file_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    source_type: Mapped[str] = mapped_column(String, nullable=False, default="json")
    status: Mapped[str] = mapped_column(String, nullable=False, default="created")
    created_by: Mapped[str | None] = mapped_column(String, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class JobRun(Base):
    __tablename__ = "job_runs"

    job_run_id: Mapped[str] = mapped_column(String, primary_key=True)
    import_job_id: Mapped[str] = mapped_column(ForeignKey("import_jobs.import_job_id"), nullable=False)
    run_status: Mapped[str] = mapped_column(String, nullable=False, default="running")
    rows_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rows_succeeded: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rows_failed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
