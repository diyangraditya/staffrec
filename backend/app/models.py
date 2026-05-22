from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    interview_style: Mapped[str] = mapped_column(String(100), nullable=False)
    expectations: Mapped[Any] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    assignments: Mapped[list["Assignment"]] = relationship(
        "Assignment", back_populates="client"
    )


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    background: Mapped[str] = mapped_column(Text, nullable=False)
    internal_score: Mapped[float] = mapped_column(Float, nullable=False)
    internal_notes: Mapped[str] = mapped_column(Text, nullable=True, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    assignments: Mapped[list["Assignment"]] = relationship(
        "Assignment", back_populates="candidate"
    )


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("candidates.id"), nullable=False
    )
    client_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clients.id"), nullable=False
    )
    interview_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending"
    )  # pending | briefed | interviewed
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="assignments")
    client: Mapped["Client"] = relationship("Client", back_populates="assignments")
    brief: Mapped["Brief | None"] = relationship(
        "Brief", back_populates="assignment", uselist=False
    )
    feedback: Mapped["Feedback | None"] = relationship(
        "Feedback", back_populates="assignment", uselist=False
    )


class Brief(Base):
    __tablename__ = "briefs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assignment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assignments.id"), unique=True, nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    assignment: Mapped["Assignment"] = relationship("Assignment", back_populates="brief")


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assignment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assignments.id"), unique=True, nullable=False
    )
    result: Mapped[str] = mapped_column(String(10), nullable=False)  # pass | fail
    feedback_notes: Mapped[str] = mapped_column(Text, nullable=True, default="")
    client_remarks: Mapped[str] = mapped_column(Text, nullable=True, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    assignment: Mapped["Assignment"] = relationship("Assignment", back_populates="feedback")
