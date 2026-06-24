from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    student_id: int | None
    is_active: bool

    model_config = {"from_attributes": True}
