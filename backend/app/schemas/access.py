from pydantic import BaseModel, Field, model_validator

from app.services.rbac_service import VALID_SUBJECTS


class ProfessorSubjectAccessCreate(BaseModel):
    user_id: int
    subject: str = Field(..., min_length=1, max_length=40)

    @model_validator(mode="after")
    def validate_subject(self):
        if self.subject not in VALID_SUBJECTS:
            raise ValueError(f"subject must be one of: {', '.join(sorted(VALID_SUBJECTS))}")
        return self


class ProfessorSubjectAccessRead(BaseModel):
    id: int
    user_id: int
    subject: str

    model_config = {"from_attributes": True}
