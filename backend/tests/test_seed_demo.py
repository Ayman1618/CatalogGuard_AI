import os
import sys

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import normalize_database_url
from app.models import Base, CatalogUpload, Product, ValidationRun
from scripts.seed_demo import (
    find_demo_csv,
    normalize_cli_database_url,
    seed_demo_catalog,
    setup_database_connection,
)


@pytest.fixture
def test_sqlite_db(monkeypatch):
    """Provides an isolated in-memory SQLite database for testing the seed script."""
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    # Monkeypatch setup_database_connection to return our test SQLite instances
    monkeypatch.setattr(
        "scripts.seed_demo.setup_database_connection",
        lambda database_url=None: (Base, TestSession, test_engine),
    )

    session = TestSession()
    yield session, TestSession
    session.close()
    Base.metadata.drop_all(bind=test_engine)


def test_find_demo_csv():
    csv_path = find_demo_csv()
    assert csv_path.is_file()
    assert csv_path.name == "demo_catalog.csv"


def test_seed_demo_catalog_first_run(test_sqlite_db, capsys):
    db, _ = test_sqlite_db

    # Database starts empty
    assert db.query(CatalogUpload).count() == 0
    assert db.query(Product).count() == 0
    assert db.query(ValidationRun).count() == 0

    # Execute seed
    exit_code = seed_demo_catalog()
    assert exit_code == 0

    captured = capsys.readouterr()
    assert "DEMO CATALOG SEEDED SUCCESSFULLY" in captured.out
    assert "Total Products:      10" in captured.out

    # Verify records created in database
    assert db.query(CatalogUpload).count() == 1
    assert db.query(Product).count() == 10
    assert db.query(ValidationRun).count() == 1

    upload = db.query(CatalogUpload).first()
    assert upload.filename == "demo_catalog.csv"
    assert upload.total_products == 10

    val_run = db.query(ValidationRun).first()
    assert val_run.upload_id == upload.id
    assert val_run.total_products == 10
    assert val_run.health_score == 63


def test_seed_demo_catalog_idempotent(test_sqlite_db, capsys):
    db, _ = test_sqlite_db

    # First run seeds
    exit_code_1 = seed_demo_catalog()
    assert exit_code_1 == 0
    capsys.readouterr()

    # Second run should detect existing demo and do nothing
    exit_code_2 = seed_demo_catalog()
    assert exit_code_2 == 0

    captured = capsys.readouterr()
    assert "Demo catalog already exists. Nothing to seed." in captured.out

    # Verify counts remain exactly the same (no duplicates)
    assert db.query(CatalogUpload).count() == 1
    assert db.query(Product).count() == 10
    assert db.query(ValidationRun).count() == 1


@pytest.mark.parametrize(
    "input_url,expected_scheme",
    [
        (
            "postgres://user:p%40ss@host.com:5432/db",
            "postgresql+psycopg://user:p%40ss@host.com:5432/db",
        ),
        (
            "postgresql://user:p%40ss@host.com:5432/db",
            "postgresql+psycopg://user:p%40ss@host.com:5432/db",
        ),
        (
            '"postgres://user:p%40ss@host.com:5432/db"',
            "postgresql+psycopg://user:p%40ss@host.com:5432/db",
        ),
        (
            "'postgresql://user:p%40ss@host.com:5432/db'",
            "postgresql+psycopg://user:p%40ss@host.com:5432/db",
        ),
        (
            "  postgres://user:p%40ss@host.com:5432/db  ",
            "postgresql+psycopg://user:p%40ss@host.com:5432/db",
        ),
        (
            'DATABASE_URL="postgres://user:p%40ss@host.com:5432/db"',
            "postgresql+psycopg://user:p%40ss@host.com:5432/db",
        ),
        (
            "postgresql+psycopg2://user:p%40ss@host.com:5432/db",
            "postgresql+psycopg://user:p%40ss@host.com:5432/db",
        ),
        (
            "postgresql+psycopg://user:p%40ss@host.com:5432/db?sslmode=require",
            "postgresql+psycopg://user:p%40ss@host.com:5432/db?sslmode=require",
        ),
    ],
)
def test_normalize_database_url_variations(input_url, expected_scheme):
    result = normalize_database_url(input_url)
    assert result == expected_scheme
    cli_result = normalize_cli_database_url(input_url)
    assert cli_result == expected_scheme


def test_sensitive_placeholder_error():
    with pytest.raises(ValueError) as excinfo:
        normalize_database_url("[SENSITIVE]")
    assert "DATABASE_URL is set to '[SENSITIVE]'" in str(excinfo.value)

    with pytest.raises(ValueError) as excinfo_cli:
        normalize_cli_database_url("[SENSITIVE]")
    assert "DATABASE_URL is set to '[SENSITIVE]'" in str(excinfo_cli.value)


def test_setup_database_connection_applies_override(monkeypatch):
    test_url = "postgres://custom_user:custom_pass@custom_host:5432/custom_db"
    expected = "postgresql+psycopg://custom_user:custom_pass@custom_host:5432/custom_db"

    # Call setup_database_connection with custom URL
    Base, SessionLocal, engine = setup_database_connection(test_url)

    # Verify os.environ was updated
    assert os.environ.get("DATABASE_URL") == expected
    # Verify engine URL matches
    assert str(engine.url) == "postgresql+psycopg://custom_user:***@custom_host:5432/custom_db"
