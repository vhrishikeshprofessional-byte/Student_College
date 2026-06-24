from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.core.database import Base


def now_utc():
    return datetime.now(timezone.utc)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    action = Column(String(80), nullable=False, index=True)
    resource_type = Column(String(80), nullable=True)
    resource_id = Column(Integer, nullable=True)
    status = Column(String(40), nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=now_utc)
