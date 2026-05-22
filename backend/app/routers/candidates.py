from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Assignment, Candidate
from app.schemas import AssignmentOut, CandidateCreate, CandidateDetail, CandidateOut

router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.get("", response_model=list[CandidateOut])
def list_candidates(db: Session = Depends(get_db)):
    return db.query(Candidate).order_by(Candidate.created_at.desc()).all()


@router.post("", response_model=CandidateOut, status_code=status.HTTP_201_CREATED)
def create_candidate(payload: CandidateCreate, db: Session = Depends(get_db)):
    existing = db.query(Candidate).filter(Candidate.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A candidate with email '{payload.email}' already exists.",
        )
    candidate = Candidate(**payload.model_dump())
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/{candidate_id}", response_model=CandidateDetail)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with id {candidate_id} not found.",
        )

    # Most recent non-historical assignment
    assignment = (
        db.query(Assignment)
        .filter(Assignment.candidate_id == candidate_id)
        .order_by(Assignment.created_at.desc())
        .first()
    )

    result = CandidateDetail.model_validate(candidate)
    result.assignment = AssignmentOut.model_validate(assignment) if assignment else None
    return result
