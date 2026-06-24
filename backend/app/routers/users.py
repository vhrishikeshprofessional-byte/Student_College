from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserRead
from app.services.auth_service import get_current_user
from app.services.rbac_service import (
    DEACTIVATE_USER_ROLES,
    USER_MANAGEMENT_ROLES,
    require_role,
)
from app.services.student_service import get_student_or_404


router = APIRouter(prefix="/v1/users", tags=["users"])


@router.get("")
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_role(current_user, USER_MANAGEMENT_ROLES)
    users = db.query(User).order_by(User.id).all()
    return [UserRead.model_validate(user) for user in users]


@router.post("/{user_id}/link-student/{student_id}")
def link_user_to_student(
    user_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_role(current_user, USER_MANAGEMENT_ROLES)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "User not found"},
        )
    if user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Only users with role student can be linked to a student profile"},
        )
    get_student_or_404(db, student_id)
    user.student_id = student_id
    db.commit()
    db.refresh(user)
    return {
        "message": "User linked to student successfully",
        "user": UserRead.model_validate(user),
    }


@router.patch("/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_role(current_user, DEACTIVATE_USER_ROLES)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "User not found"},
        )
    user.is_active = False
    db.commit()
    db.refresh(user)
    return {
        "message": "User deactivated successfully",
        "user": UserRead.model_validate(user),
    }
