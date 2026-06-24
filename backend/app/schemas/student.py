from pydantic import BaseModel, Field, model_validator

from app.services.rbac_service import VALID_SUBJECTS


class StudentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    gender: str = Field(..., min_length=1, max_length=20)
    blood_group: str = Field(..., min_length=1, max_length=10)
    phone_number: str | None = Field(None, max_length=30)
    email: str | None = Field(None, max_length=255)
    course: str = Field(..., min_length=1, max_length=80)
    status: str = Field(..., min_length=1, max_length=20)
    bank_account_number: str = Field(..., min_length=1, max_length=80)
    bank_name: str = Field(..., min_length=1, max_length=120)
    bank_branch: str = Field(..., min_length=1, max_length=120)
    guardian_name: str | None = Field(None, max_length=120)
    address: str | None = Field(None, max_length=500)
    subjects: list[str] = Field(..., min_length=1)
    marks: dict[str, int] = Field(..., min_length=1)
    fee: float = Field(..., ge=0)
    discount: float = Field(0, ge=0)
    year: int = Field(..., ge=1900, le=2200)

    @model_validator(mode="after")
    def validate_subjects_and_marks(self):
        subjects = set(self.subjects)
        invalid_subjects = subjects - VALID_SUBJECTS
        invalid_marks = set(self.marks.keys()) - VALID_SUBJECTS
        if invalid_subjects:
            raise ValueError(f"invalid subjects: {', '.join(sorted(invalid_subjects))}")
        if invalid_marks:
            raise ValueError(f"invalid mark subjects: {', '.join(sorted(invalid_marks))}")
        if not set(self.marks.keys()).issubset(subjects):
            raise ValueError("marks can only be provided for selected subjects")
        return self


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=120)
    gender: str | None = Field(None, min_length=1, max_length=20)
    blood_group: str | None = Field(None, min_length=1, max_length=10)
    phone_number: str | None = Field(None, max_length=30)
    email: str | None = Field(None, max_length=255)
    course: str | None = Field(None, min_length=1, max_length=80)
    status: str | None = Field(None, min_length=1, max_length=20)
    bank_account_number: str | None = Field(None, min_length=1, max_length=80)
    bank_name: str | None = Field(None, min_length=1, max_length=120)
    bank_branch: str | None = Field(None, min_length=1, max_length=120)
    guardian_name: str | None = Field(None, max_length=120)
    address: str | None = Field(None, max_length=500)
    subjects: list[str] | None = None
    marks: dict[str, int] | None = None
    fee: float | None = Field(None, ge=0)
    discount: float | None = Field(None, ge=0)
    year: int | None = Field(None, ge=1900, le=2200)

    @model_validator(mode="after")
    def validate_optional_subjects_and_marks(self):
        if self.subjects is not None:
            invalid_subjects = set(self.subjects) - VALID_SUBJECTS
            if invalid_subjects:
                raise ValueError(f"invalid subjects: {', '.join(sorted(invalid_subjects))}")
        if self.marks is not None:
            invalid_marks = set(self.marks.keys()) - VALID_SUBJECTS
            if invalid_marks:
                raise ValueError(f"invalid mark subjects: {', '.join(sorted(invalid_marks))}")
            if self.subjects is not None and not set(self.marks.keys()).issubset(set(self.subjects)):
                raise ValueError("marks can only be provided for selected subjects")
        return self
