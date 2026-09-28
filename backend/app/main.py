import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .config import settings
from .database import engine, Base, SessionLocal
from .seed import seed_initial_data
from .services.worker import process_pending_tasks
from .routes import employees, tasks, dashboard

logger = logging.getLogger("belvo.worker")


async def email_worker_background_loop():
    """
    Background worker loop that periodically processes pending tasks
    and dispatches them to assigned employees via email.
    Operates completely independently of the frontend.
    """
    logger.info(
        f"Background email worker initialized. "
        f"Interval: {settings.EMAIL_WORKER_INTERVAL_SECONDS}s, Enabled: {settings.ENABLE_EMAIL_WORKER}"
    )
    while True:
        try:
            if settings.ENABLE_EMAIL_WORKER:
                db = SessionLocal()
                try:
                    await asyncio.to_thread(process_pending_tasks, db)
                finally:
                    db.close()
        except asyncio.CancelledError:
            logger.info("Background email worker received cancellation request.")
            break
        except Exception as exc:
            logger.error(f"Error in background email worker cycle: {exc}", exc_info=True)

        try:
            await asyncio.sleep(settings.EMAIL_WORKER_INTERVAL_SECONDS)
        except asyncio.CancelledError:
            break


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables automatically on startup
    Base.metadata.create_all(bind=engine)

    # Lightweight automatic migration for SQLite to ensure all columns exist
    with engine.connect() as conn:
        try:
            # Check employees table
            res = conn.execute(text("PRAGMA table_info(employees)")).fetchall()
            cols = [r[1] for r in res]
            if cols and "department" not in cols:
                conn.execute(text("ALTER TABLE employees ADD COLUMN department VARCHAR(100)"))
                conn.commit()

            # Check tasks table
            res = conn.execute(text("PRAGMA table_info(tasks)")).fetchall()
            cols = [r[1] for r in res]
            if cols and "department" not in cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN department VARCHAR(100)"))
                conn.commit()

            # Check round_robin_state table
            res = conn.execute(text("PRAGMA table_info(round_robin_state)")).fetchall()
            cols = [r[1] for r in res]
            if cols and "department" not in cols:
                conn.execute(text("ALTER TABLE round_robin_state ADD COLUMN department VARCHAR(100)"))
                conn.commit()
        except Exception:
            pass

    # Seed initial employee records if database is fresh
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()

    # Launch background email worker task
    worker_task = None
    if settings.ENABLE_EMAIL_WORKER:
        worker_task = asyncio.create_task(email_worker_background_loop())

    yield

    # Clean shutdown of worker task
    if worker_task:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass


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
