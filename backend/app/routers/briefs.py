import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Assignment, Brief, Feedback
from app.schemas import BriefGenerateRequest, BriefOut

router = APIRouter(prefix="/briefs", tags=["Briefs"])


def _build_prompt(candidate, client, past_feedbacks: list[Feedback], interview_date=None) -> str:
    from datetime import date
    today_str = date.today().strftime("%B %d, %Y")
    interview_str = (
        interview_date.strftime("%B %d, %Y") if interview_date else "To be confirmed"
    )

    feedback_lines = "\n".join(
        f'- Client said: "{f.client_remarks}" | Notes: "{f.feedback_notes}"'
        for f in past_feedbacks
    ) or "No past feedback available."

    return f"""TODAY'S DATE: {today_str}
INTERVIEW DATE: {interview_str}

CLIENT PROFILE:
Company: {client.company}
Interview Style: {client.interview_style}
What they look for: {", ".join(client.expectations)}
Past feedback on failed candidates:
{feedback_lines}

CANDIDATE PROFILE:
Name: {candidate.name}
Background: {candidate.background}
Internal Assessment Score: {candidate.internal_score}/10
Recruiter Notes: {candidate.internal_notes}

Generate a personalized interview preparation brief with:
1. What this client values most (3 key points)
2. Recommended communication style and tone
3. 3 strengths this candidate should emphasize
4. 2 specific watch-out areas based on past feedback
5. 3 likely interview questions with suggested approach

IMPORTANT: Always use today's date ({today_str}) as the document date, and reference the interview on {interview_str}.
Keep it concise, practical, and specific to this candidate-client pairing.
Format using markdown with clear section headers."""


def _call_bedrock(prompt: str) -> str:
    """Call AWS Bedrock using the Converse API — works with any model (Gemma, Claude, etc)."""
    try:
        bedrock = boto3.client(
            "bedrock-runtime",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        )

        system_instruction = (
            "You are an expert recruitment coach who prepares candidates for specific "
            "client interviews. Be direct, specific, and practical.\n\n"
        )

        response = bedrock.converse(
            modelId=settings.BEDROCK_MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"text": system_instruction + prompt}
                    ],
                }
            ],
            inferenceConfig={
                "maxTokens": 1500,
                "temperature": 0.7,
            },
        )

        return response["output"]["message"]["content"][0]["text"]

    except (BotoCoreError, ClientError) as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AWS Bedrock error: {str(e)}",
        )


@router.post("/generate", response_model=BriefOut, status_code=status.HTTP_201_CREATED)
def generate_brief(payload: BriefGenerateRequest, db: Session = Depends(get_db)):
    # 1. Fetch assignment
    assignment = db.query(Assignment).filter(Assignment.id == payload.assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with id {payload.assignment_id} not found.",
        )

    # 2. Prevent duplicate brief generation
    existing_brief = db.query(Brief).filter(Brief.assignment_id == payload.assignment_id).first()
    if existing_brief:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A brief has already been generated for this assignment. Use GET /briefs/{assignment_id} to retrieve it.",
        )

    candidate = assignment.candidate
    client = assignment.client

    # 3. Fetch ALL past feedback for this client (from other assignments)
    client_assignment_ids = [
        a.id
        for a in db.query(Assignment).filter(Assignment.client_id == client.id).all()
    ]
    past_feedbacks = (
        db.query(Feedback)
        .filter(
            Feedback.assignment_id.in_(client_assignment_ids),
            Feedback.result == "fail",
        )
        .all()
        if client_assignment_ids
        else []
    )

    # 4. Build prompt and call AI
    prompt = _build_prompt(candidate, client, past_feedbacks, assignment.interview_date)
    brief_content = _call_bedrock(prompt)

    # 5. Store brief
    brief = Brief(assignment_id=assignment.id, content=brief_content)
    db.add(brief)

    # 6. Update assignment status
    assignment.status = "briefed"
    db.commit()
    db.refresh(brief)

    return brief


@router.get("/{assignment_id}", response_model=BriefOut)
def get_brief(assignment_id: int, db: Session = Depends(get_db)):
    brief = db.query(Brief).filter(Brief.assignment_id == assignment_id).first()
    if not brief:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No brief found for assignment id {assignment_id}. Generate one first via POST /briefs/generate.",
        )
    return brief


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brief(assignment_id: int, db: Session = Depends(get_db)):
    """Delete a brief so it can be regenerated. Resets assignment status to 'pending'."""
    brief = db.query(Brief).filter(Brief.assignment_id == assignment_id).first()
    if not brief:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No brief found for assignment id {assignment_id}.",
        )
    # Reset assignment status so it can be regenerated
    from app.models import Assignment as AssignmentModel
    assignment = db.query(AssignmentModel).filter(AssignmentModel.id == assignment_id).first()
    if assignment:
        assignment.status = "pending"
    db.delete(brief)
    db.commit()
