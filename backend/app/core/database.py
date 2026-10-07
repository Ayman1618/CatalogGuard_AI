import os
from typing import Generator
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

def normalize_database_url(url: str | None) -> str:
    """
    Normalizes database connection strings for SQLAlchemy and the psycopg3 driver.
    Handles postgres://, postgresql://, postgresql+psycopg://, surrounding quotes,
    leading/trailing whitespace, and optional DATABASE_URL= prefix without altering
    password credentials or query parameters.
    """
    if not url:
        return "postgresql+psycopg://username:password@localhost:5432/catalogguard"

    cleaned = url.strip()

    # Strip optional 'DATABASE_URL=' prefix if copied directly from key=value format
    if cleaned.startswith("DATABASE_URL="):
        cleaned = cleaned[len("DATABASE_URL=") :].strip()

    # Strip surrounding single or double quotes
    while (cleaned.startswith('"') and cleaned.endswith('"')) or (
        cleaned.startswith("'") and cleaned.endswith("'")
    ):
        cleaned = cleaned[1:-1].strip()

    # Check for Vercel redacted placeholder
    if cleaned.lower() == "[sensitive]":
        raise ValueError(
            "DATABASE_URL is set to '[SENSITIVE]'. This occurs when 'vercel env pull' "
            "exports redacted secrets without decryption. Please provide the actual "
            "database connection string."
        )

    # Scheme normalization for psycopg 3
    if cleaned.startswith("postgres://"):
        cleaned = "postgresql+psycopg://" + cleaned[len("postgres://") :]
    elif cleaned.startswith("postgresql://") and not cleaned.startswith("postgresql+"):
        cleaned = "postgresql+psycopg://" + cleaned[len("postgresql://") :]
    elif cleaned.startswith("postgresql+psycopg2://"):
        cleaned = "postgresql+psycopg://" + cleaned[len("postgresql+psycopg2://") :]

    return cleaned


DATABASE_URL = normalize_database_url(os.getenv("DATABASE_URL"))

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy database models."""

    pass


def get_db() -> Generator:
    """Dependency for providing database sessions to API routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
