from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    SafeUserResponse,
)
from app.services.audit_service import log_action
from app.services.auth_service import (
    authenticate_user,
    get_current_user,
    get_user_by_email,
    issue_tokens,
    refresh_access_token,
    register_user,
)


router = APIRouter(prefix="/v1", tags=["auth"])


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = register_user(db, payload)
    return {
        "message": "User registered successfully",
        "user": SafeUserResponse.model_validate(user),
    }


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # TODO: Add Redis-backed rate limiting for brute-force protection before production.
    possible_user = get_user_by_email(db, payload.email)
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        log_action(
            db,
            user_id=possible_user.id if possible_user else None,
            action="LOGIN",
            resource_type="auth",
            status="FAILED",
            message="Invalid credentials or inactive user",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid email or password"},
        )

    tokens = issue_tokens(db, user)
    log_action(
        db,
        user_id=user.id,
        action="LOGIN",
        resource_type="auth",
        status="SUCCESS",
        message="User logged in successfully",
    )
    return tokens


@router.post("/refresh")
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        access_token, user_id = refresh_access_token(db, payload.refresh_token)
    except HTTPException:
        log_action(
            db,
            user_id=None,
            action="TOKEN_REFRESH",
            resource_type="auth",
            status="DENIED",
            message="Invalid or expired refresh token",
        )
        raise

    log_action(
        db,
        user_id=user_id,
        action="TOKEN_REFRESH",
        resource_type="auth",
        status="SUCCESS",
        message="Access token refreshed",
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return SafeUserResponse.model_validate(current_user)
