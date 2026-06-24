from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.access import ProfessorSubjectAccess
from app.models.student import Student
from app.models.user import User


ALLOWED_ROLES = {
    "admin",
    "student",
    "professor",
    "assistant",
    "principal",
    "hod",
    "chairman",
    "dean",
    "finance",
}

VALID_SUBJECTS = {
    "maths",
    "physics",
    "chemistry",
    "biology",
    "social",
    "english",
}

FULL_STUDENT_ROLES = {"admin", "chairman"}
ACADEMIC_STUDENT_ROLES = {"principal", "hod", "dean"}
PROFESSOR_STUDENT_ROLES = {"professor", "assistant"}
MANAGE_STUDENT_ROLES = {"admin", "principal", "chairman", "dean"}
DELETE_STUDENT_ROLES = {"admin", "chairman"}
USER_MANAGEMENT_ROLES = {"admin", "chairman", "principal"}
DEACTIVATE_USER_ROLES = {"admin", "chairman"}
ACCESS_MANAGEMENT_ROLES = {"admin", "principal", "chairman", "dean"}
AUDIT_VIEW_ROLES = {"admin", "chairman", "principal"}
FINANCE_UPDATE_FIELDS = {
    "fee",
    "discount",
    "bank_account_number",
    "bank_name",
    "bank_branch",
}
STUDENT_UPDATE_FIELDS = {
    "name",
    "bank_name",
    "bank_account_number",
    "bank_branch",
    "phone_number",
    "blood_group",
    "email",
    "gender",
    "course",
    "guardian_name",
    "address",
}


def require_role(user: User, allowed_roles: set[str]):
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "You are not authorized to perform this action"},
        )


def student_forbidden(student_id: int):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "message": (
                f"You are not authorized to view student id {student_id}, "
                "contact admin to get access"
            )
        },
    )


def full_student_view(student: Student) -> dict:
    return {
        "id": student.id,
        "name": student.name,
        "gender": student.gender,
        "blood_group": student.blood_group,
        "phone_number": student.phone_number,
        "email": student.email,
        "course": student.course,
        "status": student.status,
        "bank_account_number": student.bank_account_number,
        "bank_name": student.bank_name,
        "bank_branch": student.bank_branch,
        "guardian_name": student.guardian_name,
        "address": student.address,
        "subjects": student.subjects,
        "marks": student.marks,
        "fee": student.fee,
        "discount": student.discount,
        "year": student.year,
    }


def finance_student_view(student: Student) -> dict:
    return {
        "id": student.id,
        "name": student.name,
        "course": student.course,
        "year": student.year,
        "fee": student.fee,
        "discount": student.discount,
        "bank_account_number": student.bank_account_number,
        "bank_name": student.bank_name,
        "bank_branch": student.bank_branch,
    }


def academic_student_view(student: Student) -> dict:
    return {
        "id": student.id,
        "name": student.name,
        "gender": student.gender,
        "blood_group": student.blood_group,
        "course": student.course,
        "status": student.status,
        "subjects": student.subjects,
        "marks": student.marks,
        "year": student.year,
    }


def professor_subjects(db: Session, user_id: int) -> set[str]:
    rows = (
        db.query(ProfessorSubjectAccess)
        .filter(ProfessorSubjectAccess.user_id == user_id)
        .all()
    )
    return {row.subject for row in rows}


def assigned_teachers_by_subject(db: Session, subjects: list[str]) -> dict[str, list[dict]]:
    subject_set = {subject for subject in subjects if subject}
    if not subject_set:
        return {}

    rows = (
        db.query(ProfessorSubjectAccess)
        .join(User, ProfessorSubjectAccess.user_id == User.id)
        .filter(
            ProfessorSubjectAccess.subject.in_(subject_set),
            User.is_active.is_(True),
        )
        .order_by(ProfessorSubjectAccess.subject, User.name)
        .all()
    )

    teachers = {subject: [] for subject in sorted(subject_set)}
    for row in rows:
        teachers.setdefault(row.subject, []).append(
            {
                "name": row.user.name,
                "role": row.user.role,
                "email": row.user.email,
            }
        )
    return teachers


def subject_names_from_view(student_view: dict) -> list[str]:
    subjects = student_view.get("subjects") or []
    names = []
    for item in subjects:
        subject = item.get("subject") if isinstance(item, dict) else item
        if subject:
            names.append(subject)
    return names


def add_assigned_teachers(db: Session, student_view: dict) -> dict:
    subjects = subject_names_from_view(student_view)
    if not subjects:
        return student_view

    enriched_view = dict(student_view)
    enriched_view["assigned_teachers"] = assigned_teachers_by_subject(db, subjects)
    return enriched_view


def professor_student_view(student: Student, assigned_subjects: set[str]) -> dict | None:
    matches = [
        subject for subject in (student.subjects or [])
        if subject in assigned_subjects
    ]
    if not matches:
        return None

    marks = student.marks or {}
    return {
        "id": student.id,
        "name": student.name,
        "subjects": [
            {"subject": subject, "marks": marks.get(subject)}
            for subject in matches
        ],
        "status": student.status,
    }


def student_view_for_user(db: Session, user: User, student: Student) -> dict:
    if user.role in FULL_STUDENT_ROLES:
        return full_student_view(student)
    if user.role == "finance":
        return finance_student_view(student)
    if user.role in ACADEMIC_STUDENT_ROLES:
        return academic_student_view(student)
    if user.role in PROFESSOR_STUDENT_ROLES:
        view = professor_student_view(student, professor_subjects(db, user.id))
        if view is None:
            student_forbidden(student.id)
        return view
    if user.role == "student":
        if user.student_id != student.id:
            student_forbidden(student.id)
        return full_student_view(student)

    student_forbidden(student.id)


def visible_students_for_user(db: Session, user: User, students: list[Student]) -> list[dict]:
    if user.role in FULL_STUDENT_ROLES:
        return [full_student_view(student) for student in students]
    if user.role == "finance":
        return [finance_student_view(student) for student in students]
    if user.role in ACADEMIC_STUDENT_ROLES:
        return [academic_student_view(student) for student in students]
    if user.role in PROFESSOR_STUDENT_ROLES:
        assigned = professor_subjects(db, user.id)
        visible = []
        for student in students:
            view = professor_student_view(student, assigned)
            if view is not None:
                visible.append(view)
        return visible
    if user.role == "student":
        if user.student_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "No student profile is linked to this user"},
            )
        return [
            full_student_view(student)
            for student in students
            if student.id == user.student_id
        ]

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"message": "You are not authorized to view students"},
    )
