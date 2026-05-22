"""
Seed script — runs once on startup if the DB is empty.
Creates 2 clients, 3 candidates, assignments, a pre-generated brief,
and past feedback records to populate the demo dataset.
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Assignment, Brief, Candidate, Client, Feedback


def seed_database(db: Session) -> None:
    # Only seed if no clients exist
    if db.query(Client).count() > 0:
        return

    print("🌱 Seeding database with demo data...")

    # ── Clients ──────────────────────────────────────────────────────────────

    vertex = Client(
        name="Jonathan Mak",
        company="Vertex Consulting",
        interview_style="consulting",
        expectations=[
            "structured communication",
            "MECE thinking",
            "executive presence",
            "concise answers",
        ],
    )

    buildfast = Client(
        name="Rachel Lim",
        company="BuildFast Studio",
        interview_style="startup",
        expectations=[
            "bias for action",
            "directness",
            "scrappiness",
            "adaptability",
        ],
    )

    db.add_all([vertex, buildfast])
    db.flush()  # get IDs without committing

    # ── Candidates ────────────────────────────────────────────────────────────

    aditya = Candidate(
        name="Aditya Rajan",
        email="aditya.rajan@example.com",
        background="3 years consulting, MBA graduate",
        internal_score=8.2,
        internal_notes=(
            "Strong analytical skills. Tends to over-structure answers. "
            "Great energy but can be verbose under pressure."
        ),
    )

    sari = Candidate(
        name="Sari Dewi",
        email="sari.dewi@example.com",
        background="Startup growth marketer, 2 years experience",
        internal_score=7.8,
        internal_notes=(
            "High energy, action-oriented. Excellent instincts for growth loops. "
            "Can be direct to the point of bluntness — watch tone in formal settings."
        ),
    )

    marcus = Candidate(
        name="Marcus Tan",
        email="marcus.tan@example.com",
        background="Fresh grad, strong academic record",
        internal_score=7.5,
        internal_notes=(
            "Impressive academic track record. Limited work experience. "
            "Good coachability — picks things up fast."
        ),
    )

    db.add_all([aditya, sari, marcus])
    db.flush()

    # ── Assignments ───────────────────────────────────────────────────────────

    # Aditya → Vertex (pending — brief NOT yet generated, demo generates live)
    aditya_assignment = Assignment(
        candidate_id=aditya.id,
        client_id=vertex.id,
        interview_date=datetime(2025, 6, 10, 10, 0, tzinfo=timezone.utc),
        status="pending",
    )

    # Sari → BuildFast (briefed — shows end state)
    sari_assignment = Assignment(
        candidate_id=sari.id,
        client_id=buildfast.id,
        interview_date=datetime(2025, 6, 8, 14, 0, tzinfo=timezone.utc),
        status="briefed",
    )

    db.add_all([aditya_assignment, sari_assignment])
    db.flush()

    # ── Pre-generated Brief for Sari ─────────────────────────────────────────

    sari_brief = Brief(
        assignment_id=sari_assignment.id,
        content="""# Interview Prep Brief — Sari Dewi × BuildFast Studio

## What BuildFast Values Most
1. **Bias for action** — They want to see you move fast, make decisions with incomplete info, and iterate.
2. **Directness** — Short answers win. They lose patience with long preambles or over-explained points.
3. **Scrappiness** — Show examples of doing more with less. Resourcefulness > polish.

## Recommended Communication Style
Be punchy and conversational. Drop the formal marketer voice. Lead with the outcome, then explain how you got there. Think: "We grew signups 40% in 6 weeks — here's what we did" not "So I was tasked with a growth initiative..."

## 3 Strengths to Emphasize
1. Your 2-year startup track record — you've operated in ambiguity and shipped anyway.
2. Growth instincts — you understand loops, not just campaigns.
3. Speed — you've moved fast and adjusted based on data.

## 2 Watch-Out Areas
1. **Tone in structured settings** — BuildFast is casual but still professional. Read the room — assertive ≠ blunt.
2. **Past feedback pattern** — Previous candidates felt "too polished, rehearsed." Be real, not scripted.

## 3 Likely Interview Questions
**Q: Tell me about a time you had to move fast with limited resources.**
→ Lead with the constraint, the action you took, and the result. Keep it under 90 seconds.

**Q: How do you decide what to prioritize when everything feels urgent?**
→ Show a real framework you actually use — not a textbook answer.

**Q: Why BuildFast? Why now?**
→ Be specific about their product or stage. Generic "I love startups" answers will tank this.
""",
    )

    db.add(sari_brief)
    db.flush()

    # ── Past Feedback Records ─────────────────────────────────────────────────

    # Vertex Consulting — 3 past failed candidates (used as AI context)
    vertex_feedbacks = [
        Feedback(
            assignment_id=aditya_assignment.id,  # placeholder — using aditya's for demo
            result="fail",
            feedback_notes="Candidate gave long-winded answers. Lost the interviewer after 2 minutes.",
            client_remarks="Too much structure, not enough clarity. We want the answer, not the framework.",
        ),
    ]

    # Create dummy assignments for historical feedback context
    # (these represent past candidates not in our current seed set)
    historical_vertex_1 = Assignment(
        candidate_id=marcus.id,  # reuse marcus as historical placeholder
        client_id=vertex.id,
        status="interviewed",
    )
    historical_vertex_2 = Assignment(
        candidate_id=sari.id,  # reuse sari as historical placeholder
        client_id=vertex.id,
        status="interviewed",
    )
    historical_buildfast_1 = Assignment(
        candidate_id=aditya.id,
        client_id=buildfast.id,
        status="interviewed",
    )
    historical_buildfast_2 = Assignment(
        candidate_id=marcus.id,
        client_id=buildfast.id,
        status="interviewed",
    )

    db.add_all(
        [
            historical_vertex_1,
            historical_vertex_2,
            historical_buildfast_1,
            historical_buildfast_2,
        ]
    )
    db.flush()

    feedbacks = [
        # Vertex past feedback
        Feedback(
            assignment_id=historical_vertex_1.id,
            result="fail",
            feedback_notes="Candidate gave long-winded answers. Lost the interviewer after 2 minutes.",
            client_remarks="Too much structure, not enough clarity. We want the answer, not the framework.",
        ),
        Feedback(
            assignment_id=historical_vertex_2.id,
            result="fail",
            feedback_notes="Lacked confidence when assumptions were challenged mid-case.",
            client_remarks="Seemed rattled. We need people who hold their ground with data.",
        ),
        # BuildFast past feedback
        Feedback(
            assignment_id=historical_buildfast_1.id,
            result="fail",
            feedback_notes="Too polished — felt rehearsed, not authentic. Not a culture fit.",
            client_remarks="We need someone who talks to us like a human, not a McKinsey deck.",
        ),
        Feedback(
            assignment_id=historical_buildfast_2.id,
            result="fail",
            feedback_notes="Couldn't give examples of moving fast under pressure.",
            client_remarks="Over-explained everything. We need decisiveness.",
        ),
    ]

    db.add_all(feedbacks)
    db.commit()

    print("✅ Seed data loaded successfully.")
