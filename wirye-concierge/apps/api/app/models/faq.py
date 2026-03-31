from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class FaqIntent(Base):
    __tablename__ = "faq_intents"

    intent_id: Mapped[str] = mapped_column(String, primary_key=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotel_master.hotel_id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    intent_group: Mapped[str | None] = mapped_column(String, nullable=True)
    user_question_example_ko: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_question_example_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    answer_template_ko: Mapped[str | None] = mapped_column(Text, nullable=True)
    answer_template_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    primary_sheet: Mapped[str | None] = mapped_column(String, nullable=True)
    primary_lookup_key: Mapped[str | None] = mapped_column(String, nullable=True)
    escalation_required_yn: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
