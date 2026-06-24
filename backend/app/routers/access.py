from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.access import ProfessorSubjectAccess
from app.models.user import User
from app.schemas.access import ProfessorSubjectAccessCreate, ProfessorSubjectAccessRead
from app.services.audit_service import log_action
from app.services.auth_service import get_current_user
from app.services.rbac_service import ACCESS_MANAGEMENT_ROLES, require_role


router = APIRouter(prefix="/v1/access", tags=["access"])


@router.post("/professor-subject", status_code=status.HTTP_201_CREATED)
def assign_professor_subject_access(
    payload: ProfessorSubjectAccessCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_role(current_user, ACCESS_MANAGEMENT_ROLES)
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "User not found"},
        )
    if user.role not in {"professor", "assistant"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "User must have role professor or assistant"},
        )

    existing = (
        db.query(ProfessorSubjectAccess)
        .filter(
            ProfessorSubjectAccess.user_id == payload.user_id,
            ProfessorSubjectAccess.subject == payload.subject,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Subject access already exists for this user"},
        )

    access = ProfessorSubjectAccess(user_id=payload.user_id, subject=payload.subject)
    db.add(access)
    db.commit()
    db.refresh(access)
    log_action(
        db,
        user_id=current_user.id,
        action="ASSIGN_PROFESSOR_SUBJECT_ACCESS",
        resource_type="professor_subject_access",
        resource_id=access.id,
        status="SUCCESS",
        message=f"Assigned {payload.subject} to user {payload.user_id}",
    )
    return {
        "message": "Professor subject access assigned successfully",
        "access": ProfessorSubjectAccessRead.model_validate(access),
    }


@router.get("/professor-subject/{user_id}")
def get_professor_subject_access(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_role(current_user, ACCESS_MANAGEMENT_ROLES)
    rows = (
        db.query(ProfessorSubjectAccess)
        .filter(ProfessorSubjectAccess.user_id == user_id)
        .order_by(ProfessorSubjectAccess.subject)
        .all()
    )
    return {
        "user_id": user_id,
        "subjects": [row.subject for row in rows],
        "access": [ProfessorSubjectAccessRead.model_validate(row) for row in rows],
    }


@router.delete("/professor-subject/{access_id}")
def remove_professor_subject_access(
    access_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_role(current_user, ACCESS_MANAGEMENT_ROLES)
    access = db.query(ProfessorSubjectAccess).filter(ProfessorSubjectAccess.id == access_id).first()
    if not access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Access entry not found"},
        )
    user_id = access.user_id
    subject = access.subject
    db.delete(access)
    db.commit()
    log_action(
        db,
        user_id=current_user.id,
        action="REMOVE_PROFESSOR_SUBJECT_ACCESS",
        resource_type="professor_subject_access",
        resource_id=access_id,
        status="SUCCESS",
        message=f"Removed {subject} from user {user_id}",
    )
    return {"message": "Professor subject access removed successfully"}
