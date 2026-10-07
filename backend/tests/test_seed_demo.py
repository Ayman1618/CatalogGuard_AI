import sys
from unittest.mock import patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models import Base, CatalogUpload, Product, ValidationRun
from scripts.seed_demo import find_demo_csv, seed_demo_catalog


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

    # Monkeypatch SessionLocal and engine inside seed_demo.py's target module
    monkeypatch.setattr("app.core.database.SessionLocal", TestSession)
    monkeypatch.setattr("app.core.database.engine", test_engine)

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
