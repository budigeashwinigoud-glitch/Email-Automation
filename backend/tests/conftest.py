import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db
from app.models import Employee

# In-memory SQLite with StaticPool ensures the same memory database is shared across threads
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def seed_employees(db_session):
    """Seed 5 initial employees for tests."""
    employees = [
        Employee(name="Thrija", email="thrija@test.com", active=True),
        Employee(name="Sai", email="sai@test.com", active=True),
        Employee(name="Seetha", email="seetha@test.com", active=True),
        Employee(name="Pavan", email="pavan@test.com", active=True),
        Employee(name="Ashwini", email="ashwini@test.com", active=True),
    ]
    for emp in employees:
        db_session.add(emp)
    db_session.commit()
    for emp in employees:
        db_session.refresh(emp)
    return employees
