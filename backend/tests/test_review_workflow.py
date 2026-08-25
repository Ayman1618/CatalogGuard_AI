from app.models.catalog_upload import CatalogUpload
from app.models.product import Product
from app.services.validation_service import validate_catalog_by_upload_id


def test_review_queue_filtering_and_content(client, db_session):
    upload = CatalogUpload(
        filename="queue_test.csv",
        file_type="csv",
        total_products=3,
        status="processed",
    )
    db_session.add(upload)
    db_session.flush()

    # Valid product (no issues)
    p_valid = Product(
        upload_id=upload.id,
        sku="SKU_VALID",
        name="Valid Product",
        description="Desc",
        category="Elec",
        brand="BrandX",
        price=100.00,
        currency="INR",
        inventory=10,
        image_url="http://example.com/img.jpg",
        review_status="pending",
    )
    # Warning product (missing brand and image_url)
    p_warn = Product(
        upload_id=upload.id,
        sku="SKU_WARN",
        name="Warning Product",
        category="Elec",
        brand=None,
        price=50.00,
        currency="INR",
        inventory=5,
        image_url=None,
        review_status="pending",
    )
    # Invalid product (invalid price = 0)
    p_invalid = Product(
        upload_id=upload.id,
        sku="SKU_INVALID",
        name="Invalid Product",
        category="Elec",
        price=0.00,
        currency="INR",
        inventory=5,
        review_status="pending",
    )

    db_session.add_all([p_valid, p_warn, p_invalid])
    db_session.commit()

    # Run validation to persist ValidationRun
    validate_catalog_by_upload_id(db_session, upload.id)

    res = client.get("/api/v1/reviews")
    assert res.status_code == 200
    queue = res.json()

    assert len(queue) == 2
    skus_in_queue = {p["sku"] for p in queue}
    assert "SKU_WARN" in skus_in_queue
    assert "SKU_INVALID" in skus_in_queue
    assert "SKU_VALID" not in skus_in_queue

    for item in queue:
        assert "product_id" in item
        assert "validation_status" in item
        assert "review_status" in item
        assert "issues" in item


def test_product_review_details_success(client, db_session):
    upload = CatalogUpload(
        filename="details.csv", file_type="csv", total_products=1, status="processed"
    )
    db_session.add(upload)
    db_session.flush()

    p = Product(
        upload_id=upload.id,
        sku="SKU_DET",
        name="Details Prod",
        category="Cat",
        price=0.00,
        inventory=5,
    )
    db_session.add(p)
    db_session.commit()

    validate_catalog_by_upload_id(db_session, upload.id)

    res = client.get(f"/api/v1/reviews/{p.id}")
    assert res.status_code == 200
    data = res.json()

    assert data["product_id"] == p.id
    assert data["sku"] == "SKU_DET"
    assert data["validation_status"] == "invalid"
    assert data["review_status"] == "pending"
    assert len(data["issues"]) > 0
    assert data["latest_validation_run"] is not None


def test_product_review_details_missing_product(client):
    res = client.get("/api/v1/reviews/999999")
    assert res.status_code == 404
    assert "Product not found" in res.json()["detail"]


def test_approve_product(client, db_session):
    p = Product(
        sku="SKU_APP", name="Approve Item", category="Cat", price=0.00, inventory=5
    )
    db_session.add(p)
    db_session.commit()

    res = client.post(f"/api/v1/reviews/{p.id}/approve")
    assert res.status_code == 200
    data = res.json()
    assert data["product_id"] == p.id
    assert data["review_status"] == "approved"

    db_session.refresh(p)
    assert p.review_status == "approved"


def test_reject_product(client, db_session):
    p = Product(
        sku="SKU_REJ", name="Reject Item", category="Cat", price=0.00, inventory=5
    )
    db_session.add(p)
    db_session.commit()

    res = client.post(f"/api/v1/reviews/{p.id}/reject")
    assert res.status_code == 200
    data = res.json()
    assert data["product_id"] == p.id
    assert data["review_status"] == "rejected"

    db_session.refresh(p)
    assert p.review_status == "rejected"


def test_approve_reject_missing_product(client):
    res_app = client.post("/api/v1/reviews/999999/approve")
    assert res_app.status_code == 404
    assert "Product not found" in res_app.json()["detail"]

    res_rej = client.post("/api/v1/reviews/999999/reject")
    assert res_rej.status_code == 404
    assert "Product not found" in res_rej.json()["detail"]


def test_validation_status_unchanged_after_approval_or_rejection(client, db_session):
    upload = CatalogUpload(
        filename="status_test.csv", file_type="csv", total_products=1, status="processed"
    )
    db_session.add(upload)
    db_session.flush()

    p = Product(
        upload_id=upload.id,
        sku="SKU_UNSTAT",
        name="Invalid Prod",
        category="Cat",
        price=0.00,
        inventory=5,
    )
    db_session.add(p)
    db_session.commit()

    validate_catalog_by_upload_id(db_session, upload.id)

    det_before = client.get(f"/api/v1/reviews/{p.id}").json()
    assert det_before["validation_status"] == "invalid"
    assert det_before["review_status"] == "pending"

    # Approve
    client.post(f"/api/v1/reviews/{p.id}/approve")
    det_after_approve = client.get(f"/api/v1/reviews/{p.id}").json()
    assert det_after_approve["validation_status"] == "invalid"
    assert det_after_approve["review_status"] == "approved"

    # Reject
    client.post(f"/api/v1/reviews/{p.id}/reject")
    det_after_reject = client.get(f"/api/v1/reviews/{p.id}").json()
    assert det_after_reject["validation_status"] == "invalid"
    assert det_after_reject["review_status"] == "rejected"


def test_toggle_approval_and_rejection(client, db_session):
    p = Product(
        sku="SKU_TOGGLE", name="Toggle Item", category="Cat", price=10.00, inventory=5
    )
    db_session.add(p)
    db_session.commit()

    client.post(f"/api/v1/reviews/{p.id}/approve")
    assert (
        client.get(f"/api/v1/reviews/{p.id}/status").json()["review_status"]
        == "approved"
    )

    client.post(f"/api/v1/reviews/{p.id}/reject")
    assert (
        client.get(f"/api/v1/reviews/{p.id}/status").json()["review_status"]
        == "rejected"
    )

    client.post(f"/api/v1/reviews/{p.id}/approve")
    assert (
        client.get(f"/api/v1/reviews/{p.id}/status").json()["review_status"]
        == "approved"
    )
