from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Assignment, Feedback
from app.schemas import FeedbackCreate, FeedbackOut

router = APIRouter(prefix="/feedback", tags=["Feedback"])

VALID_RESULTS = {"pass", "fail"}


@router.post("", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
def submit_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)):
    if payload.result not in VALID_RESULTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid result '{payload.result}'. Must be 'pass' or 'fail'.",
        )

    # Validate assignment exists
    assignment = db.query(Assignment).filter(Assignment.id == payload.assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with id {payload.assignment_id} not found.",
        )

    # Prevent duplicate feedback
    existing = db.query(Feedback).filter(Feedback.assignment_id == payload.assignment_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Feedback already submitted for this assignment.",
        )

    feedback = Feedback(**payload.model_dump())
    db.add(feedback)

    # Update assignment status to interviewed
    assignment.status = "interviewed"
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/{assignment_id}", response_model=FeedbackOut)
def get_feedback(assignment_id: int, db: Session = Depends(get_db)):
    feedback = db.query(Feedback).filter(Feedback.assignment_id == assignment_id).first()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No feedback found for assignment id {assignment_id}.",
        )
    return feedback


@router.put("/{assignment_id}", response_model=FeedbackOut)
def update_feedback(
    assignment_id: int, payload: FeedbackCreate, db: Session = Depends(get_db)
):
    """Update existing feedback for an assignment."""
    if payload.result not in VALID_RESULTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid result '{payload.result}'. Must be 'pass' or 'fail'.",
        )
    feedback = db.query(Feedback).filter(Feedback.assignment_id == assignment_id).first()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No feedback found for assignment id {assignment_id}.",
        )
    feedback.result = payload.result
    feedback.feedback_notes = payload.feedback_notes
    feedback.client_remarks = payload.client_remarks
    db.commit()
    db.refresh(feedback)
    return feedback
