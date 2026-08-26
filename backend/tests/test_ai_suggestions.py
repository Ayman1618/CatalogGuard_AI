from unittest.mock import MagicMock, patch

from app.models.catalog_upload import CatalogUpload
from app.models.product import Product
from app.services.ai.suggestion_service import (
    AIServiceUnavailableError,
    AISuggestion,
    generate_validation_suggestion,
)
from app.services.validation_service import validate_catalog_by_upload_id


def test_ai_suggestion_success_mocked(client, db_session, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test_key_123")

    upload = CatalogUpload(
        filename="ai_test.csv", file_type="csv", total_products=1, status="processed"
    )
    db_session.add(upload)
    db_session.flush()

    p = Product(
        upload_id=upload.id,
        sku="SKU_AI_1",
        name="Zero Price Item",
        category="Electronics",
        price=0.00,
        inventory=5,
        review_status="pending",
    )
    db_session.add(p)
    db_session.commit()

    validate_catalog_by_upload_id(db_session, upload.id)

    mock_suggestion = AISuggestion(
        explanation="The product price is set to zero which is invalid for sale.",
        suggestion="Check source catalog and update price with a positive value.",
        confidence="high",
    )

    with patch(
        "app.services.review_service.generate_validation_suggestion",
        return_value=mock_suggestion,
    ) as mock_gen:
        res = client.post(f"/api/v1/reviews/{p.id}/issues/INVALID_PRICE/suggestion")
        assert res.status_code == 200
        data = res.json()

        assert data["explanation"] == mock_suggestion.explanation
        assert data["suggestion"] == mock_suggestion.suggestion
        assert data["confidence"] == "high"
        mock_gen.assert_called_once()

    # Verify Product and DB state remain completely unchanged
    db_session.refresh(p)
    assert p.review_status == "pending"
    assert float(p.price) == 0.00


def test_ai_suggestion_product_not_found(client):
    res = client.post("/api/v1/reviews/999999/issues/INVALID_PRICE/suggestion")
    assert res.status_code == 404
    assert "Product not found" in res.json()["detail"]


def test_ai_suggestion_issue_not_found(client, db_session):
    upload = CatalogUpload(
        filename="good_cat.csv", file_type="csv", total_products=1, status="processed"
    )
    db_session.add(upload)
    db_session.flush()

    p = Product(
        upload_id=upload.id,
        sku="SKU_GOOD_NO_ISSUE",
        name="Good Laptop",
        description="Valid description",
        category="Electronics",
        brand="TechBrand",
        price=999.99,
        currency="INR",
        inventory=10,
        image_url="http://example.com/img.png",
    )
    db_session.add(p)
    db_session.commit()

    validate_catalog_by_upload_id(db_session, upload.id)

    # Attempt to get suggestion for an issue code that does not exist on this product
    res = client.post(f"/api/v1/reviews/{p.id}/issues/NON_EXISTENT_CODE/suggestion")
    assert res.status_code == 404
    assert "Validation issue not found" in res.json()["detail"]


def test_ai_suggestion_missing_api_key(client, db_session, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    upload = CatalogUpload(
        filename="ai_nokey.csv", file_type="csv", total_products=1, status="processed"
    )
    db_session.add(upload)
    db_session.flush()

    p = Product(
        upload_id=upload.id,
        sku="SKU_NO_KEY",
        name="No Key Item",
        category="Electronics",
        price=0.00,
        inventory=5,
    )
    db_session.add(p)
    db_session.commit()

    validate_catalog_by_upload_id(db_session, upload.id)

    res = client.post(f"/api/v1/reviews/{p.id}/issues/INVALID_PRICE/suggestion")
    assert res.status_code == 503
    assert "AI suggestion service is currently unavailable" in res.json()["detail"]


def test_ai_suggestion_gemini_provider_failure(client, db_session, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test_key_123")

    upload = CatalogUpload(
        filename="ai_fail.csv", file_type="csv", total_products=1, status="processed"
    )
    db_session.add(upload)
    db_session.flush()

    p = Product(
        upload_id=upload.id,
        sku="SKU_FAIL",
        name="Fail Item",
        category="Electronics",
        price=0.00,
        inventory=5,
    )
    db_session.add(p)
    db_session.commit()

    validate_catalog_by_upload_id(db_session, upload.id)

    with patch(
        "app.services.ai.suggestion_service.generate_validation_suggestion",
        side_effect=AIServiceUnavailableError("AI suggestion service is currently unavailable."),
    ):
        res = client.post(f"/api/v1/reviews/{p.id}/issues/INVALID_PRICE/suggestion")
        assert res.status_code == 503
        assert "AI suggestion service is currently unavailable" in res.json()["detail"]


def test_generate_validation_suggestion_unit_test(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test_key_123")

    prod_data = {"sku": "SKU1", "name": "Item 1", "price": 0.00}
    issue_data = {
        "code": "INVALID_PRICE",
        "field": "price",
        "severity": "error",
        "message": "Price must be > 0.",
    }

    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = '{"explanation": "Price is 0.", "suggestion": "Update price.", "confidence": "high"}'
    mock_client.models.generate_content.return_value = mock_response

    with patch("google.genai.Client", return_value=mock_client):
        result = generate_validation_suggestion(prod_data, issue_data)
        assert isinstance(result, AISuggestion)
        assert result.explanation == "Price is 0."
        assert result.suggestion == "Update price."
        assert result.confidence == "high"
