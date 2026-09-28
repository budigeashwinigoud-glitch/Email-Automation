from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./belvo.db"
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    # No default tasks or default people
    SEED_INITIAL_EMPLOYEES: bool = False
    INITIAL_EMPLOYEES: List[dict] = []

    # SMTP / Email Service Configuration
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "Belvo HR Task Management"
    SMTP_USE_TLS: bool = True

    # Automatic Email Dispatch Worker Configuration
    ENABLE_EMAIL_WORKER: bool = True
    EMAIL_WORKER_INTERVAL_SECONDS: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
