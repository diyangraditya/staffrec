"""
Seed script — runs once on startup if the DB is empty.
Creates 2 clients, 3 candidates, assignments, a pre-generated brief,
and past feedback records to populate the demo dataset.
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Assignment, Brief, Candidate, Client, Feedback, User
from app.auth import get_password_hash


def seed_database(db: Session) -> None:
    # Seed User if not exists
    if db.query(User).count() == 0:
        print("🌱 Seeding default recruiter user...")
        default_user = User(
            email="recruiter@staffrec.io",
            hashed_password=get_password_hash("staffrec2024"),
            role="recruiter"
        )
        db.add(default_user)
        db.commit()

    # Return early to ensure an empty dashboard (0 clients, 0 candidates)
    return
