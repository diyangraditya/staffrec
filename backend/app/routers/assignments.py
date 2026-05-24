from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Assignment, Candidate, Client, Brief, Feedback
from app.schemas import AssignmentCreate, AssignmentDetail, AssignmentOut, AssignmentStatusUpdate
from app.routers.auth import get_current_user

router = APIRouter(prefix="/assignments", tags=["Assignments"], dependencies=[Depends(get_current_user)])


@router.post("", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
def create_assignment(payload: AssignmentCreate, db: Session = Depends(get_db)):
    # Validate candidate + client exist
    candidate = db.query(Candidate).filter(Candidate.id == payload.candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with id {payload.candidate_id} not found.",
        )

    client = db.query(Client).filter(Client.id == payload.client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with id {payload.client_id} not found.",
        )

    assignment = Assignment(**payload.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/{assignment_id}", response_model=AssignmentDetail)
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = (
        db.query(Assignment)
        .options(joinedload(Assignment.candidate), joinedload(Assignment.client))
        .filter(Assignment.id == assignment_id)
        .first()
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with id {assignment_id} not found.",
        )
    return assignment


@router.patch("/{assignment_id}/status", response_model=AssignmentOut)
def update_assignment_status(
    assignment_id: int, payload: AssignmentStatusUpdate, db: Session = Depends(get_db)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with id {assignment_id} not found.",
        )
    
    valid_statuses = {"pending", "briefed", "interviewed"}
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status '{payload.status}'. Must be one of {valid_statuses}.",
        )

    assignment.status = payload.status
    db.commit()
    db.refresh(assignment)
    return assignment


class AssignmentDateUpdate(BaseModel):
    interview_date: datetime | None = None


@router.patch("/{assignment_id}/date", response_model=AssignmentOut)
def update_assignment_date(
    assignment_id: int, payload: AssignmentDateUpdate, db: Session = Depends(get_db)
):
    """Update just the interview date on an existing assignment."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with id {assignment_id} not found.",
        )
    assignment.interview_date = payload.interview_date
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int, db: Session = Depends(get_db)
):
    """Delete an assignment and cascade-delete its brief and feedback."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with id {assignment_id} not found.",
        )
    # Cascade-delete brief and feedback manually (SQLite may not enforce FKs)
    db.query(Brief).filter(Brief.assignment_id == assignment_id).delete()
    db.query(Feedback).filter(Feedback.assignment_id == assignment_id).delete()
    db.delete(assignment)
    db.commit()
