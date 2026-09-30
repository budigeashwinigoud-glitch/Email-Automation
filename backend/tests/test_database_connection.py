import pytest
from sqlalchemy import create_engine, text

from app.config import settings


@pytest.mark.skipif(
    settings.DATABASE_URL.startswith("sqlite"),
    reason="Set DATABASE_URL to the MySQL connection URL to run this check.",
)
def test_mysql_database_connection():
    assert settings.DATABASE_URL.startswith("mysql+pymysql://"), (
        "DATABASE_URL must use the mysql+pymysql:// driver for this MySQL test."
    )

    engine = create_engine(settings.DATABASE_URL)
    try:
        with engine.connect() as connection:
            assert connection.scalar(text("SELECT 1")) == 1
    finally:
        engine.dispose()
