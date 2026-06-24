from datetime import timedelta

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token_for_user,
    create_refresh_token_value,
    decode_access_token,
    ensure_aware,
    get_password_hash,
    hash_token,
    oauth2_scheme,
    utcnow,
    verify_password,
)
from app.models.token import RefreshToken
from app.models.user import User
from app.schemas.auth import RegisterRequest


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def register_user(db: Session, payload: RegisterRequest) -> User:
    if get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Email already registered"},
        )

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def issue_tokens(db: Session, user: User) -> dict:
    access_token = create_access_token_for_user(user)
    refresh_value = create_refresh_token_value()
    refresh_token = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_value),
        expires_at=utcnow() + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES),
    )
    db.add(refresh_token)
    db.commit()
    return {
        "access_token": access_token,
        "refresh_token": refresh_value,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def refresh_access_token(db: Session, refresh_token_value: str) -> tuple[str, int]:
    token_hash = hash_token(refresh_token_value)
    token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash)
        .first()
    )
    if not token or token.is_revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid or expired refresh token"},
        )

    if ensure_aware(token.expires_at) <= utcnow():
        token.is_revoked = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid or expired refresh token"},
        )

    user = db.query(User).filter(User.id == token.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "User is inactive or not found"},
        )

    return create_access_token_for_user(user), user.id


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(token)
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "User is inactive or not found"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
