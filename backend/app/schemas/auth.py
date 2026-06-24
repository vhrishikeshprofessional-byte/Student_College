from pydantic import BaseModel, EmailStr, Field, model_validator

from app.services.rbac_service import ALLOWED_ROLES


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    confirm_password: str = Field(..., min_length=6, max_length=128)
    role: str

    @model_validator(mode="after")
    def validate_registration(self):
        if self.password != self.confirm_password:
            raise ValueError("password and confirm_password must match")
        if self.role not in ALLOWED_ROLES:
            raise ValueError(f"role must be one of: {', '.join(sorted(ALLOWED_ROLES))}")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=20)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int


class SafeUserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    student_id: int | None = None

    model_config = {"from_attributes": True}
