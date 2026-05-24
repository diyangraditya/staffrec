import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db
from app.models import User, Candidate
from app.auth import get_password_hash
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use in-memory SQLite for testing to avoid wiping production db
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    
    # Add recruiter user
    if not db.query(User).filter(User.email == "recruiter@staffrec.io").first():
        user = User(
            email="recruiter@staffrec.io",
            hashed_password=get_password_hash("staffrec2024"),
            role="recruiter"
        )
        db.add(user)
    
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
