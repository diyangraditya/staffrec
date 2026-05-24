from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr


# ─── Auth / User ─────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "recruiter"


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Client ─────────────────────────────────────────────────────────────────

class ClientCreate(BaseModel):
    name: str
    company: str
    interview_style: str
    expectations: list[str]


class ClientUpdate(BaseModel):
    name: str | None = None
    company: str | None = None
    interview_style: str | None = None
    expectations: list[str] | None = None


class ClientOut(BaseModel):
    id: int
    name: str
    company: str
    interview_style: str
    expectations: list[Any]
    created_at: datetime

    model_config = {"from_attributes": True}


class ClientDetail(ClientOut):
    """Client detail with past feedback history."""
    feedback_history: list["FeedbackOut"] = []


# ─── Candidate ───────────────────────────────────────────────────────────────

class CandidateCreate(BaseModel):
    name: str
    email: EmailStr
    background: str
    internal_score: float
    internal_notes: str = ""


class CandidateUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    background: str | None = None
    internal_score: float | None = None
    internal_notes: str | None = None


class CandidateOut(BaseModel):
    id: int
    name: str
    email: str
    background: str
    internal_score: float
    internal_notes: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CandidateDetail(CandidateOut):
    """Candidate detail with current assignment if any."""
    assignment: "AssignmentOut | None" = None



# ─── Assignment ───────────────────────────────────────────────────────────────

class AssignmentCreate(BaseModel):
    candidate_id: int
    client_id: int
    interview_date: datetime | None = None


class AssignmentStatusUpdate(BaseModel):
    status: str


class AssignmentOut(BaseModel):
    id: int
    candidate_id: int
    client_id: int
    interview_date: datetime | None
    status: str
    created_at: datetime
    feedback: "FeedbackOut | None" = None

    model_config = {"from_attributes": True}


class AssignmentDetail(AssignmentOut):
    """Assignment detail with nested candidate + client."""
    candidate: CandidateOut
    client: ClientOut


# ─── Brief ───────────────────────────────────────────────────────────────────

class BriefGenerateRequest(BaseModel):
    assignment_id: int


class BriefOut(BaseModel):
    id: int
    assignment_id: int
    content: str
    generated_at: datetime

    model_config = {"from_attributes": True}


# ─── Feedback ────────────────────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    assignment_id: int
    result: str  # "pass" or "fail"
    feedback_notes: str = ""
    client_remarks: str = ""


class FeedbackOut(BaseModel):
    id: int
    assignment_id: int
    result: str
    feedback_notes: str
    client_remarks: str
    created_at: datetime

    model_config = {"from_attributes": True}


# Resolve forward references
ClientDetail.model_rebuild()
CandidateDetail.model_rebuild()
AssignmentOut.model_rebuild()
