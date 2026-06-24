from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.student import StudentCreate, StudentUpdate
from app.services.audit_service import log_action
from app.services.auth_service import get_current_user
from app.services.rbac_service import (
    DELETE_STUDENT_ROLES,
    FINANCE_UPDATE_FIELDS,
    MANAGE_STUDENT_ROLES,
    STUDENT_UPDATE_FIELDS,
    add_assigned_teachers,
    full_student_view,
    require_role,
    student_view_for_user,
    visible_students_for_user,
)
from app.services.student_service import (
    create_student,
    get_student_or_404,
    list_active_students,
    soft_delete_student,
    update_student,
)


router = APIRouter(prefix="/v1/student", tags=["students"])


@router.get("")
def get_students(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    students = list_active_students(db)
    try:
        response = visible_students_for_user(db, current_user, students)
    except HTTPException as exc:
        log_action(
            db,
            user_id=current_user.id,
            action="VIEW_STUDENT_LIST",
            resource_type="student",
            status="DENIED",
            message=str(exc.detail),
        )
        raise

    log_action(
        db,
        user_id=current_user.id,
        action="VIEW_STUDENT_LIST",
        resource_type="student",
        status="SUCCESS",
        message=f"Returned {len(response)} student records for role {current_user.role}",
    )
    return response


@router.get("/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    student = get_student_or_404(db, student_id)
    try:
        response = student_view_for_user(db, current_user, student)
    except HTTPException as exc:
        log_action(
            db,
            user_id=current_user.id,
            action="VIEW_STUDENT",
            resource_type="student",
            resource_id=student_id,
            status="DENIED",
            message=str(exc.detail),
        )
        raise

    log_action(
        db,
        user_id=current_user.id,
        action="VIEW_STUDENT",
        resource_type="student",
        resource_id=student_id,
        status="SUCCESS",
        message="Student record viewed",
    )
    return add_assigned_teachers(db, response)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_student_route(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_role(current_user, MANAGE_STUDENT_ROLES)
    student = create_student(db, payload)
    log_action(
        db,
        user_id=current_user.id,
        action="CREATE_STUDENT",
        resource_type="student",
        resource_id=student.id,
        status="SUCCESS",
        message="Student created",
    )
    return {
        "message": "Student created successfully",
        "student": full_student_view(student),
    }


@router.put("/{student_id}")
def update_student_route(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    student = get_student_or_404(db, student_id)
    data = payload.model_dump(exclude_unset=True)
    if current_user.role == "student":
        if current_user.student_id != student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Students can update only their own profile"},
            )
        disallowed_fields = set(data) - STUDENT_UPDATE_FIELDS
        if disallowed_fields:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Students can update only personal and bank details"},
            )
    elif current_user.role == "finance":
        disallowed_fields = set(data) - FINANCE_UPDATE_FIELDS
        if disallowed_fields:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Finance can update only fee, discount, and bank fields"},
            )
    elif current_user.role not in MANAGE_STUDENT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "You are not authorized to update student records"},
        )

    updated = update_student(db, student, data)
    log_action(
        db,
        user_id=current_user.id,
        action="UPDATE_STUDENT",
        resource_type="student",
        resource_id=student_id,
        status="SUCCESS",
        message=f"Updated fields: {', '.join(sorted(data))}",
    )
    return {
        "message": "Student updated successfully",
        "student": add_assigned_teachers(db, student_view_for_user(db, current_user, updated)),
    }


@router.delete("/{student_id}")
def delete_student_route(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_role(current_user, DELETE_STUDENT_ROLES)
    student = get_student_or_404(db, student_id)
    soft_delete_student(db, student)
    log_action(
        db,
        user_id=current_user.id,
        action="DELETE_STUDENT",
        resource_type="student",
        resource_id=student_id,
        status="SUCCESS",
        message="Student soft deleted",
    )
    return {"message": "Student deleted successfully"}
