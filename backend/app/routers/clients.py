from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Assignment, Client, Feedback
from app.schemas import ClientCreate, ClientDetail, ClientOut, FeedbackOut

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("", response_model=list[ClientOut])
def list_clients(db: Session = Depends(get_db)):
    return db.query(Client).order_by(Client.created_at.desc()).all()


@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
def create_client(payload: ClientCreate, db: Session = Depends(get_db)):
    client = Client(**payload.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientDetail)
def get_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with id {client_id} not found.",
        )

    # Gather all feedback for this client across all assignments
    assignment_ids = [a.id for a in db.query(Assignment).filter(Assignment.client_id == client_id).all()]
    feedback_records = (
        db.query(Feedback).filter(Feedback.assignment_id.in_(assignment_ids)).all()
        if assignment_ids
        else []
    )

    result = ClientDetail.model_validate(client)
    result.feedback_history = [FeedbackOut.model_validate(f) for f in feedback_records]
    return result
