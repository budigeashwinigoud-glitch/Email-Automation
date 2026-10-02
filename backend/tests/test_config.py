import pytest

from app.config import Settings


@pytest.mark.parametrize(
    "cors_origins, expected",
    [
        ('["https://app.example.com"]', ["https://app.example.com"]),
        ("https://app.example.com", ["https://app.example.com"]),
        (
            "https://app.example.com, https://preview.example.com/",
            ["https://app.example.com", "https://preview.example.com"],
        ),
    ],
)
def test_cors_origins_accepts_json_and_plain_urls(cors_origins, expected):
    settings = Settings(
        _env_file=None,
        DATABASE_URL="postgresql://example.invalid/database",
        CORS_ORIGINS=cors_origins,
    )

    assert settings.cors_origins == expected