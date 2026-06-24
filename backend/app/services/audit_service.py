from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def log_action(
    db: Session,
    *,
    user_id: int | None,
    action: str,
    resource_type: str | None = None,
    resource_id: int | None = None,
    status: str = "SUCCESS",
    message: str | None = None,
):
    try:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            status=status,
            message=message,
        )
        db.add(audit_log)
        db.commit()
    except Exception:
        db.rollback()
