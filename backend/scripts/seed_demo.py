#!/usr/bin/env python3
"""
Seed script for CatalogGuard.

Populates the target PostgreSQL database with the standard demo catalog
(`demo/demo_catalog.csv`), ingesting real product records and executing the
deterministic validation engine to generate validation runs, review queue items,
and dashboard analytics.

This script is idempotent: running it multiple times will not duplicate
catalogs or products.
"""

import argparse
import os
import sys
from pathlib import Path


def setup_environment(target_db_url: str | None = None) -> None:
    """Ensure backend package is in sys.path and DATABASE_URL is configured."""
    # Add backend directory to sys.path
    backend_dir = Path(__file__).resolve().parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    if target_db_url:
        os.environ["DATABASE_URL"] = target_db_url


def find_demo_csv() -> Path:
    """Locate demo/demo_catalog.csv relative to script, repo, or current directory."""
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent.parent

    candidates = [
        repo_root / "demo" / "demo_catalog.csv",
        script_dir.parent / "demo" / "demo_catalog.csv",
        Path.cwd() / "demo" / "demo_catalog.csv",
        Path.cwd() / ".." / "demo" / "demo_catalog.csv",
    ]

    for path in candidates:
        if path.is_file():
            return path.resolve()

    raise FileNotFoundError(
        "Could not locate 'demo/demo_catalog.csv'. "
        "Please ensure the repository structure includes the demo catalog."
    )


def seed_demo_catalog() -> int:
    """
    Main seeding routine:
    1. Connect to PostgreSQL using existing SessionLocal / engine.
    2. Check for existing demo catalog (idempotency check).
    3. Parse demo_catalog.csv using existing catalog parser.
    4. Insert CatalogUpload and Product records.
    5. Run deterministic validation engine to create ValidationRun.
    6. Commit safely with rollback on error.
    """
    # Imports must occur after setup_environment configures sys.path and env
    from app.core.database import Base, SessionLocal, engine
    from app.models.catalog_upload import CatalogUpload
    from app.models.product import Product
    from app.models.validation_run import ValidationRun
    from app.services.catalog_parser import CatalogParseError, parse_catalog_file
    from app.services.validation_service import validate_catalog_by_upload_id

    # Ensure database schema tables exist (safe no-op if already migrated)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    demo_csv_path = find_demo_csv()
    demo_filename = "demo_catalog.csv"

    try:
        # 1. Idempotency Check A: CatalogUpload by filename
        existing_upload = (
            db.query(CatalogUpload)
            .filter(CatalogUpload.filename == demo_filename)
            .first()
        )

        # 2. Parse demo catalog CSV using the existing service
        file_contents = demo_csv_path.read_bytes()
        parsed_products, file_type, total_count = parse_catalog_file(
            file_contents, demo_filename
        )

        demo_skus = [p["sku"] for p in parsed_products]

        # 3. Idempotency Check B: Check if products already exist in database
        existing_products_count = (
            db.query(Product).filter(Product.sku.in_(demo_skus)).count()
        )

        if existing_upload and existing_products_count == len(demo_skus):
            # Check if validation run also exists
            existing_run = (
                db.query(ValidationRun)
                .filter(ValidationRun.upload_id == existing_upload.id)
                .first()
            )
            if existing_run:
                print("Demo catalog already exists. Nothing to seed.")
                return 0
            else:
                # In the rare event of a partial past run missing validation:
                print(
                    f"Demo upload found (ID: {existing_upload.id}) without validation run. "
                    "Running deterministic validation..."
                )
                val_res = validate_catalog_by_upload_id(db, existing_upload.id)
                print(
                    f"Deterministic validation complete. Health Score: {val_res.health_score}."
                )
                return 0

        if existing_products_count == len(demo_skus):
            # Products already exist under another upload
            print("Demo catalog already exists. Nothing to seed.")
            return 0

        print(f"Reading demo catalog from {demo_csv_path}...")
        print(f"Parsed {total_count} products from {demo_filename}.")

        # 4. Ingest CatalogUpload and Products in an atomic transaction
        catalog_upload = CatalogUpload(
            filename=demo_filename,
            file_type=file_type,
            total_products=total_count,
            status="processed",
        )
        db.add(catalog_upload)
        db.flush()  # Generates catalog_upload.id

        product_objects = [
            Product(
                upload_id=catalog_upload.id,
                sku=p["sku"],
                name=p["name"],
                description=p["description"],
                category=p["category"],
                brand=p["brand"],
                price=p["price"],
                currency=p["currency"],
                inventory=p["inventory"],
                image_url=p["image_url"],
            )
            for p in parsed_products
        ]
        db.add_all(product_objects)
        db.flush()

        # 5. Execute existing deterministic validation engine
        print(f"Executing deterministic validation engine on upload ID {catalog_upload.id}...")
        val_response = validate_catalog_by_upload_id(db, catalog_upload.id)

        # validate_catalog_by_upload_id commits the validation run.
        # Ensure any remaining pending changes are committed.
        db.commit()

        print("-" * 60)
        print("DEMO CATALOG SEEDED SUCCESSFULLY")
        print("-" * 60)
        print(f"Catalog Upload ID:   {catalog_upload.id}")
        print(f"Filename:            {catalog_upload.filename}")
        print(f"Total Products:      {val_response.total_products}")
        print(f"Valid Products:      {val_response.valid_products}")
        print(f"Warning Products:    {val_response.warning_products}")
        print(f"Invalid Products:    {val_response.invalid_products}")
        print(f"Total Errors:        {val_response.total_errors}")
        print(f"Total Warnings:      {val_response.total_warnings}")
        print(f"Catalog Health Score:{val_response.health_score} / 100")
        print("-" * 60)
        return 0

    except CatalogParseError as e:
        db.rollback()
        print(f"Error parsing demo catalog CSV: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        db.rollback()
        print(f"Error seeding demo catalog: {e}", file=sys.stderr)
        return 1
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed standard demo catalog into CatalogGuard PostgreSQL database."
    )
    parser.add_argument(
        "--database-url",
        dest="database_url",
        default=None,
        help="Target PostgreSQL connection string (defaults to DATABASE_URL environment variable).",
    )
    args = parser.parse_args()

    setup_environment(args.database_url)
    exit_code = seed_demo_catalog()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
