from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr


# ─── Client ─────────────────────────────────────────────────────────────────

class ClientCreate(BaseModel):
    name: str
    company: str
    interview_style: str
    expectations: list[str]


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


class AssignmentOut(BaseModel):
    id: int
    candidate_id: int
    client_id: int
    interview_date: datetime | None
    status: str
    created_at: datetime

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
