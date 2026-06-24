from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.student import Student
from app.schemas.student import StudentCreate


def get_student_or_404(db: Session, student_id: int) -> Student:
    student = (
        db.query(Student)
        .filter(Student.id == student_id, Student.is_deleted.is_(False))
        .first()
    )
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Student not found"},
        )
    return student


def list_active_students(db: Session) -> list[Student]:
    return (
        db.query(Student)
        .filter(Student.is_deleted.is_(False))
        .order_by(Student.id)
        .all()
    )


def create_student(db: Session, payload: StudentCreate) -> Student:
    student = Student(**payload.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def update_student(db: Session, student: Student, data: dict) -> Student:
    for key, value in data.items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return student


def soft_delete_student(db: Session, student: Student) -> Student:
    student.is_deleted = True
    db.commit()
    db.refresh(student)
    return student
