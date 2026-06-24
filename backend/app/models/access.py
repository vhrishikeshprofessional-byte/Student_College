from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


def now_utc():
    return datetime.now(timezone.utc)


class ProfessorSubjectAccess(Base):
    __tablename__ = "professor_subject_access"
    __table_args__ = (
        UniqueConstraint("user_id", "subject", name="uq_professor_subject"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject = Column(String(40), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=now_utc)

    user = relationship("User")
