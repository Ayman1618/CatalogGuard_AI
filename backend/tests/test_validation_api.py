from app.models.catalog_upload import CatalogUpload
from app.models.product import Product
from app.models.validation_run import ValidationRun


def test_validate_successful_catalog(client, db_session):
    upload = CatalogUpload(
        filename="test_catalog.csv",
        file_type="csv",
        total_products=2,
        status="processed",
    )
    db_session.add(upload)
    db_session.flush()

    p1 = Product(
        upload_id=upload.id,
        sku="SKU_GOOD_1",
        name="Good Product 1",
        description="Great description",
        category="Electronics",
        brand="BrandA",
        price=100.00,
        currency="INR",
        inventory=10,
        image_url="http://example.com/img1.jpg",
    )
    p2 = Product(
        upload_id=upload.id,
        sku="SKU_GOOD_2",
        name="Good Product 2",
        description="Great description",
        category="Electronics",
        brand="BrandB",
        price=200.00,
        currency="INR",
        inventory=20,
        image_url="http://example.com/img2.jpg",
    )
    db_session.add_all([p1, p2])
    db_session.commit()
    upload_id = upload.id

    response = client.post(f"/api/v1/catalogs/{upload_id}/validate")
    assert response.status_code == 200
    data = response.json()

    assert data["upload_id"] == upload_id
    assert data["total_products"] == 2
    assert data["valid_products"] == 2
    assert data["warning_products"] == 0
    assert data["invalid_products"] == 0
    assert data["total_errors"] == 0
    assert data["total_warnings"] == 0
    assert data["health_score"] == 100
    assert len(data["results"]) == 2

    runs = db_session.query(ValidationRun).filter_by(upload_id=upload_id).all()
    assert len(runs) == 1
    assert runs[0].health_score == 100


def test_validate_invalid_product(client, db_session):
    upload = CatalogUpload(
        filename="bad_price.csv",
        file_type="csv",
        total_products=1,
        status="processed",
    )
    db_session.add(upload)
    db_session.flush()

    p = Product(
        upload_id=upload.id,
        sku="SKU_BAD_PRICE",
        name="Zero Price Item",
        category="Electronics",
        price=0.00,
        inventory=5,
    )
    db_session.add(p)
    db_session.commit()
    upload_id = upload.id

    response = client.post(f"/api/v1/catalogs/{upload_id}/validate")
    assert response.status_code == 200
    data = response.json()

    assert data["invalid_products"] == 1
    assert data["health_score"] < 100

    results = data["results"]
    assert len(results) == 1
    assert results[0]["status"] == "invalid"
    issue_codes = [issue["code"] for issue in results[0]["issues"]]
    assert "INVALID_PRICE" in issue_codes


def test_validate_warning_product(client, db_session):
    upload = CatalogUpload(
        filename="warning_cat.csv",
        file_type="csv",
        total_products=1,
        status="processed",
    )
    db_session.add(upload)
    db_session.flush()

    p = Product(
        upload_id=upload.id,
        sku="SKU_WARN_1",
        name="Item Without Brand Or Image",
        category="Electronics",
        brand=None,
        price=50.00,
        inventory=5,
        image_url=None,
    )
    db_session.add(p)
    db_session.commit()
    upload_id = upload.id

    response = client.post(f"/api/v1/catalogs/{upload_id}/validate")
    assert response.status_code == 200
    data = response.json()

    assert data["warning_products"] == 1
    assert data["invalid_products"] == 0

    results = data["results"]
    assert len(results) == 1
    assert results[0]["status"] == "warning"
    issue_codes = [issue["code"] for issue in results[0]["issues"]]
    assert "MISSING_BRAND" in issue_codes
    assert "MISSING_IMAGE_URL" in issue_codes


def test_validate_duplicate_product_name(client, db_session):
    upload = CatalogUpload(
        filename="dups.csv", file_type="csv", total_products=2, status="processed"
    )
    db_session.add(upload)
    db_session.flush()

    p1 = Product(
        upload_id=upload.id,
        sku="SKU_A",
        name="Wireless Mouse",
        category="Electronics",
        brand="BrandX",
        price=10.00,
        inventory=5,
        image_url="http://example.com/img.png",
    )
    p2 = Product(
        upload_id=upload.id,
        sku="SKU_B",
        name="  wireless  mouse ",
        category="Electronics",
        brand="BrandX",
        price=10.00,
        inventory=5,
        image_url="http://example.com/img.png",
    )
    db_session.add_all([p1, p2])
    db_session.commit()
    upload_id = upload.id

    response = client.post(f"/api/v1/catalogs/{upload_id}/validate")
    assert response.status_code == 200
    data = response.json()

    results = data["results"]
    assert len(results) == 2
    for r in results:
        issue_codes = [i["code"] for i in r["issues"]]
        assert "DUPLICATE_PRODUCT_NAME" in issue_codes


def test_validate_upload_not_found(client):
    response = client.post("/api/v1/catalogs/999999/validate")
    assert response.status_code == 404
    assert "Catalog upload not found" in response.json()["detail"]


def test_get_validation_result_success(client, db_session):
    upload = CatalogUpload(
        filename="get_test.csv", file_type="csv", total_products=1, status="processed"
    )
    db_session.add(upload)
    db_session.flush()
    p = Product(
        upload_id=upload.id,
        sku="SKU_GET",
        name="Get Product",
        category="Cat",
        price=25.00,
        inventory=10,
    )
    db_session.add(p)
    db_session.commit()
    upload_id = upload.id

    post_res = client.post(f"/api/v1/catalogs/{upload_id}/validate")
    assert post_res.status_code == 200
    post_data = post_res.json()

    get_res = client.get(f"/api/v1/catalogs/{upload_id}/validation")
    assert get_res.status_code == 200
    get_data = get_res.json()

    assert get_data["upload_id"] == upload_id
    assert get_data["total_products"] == post_data["total_products"]
    assert get_data["health_score"] == post_data["health_score"]
    assert len(get_data["results"]) == len(post_data["results"])


def test_get_validation_result_no_runs(client, db_session):
    upload = CatalogUpload(
        filename="unvalidated.csv",
        file_type="csv",
        total_products=1,
        status="processed",
    )
    db_session.add(upload)
    db_session.commit()
    upload_id = upload.id

    response = client.get(f"/api/v1/catalogs/{upload_id}/validation")
    assert response.status_code == 404
    assert "No validation result found for this catalog" in response.json()["detail"]


def test_get_validation_result_upload_not_found(client):
    response = client.get("/api/v1/catalogs/999999/validation")
    assert response.status_code == 404
    assert "Catalog upload not found" in response.json()["detail"]
