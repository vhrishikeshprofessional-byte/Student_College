from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.database import Base, engine
from app.core.migrations import ensure_student_optional_columns
from app.models import AuditLog, ProfessorSubjectAccess, RefreshToken, Student, User
from app.routers import access, audit, auth, students, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_student_optional_columns(engine)
    yield


app = FastAPI(
    title="College RBAC Student Information System",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins = {
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    content = exc.detail if isinstance(exc.detail, dict) else {"message": exc.detail}
    return JSONResponse(
        status_code=exc.status_code,
        content=jsonable_encoder(content),
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "message": "Validation error",
            "errors": jsonable_encoder(exc.errors()),
        },
    )


@app.get("/")
def health_check():
    return {"message": "College RBAC API is running"}


app.include_router(auth.router)
app.include_router(students.router)
app.include_router(users.router)
app.include_router(access.router)
app.include_router(audit.router)
