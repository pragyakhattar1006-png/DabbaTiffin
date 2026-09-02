import os


def _database_url() -> str:
    url = os.environ.get("DATABASE_URL", "sqlite:///./dabbatiffin.db")
    # Render provides postgres:// but SQLAlchemy 2.x needs postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


class Settings:
    database_url: str = _database_url()
    jwt_secret: str = os.environ.get("JWT_SECRET", "dev-secret-change-me")
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = int(os.environ.get("JWT_EXPIRES_MINUTES", "43200"))
    cors_origins: list[str] = [
        o.strip()
        for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
        if o.strip()
    ]


settings = Settings()
