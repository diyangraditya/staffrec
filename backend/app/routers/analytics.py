from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Assignment, Candidate, Client, Feedback
from app.routers.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"], dependencies=[Depends(get_current_user)])


@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    # Total candidates in pipeline
    total_candidates = db.query(Candidate).count()

    # Assignments grouped by status
    status_counts = (
        db.query(Assignment.status, func.count(Assignment.id))
        .group_by(Assignment.status)
        .all()
    )
    pipeline_status = {status: count for status, count in status_counts}

    # Feedback Outcomes
    feedback_counts = (
        db.query(Feedback.result, func.count(Feedback.id))
        .group_by(Feedback.result)
        .all()
    )
    outcomes = {result: count for result, count in feedback_counts}

    # Average internal score for passed vs failed candidates
    avg_score_passed = (
        db.query(func.avg(Candidate.internal_score))
        .join(Assignment, Assignment.candidate_id == Candidate.id)
        .join(Feedback, Feedback.assignment_id == Assignment.id)
        .filter(Feedback.result == "pass")
        .scalar()
    )
    avg_score_failed = (
        db.query(func.avg(Candidate.internal_score))
        .join(Assignment, Assignment.candidate_id == Candidate.id)
        .join(Feedback, Feedback.assignment_id == Assignment.id)
        .filter(Feedback.result == "fail")
        .scalar()
    )

    # Client specific pass rates
    client_stats = []
    clients = db.query(Client).all()
    for client in clients:
        # Total assignments with feedback for this client
        feedbacks_for_client = (
            db.query(Feedback)
            .join(Assignment, Assignment.id == Feedback.assignment_id)
            .filter(Assignment.client_id == client.id)
            .all()
        )
        
        total = len(feedbacks_for_client)
        passes = sum(1 for f in feedbacks_for_client if f.result == "pass")
        pass_rate = (passes / total * 100) if total > 0 else 0
        
        client_stats.append({
            "client_id": client.id,
            "client_name": client.company,
            "total_interviews": total,
            "passes": passes,
            "pass_rate": round(pass_rate, 1)
        })

    return {
        "total_candidates": total_candidates,
        "pipeline": pipeline_status,
        "outcomes": {
            "pass": outcomes.get("pass", 0),
            "fail": outcomes.get("fail", 0),
        },
        "average_scores": {
            "passed_candidates": round(avg_score_passed or 0, 1),
            "failed_candidates": round(avg_score_failed or 0, 1),
        },
        "client_performance": client_stats
    }
