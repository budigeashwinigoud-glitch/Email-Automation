from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base, SessionLocal
from .seed import seed_initial_data
from .routes import employees, tasks, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables automatically on startup
    Base.metadata.create_all(bind=engine)
    # Seed initial employee records if database is fresh
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Belvo Task Allotment API",
    description=(
        "Production-grade REST API for Belvo HR automated task allotment. "
        "Supports dynamic employee management, deterministic round-robin task assignment, "
        "and integration endpoints for email delivery automation."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(employees.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": "Belvo Automated Task Allotment API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }
