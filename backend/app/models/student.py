from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, JSON, String

from app.core.database import Base


def now_utc():
    return datetime.now(timezone.utc)


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    gender = Column(String(20), nullable=False)
    blood_group = Column(String(10), nullable=False)
    phone_number = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    course = Column(String(80), nullable=False)
    status = Column(String(20), nullable=False)
    bank_account_number = Column(String(80), nullable=False)
    bank_name = Column(String(120), nullable=False)
    bank_branch = Column(String(120), nullable=False)
    guardian_name = Column(String(120), nullable=True)
    address = Column(String(500), nullable=True)
    subjects = Column(JSON, nullable=False, default=list)
    marks = Column(JSON, nullable=False, default=dict)
    fee = Column(Float, nullable=False)
    discount = Column(Float, nullable=False, default=0)
    year = Column(Integer, nullable=False)
    is_deleted = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=now_utc)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=now_utc, onupdate=now_utc)
