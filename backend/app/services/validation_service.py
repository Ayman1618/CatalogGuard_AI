from sqlalchemy.orm import Session

from app.models.catalog_upload import CatalogUpload
from app.models.product import Product
from app.models.validation_run import ValidationRun
from app.services.validation.engine import validate_catalog
from app.services.validation.schemas import (
    CatalogValidationResponse,
    ProductValidationResult,
)


class CatalogUploadNotFoundError(Exception):
    """Raised when a requested CatalogUpload ID does not exist."""

    pass


class ValidationResultNotFoundError(Exception):
    """Raised when no validation runs exist for a given CatalogUpload ID."""

    pass


def validate_catalog_by_upload_id(
    db: Session, upload_id: int
) -> CatalogValidationResponse:
    """
    Fetches all products for a given upload_id, runs the validation engine,
    persists a new ValidationRun record, and returns the response schema.
    """
    upload = db.query(CatalogUpload).filter(CatalogUpload.id == upload_id).first()
    if not upload:
        raise CatalogUploadNotFoundError("Catalog upload not found.")

    products = db.query(Product).filter(Product.upload_id == upload_id).all()
    validation_result = validate_catalog(products)

    # Convert results to JSON-compatible dicts for storage
    results_json = [r.model_dump(mode="json") for r in validation_result.results]

    validation_run = ValidationRun(
        upload_id=upload_id,
        total_products=validation_result.total_products,
        valid_products=validation_result.valid_products,
        warning_products=validation_result.warning_products,
        invalid_products=validation_result.invalid_products,
        total_errors=validation_result.total_errors,
        total_warnings=validation_result.total_warnings,
        health_score=validation_result.health_score,
        results=results_json,
    )
    db.add(validation_run)
    db.commit()

    return CatalogValidationResponse(
        upload_id=upload_id,
        total_products=validation_result.total_products,
        valid_products=validation_result.valid_products,
        warning_products=validation_result.warning_products,
        invalid_products=validation_result.invalid_products,
        total_errors=validation_result.total_errors,
        total_warnings=validation_result.total_warnings,
        health_score=validation_result.health_score,
        results=validation_result.results,
    )


def get_latest_validation_by_upload_id(
    db: Session, upload_id: int
) -> CatalogValidationResponse:
    """
    Retrieves the most recent ValidationRun for a given upload_id.
    """
    upload = db.query(CatalogUpload).filter(CatalogUpload.id == upload_id).first()
    if not upload:
        raise CatalogUploadNotFoundError("Catalog upload not found.")

    latest_run = (
        db.query(ValidationRun)
        .filter(ValidationRun.upload_id == upload_id)
        .order_by(ValidationRun.created_at.desc(), ValidationRun.id.desc())
        .first()
    )
    if not latest_run:
        raise ValidationResultNotFoundError(
            "No validation result found for this catalog."
        )

    product_results = [
        ProductValidationResult.model_validate(res) for res in latest_run.results
    ]

    return CatalogValidationResponse(
        upload_id=upload_id,
        total_products=latest_run.total_products,
        valid_products=latest_run.valid_products,
        warning_products=latest_run.warning_products,
        invalid_products=latest_run.invalid_products,
        total_errors=latest_run.total_errors,
        total_warnings=latest_run.total_warnings,
        health_score=latest_run.health_score,
        results=product_results,
    )
