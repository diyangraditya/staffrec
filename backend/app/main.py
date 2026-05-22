from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import Base, SessionLocal, engine
from app.routers import assignments, briefs, candidates, clients, feedback
from app.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all tables then seed if empty
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown: nothing to clean up for now


app = FastAPI(
    title="Staffrec API",
    description="AI-powered recruitment briefing platform — backend API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(clients.router)
app.include_router(candidates.router)
app.include_router(assignments.router)
app.include_router(briefs.router)
app.include_router(feedback.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Staffrec backend is running"}
