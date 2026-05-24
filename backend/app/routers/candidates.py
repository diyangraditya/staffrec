from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Assignment, Brief, Candidate, Feedback
from app.schemas import AssignmentOut, CandidateCreate, CandidateDetail, CandidateOut, CandidateUpdate

router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.get("", response_model=list[CandidateDetail])
def list_candidates(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).all()
    result = []
    for cand in candidates:
        # Attach the most recent assignment for each candidate
        assignment = (
            db.query(Assignment)
            .filter(Assignment.candidate_id == cand.id)
            .order_by(Assignment.created_at.desc())
            .first()
        )
        detail = CandidateDetail.model_validate(cand)
        detail.assignment = AssignmentOut.model_validate(assignment) if assignment else None
        result.append(detail)
    return result


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


@router.put("/{candidate_id}", response_model=CandidateOut)
def update_candidate(
    candidate_id: int, payload: CandidateUpdate, db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    # Only update fields that were actually provided
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(candidate, field, value)

    db.commit()
    db.refresh(candidate)
    return candidate


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    # Cascade: delete feedback → briefs → assignments → candidate
    assignments = db.query(Assignment).filter(Assignment.candidate_id == candidate_id).all()
    for a in assignments:
        db.query(Feedback).filter(Feedback.assignment_id == a.id).delete()
        db.query(Brief).filter(Brief.assignment_id == a.id).delete()
    db.query(Assignment).filter(Assignment.candidate_id == candidate_id).delete()
    db.delete(candidate)
    db.commit()
