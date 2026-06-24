from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogRead
from app.services.auth_service import get_current_user
from app.services.rbac_service import AUDIT_VIEW_ROLES, require_role


router = APIRouter(prefix="/v1/audit-logs", tags=["audit"])


@router.get("")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    require_role(current_user, AUDIT_VIEW_ROLES)
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
    return [AuditLogRead.model_validate(log) for log in logs]
