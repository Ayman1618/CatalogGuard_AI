from app.models.catalog_upload import CatalogUpload
from app.models.product import Product
from app.models.validation_run import ValidationRun
from app.services.validation_service import validate_catalog_by_upload_id


def test_analytics_summary_no_catalogs(client):
    res = client.get("/api/v1/analytics/summary")
    assert res.status_code == 200
    data = res.json()

    assert data["total_catalogs"] == 0
    assert data["total_products"] == 0
    assert data["latest_health_score"] is None
    assert data["latest_validation"] is None
    assert data["status_breakdown"] == {"valid": 0, "warning": 0, "invalid": 0}
    assert data["top_issues"] == []
    assert data["products_requiring_review"] == 0


def test_analytics_summary_unvalidated_catalog(client, db_session):
    upload = CatalogUpload(
        filename="unvalidated.csv",
        file_type="csv",
        total_products=2,
        status="processed",
    )
    db_session.add(upload)
    db_session.flush()

    p1 = Product(sku="SKU_UN1", name="Prod 1", category="Cat", price=10.00, inventory=5)
    p2 = Product(sku="SKU_UN2", name="Prod 2", category="Cat", price=20.00, inventory=10)
    db_session.add_all([p1, p2])
    db_session.commit()

    res = client.get("/api/v1/analytics/summary")
    assert res.status_code == 200
    data = res.json()

    assert data["total_catalogs"] == 1
    assert data["total_products"] == 2
    assert data["latest_health_score"] is None
    assert data["latest_validation"] is None


def test_analytics_summary_with_validation_runs(client, db_session):
    # Upload 1: 2 products (1 valid, 1 invalid price)
    up1 = CatalogUpload(filename="cat1.csv", file_type="csv", total_products=2, status="processed")
    db_session.add(up1)
    db_session.flush()

    p1 = Product(
        upload_id=up1.id,
        sku="SKU1",
        name="Laptop",
        description="Desc",
        category="Electronics",
        brand="TechBrand",
        price=999.99,
        currency="INR",
        inventory=10,
        image_url="http://example.com/img.jpg",
    )
    p2 = Product(
        upload_id=up1.id,
        sku="SKU2",
        name="Zero Price Item",
        category="Electronics",
        brand="TechBrand",
        price=0.00,
        currency="INR",
        inventory=5,
        image_url="http://example.com/img.jpg",
    )
    db_session.add_all([p1, p2])
    db_session.commit()

    validate_catalog_by_upload_id(db_session, up1.id)

    # Upload 2: 1 product with warnings (missing brand and image_url)
    up2 = CatalogUpload(filename="cat2.csv", file_type="csv", total_products=1, status="processed")
    db_session.add(up2)
    db_session.flush()

    p3 = Product(
        upload_id=up2.id,
        sku="SKU3",
        name="Warn Item",
        category="Electronics",
        brand=None,
        price=50.00,
        currency="INR",
        inventory=5,
        image_url=None,
    )
    db_session.add(p3)
    db_session.commit()

    validate_catalog_by_upload_id(db_session, up2.id)

    # Call /api/v1/analytics/summary
    res = client.get("/api/v1/analytics/summary")
    assert res.status_code == 200
    data = res.json()

    assert data["total_catalogs"] == 2
    assert data["total_products"] == 3
    assert data["latest_health_score"] is not None
    assert data["latest_validation"] is not None

    # Check status breakdown: 1 valid (p1), 1 warning (p3), 1 invalid (p2)
    breakdown = data["status_breakdown"]
    assert breakdown["valid"] == 1
    assert breakdown["warning"] == 1
    assert breakdown["invalid"] == 1
    assert data["products_requiring_review"] == 2

    # Check top issues contains INVALID_PRICE, MISSING_BRAND, MISSING_IMAGE_URL
    issue_codes = [issue["code"] for issue in data["top_issues"]]
    assert "INVALID_PRICE" in issue_codes
    assert "MISSING_BRAND" in issue_codes
    assert "MISSING_IMAGE_URL" in issue_codes


def test_health_history_empty(client):
    res = client.get("/api/v1/analytics/health-history")
    assert res.status_code == 200
    data = res.json()
    assert data["history"] == []


def test_health_history_ordering_and_content(client, db_session):
    up1 = CatalogUpload(filename="cat1.csv", file_type="csv", total_products=1, status="processed")
    db_session.add(up1)
    db_session.flush()
    p1 = Product(upload_id=up1.id, sku="H_SKU1", name="P1", category="Cat", price=10.00, inventory=5)
    db_session.add(p1)
    db_session.commit()

    validate_catalog_by_upload_id(db_session, up1.id)

    up2 = CatalogUpload(filename="cat2.csv", file_type="csv", total_products=1, status="processed")
    db_session.add(up2)
    db_session.flush()
    p2 = Product(upload_id=up2.id, sku="H_SKU2", name="P2", category="Cat", price=0.00, inventory=5)
    db_session.add(p2)
    db_session.commit()

    validate_catalog_by_upload_id(db_session, up2.id)

    runs = db_session.query(ValidationRun).order_by(ValidationRun.created_at.asc(), ValidationRun.id.asc()).all()

    res = client.get("/api/v1/analytics/health-history")
    assert res.status_code == 200
    data = res.json()

    history = data["history"]
    assert len(history) == 2
    assert history[0]["validation_run_id"] == runs[0].id
    assert history[1]["validation_run_id"] == runs[1].id
    assert history[0]["upload_id"] == up1.id
    assert history[1]["upload_id"] == up2.id
