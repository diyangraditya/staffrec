import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, engine, SessionLocal
from app.models import User, Candidate
from app.auth import get_password_hash

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    # Add a mock candidate if not exists
    if not db.query(Candidate).filter(Candidate.email == "test_candidate@example.com").first():
        cand = Candidate(
            name="Test Candidate",
            email="test_candidate@example.com",
            background="Testing",
            internal_score=8.0,
            internal_notes="test"
        )
        db.add(cand)
        db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def test_protected_route_without_token():
    response = client.get("/candidates")
    assert response.status_code == 401

def test_recruiter_login():
    # Login with seeded user
    response = client.post(
        "/auth/login",
        data={"username": "recruiter@staffrec.io", "password": "staffrec2024"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    
    token = data["access_token"]
    
    # Test auth me
    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["role"] == "recruiter"

def test_candidate_login_success():
    response = client.post(
        "/auth/candidate-login",
        json={"email": "test_candidate@example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    
    token = data["access_token"]
    
    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["role"] == "candidate"

def test_candidate_login_invalid():
    response = client.post(
        "/auth/candidate-login",
        json={"email": "not_real@example.com"}
    )
    assert response.status_code == 401
