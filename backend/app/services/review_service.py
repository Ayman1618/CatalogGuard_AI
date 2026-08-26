from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.validation_run import ValidationRun
from app.services.ai.suggestion_service import (
    AIServiceUnavailableError,
    AISuggestion,
    generate_validation_suggestion,
)
from app.services.validation.engine import validate_product


class ProductNotFoundError(Exception):
    """Raised when a requested product ID does not exist."""

    pass


class ValidationIssueNotFoundError(Exception):
    """Raised when the requested validation issue code is not found for a product."""

    pass


def get_latest_validation_map_for_upload(
    db: Session, upload_id: int
) -> Optional[Dict[Any, Dict[str, Any]]]:
    """
    Helper function to get a map of product_id (and sku) to validation result dict
    from the latest ValidationRun for a given upload_id.
    """
    latest_run = (
        db.query(ValidationRun)
        .filter(ValidationRun.upload_id == upload_id)
        .order_by(ValidationRun.created_at.desc(), ValidationRun.id.desc())
        .first()
    )

    if not latest_run or not latest_run.results:
        return None

    res_map: Dict[Any, Dict[str, Any]] = {}
    for res in latest_run.results:
        p_id = res.get("product_id")
        sku = res.get("sku")
        if p_id is not None:
            res_map[p_id] = res
        if sku is not None:
            res_map[sku] = res

    return res_map


def get_review_queue(db: Session) -> List[Dict[str, Any]]:
    """
    Returns products that require review (i.e. products whose latest validation status is 'invalid' or 'warning').
    """
    products = db.query(Product).all()
    queue: List[Dict[str, Any]] = []

    # Cache upload_id -> latest_run mapping to prevent redundant DB queries
    upload_run_cache: Dict[int, Optional[ValidationRun]] = {}

    for product in products:
        val_status = "valid"
        issues = []

        if product.upload_id is not None:
            if product.upload_id not in upload_run_cache:
                latest_run = (
                    db.query(ValidationRun)
                    .filter(ValidationRun.upload_id == product.upload_id)
                    .order_by(ValidationRun.created_at.desc(), ValidationRun.id.desc())
                    .first()
                )
                upload_run_cache[product.upload_id] = latest_run
            else:
                latest_run = upload_run_cache[product.upload_id]

            if latest_run and latest_run.results:
                # Find matching product result in run.results
                for res in latest_run.results:
                    if (
                        res.get("product_id") == product.id
                        or res.get("sku") == product.sku
                    ):
                        val_status = res.get("status", "valid")
                        issues = res.get("issues", [])
                        break
            else:
                # Fallback if validation hasn't been run for upload yet
                single_res = validate_product(product)
                val_status = (
                    single_res.status.value
                    if hasattr(single_res.status, "value")
                    else str(single_res.status)
                )
                issues = [
                    i.model_dump(mode="json") if hasattr(i, "model_dump") else i
                    for i in single_res.issues
                ]
        else:
            single_res = validate_product(product)
            val_status = (
                single_res.status.value
                if hasattr(single_res.status, "value")
                else str(single_res.status)
            )
            issues = [
                i.model_dump(mode="json") if hasattr(i, "model_dump") else i
                for i in single_res.issues
            ]

        # Only include products with 'invalid' or 'warning' status in the review queue
        if val_status in ["invalid", "warning"]:
            queue.append(
                {
                    "product_id": product.id,
                    "sku": product.sku,
                    "name": product.name,
                    "category": product.category,
                    "price": float(product.price) if product.price is not None else 0.0,
                    "inventory": product.inventory,
                    "validation_status": val_status,
                    "review_status": product.review_status,
                    "issues": issues,
                }
            )

    return queue


def get_product_review_details(db: Session, product_id: int) -> Dict[str, Any]:
    """
    Returns detailed product information, current validation status, review status,
    issues, and latest validation run info.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ProductNotFoundError("Product not found.")

    val_status = "valid"
    issues = []
    latest_run_info = None

    if product.upload_id is not None:
        latest_run = (
            db.query(ValidationRun)
            .filter(ValidationRun.upload_id == product.upload_id)
            .order_by(ValidationRun.created_at.desc(), ValidationRun.id.desc())
            .first()
        )

        if latest_run:
            latest_run_info = {
                "id": latest_run.id,
                "created_at": (
                    latest_run.created_at.isoformat()
                    if latest_run.created_at
                    else None
                ),
                "health_score": latest_run.health_score,
            }

            if latest_run.results:
                for res in latest_run.results:
                    if (
                        res.get("product_id") == product.id
                        or res.get("sku") == product.sku
                    ):
                        val_status = res.get("status", "valid")
                        issues = res.get("issues", [])
                        break
        else:
            single_res = validate_product(product)
            val_status = (
                single_res.status.value
                if hasattr(single_res.status, "value")
                else str(single_res.status)
            )
            issues = [
                i.model_dump(mode="json") if hasattr(i, "model_dump") else i
                for i in single_res.issues
            ]
    else:
        single_res = validate_product(product)
        val_status = (
            single_res.status.value
            if hasattr(single_res.status, "value")
            else str(single_res.status)
        )
        issues = [
            i.model_dump(mode="json") if hasattr(i, "model_dump") else i
            for i in single_res.issues
        ]

    return {
        "product_id": product.id,
        "sku": product.sku,
        "name": product.name,
        "description": product.description,
        "category": product.category,
        "brand": product.brand,
        "price": float(product.price) if product.price is not None else 0.0,
        "currency": product.currency,
        "inventory": product.inventory,
        "image_url": product.image_url,
        "validation_status": val_status,
        "review_status": product.review_status,
        "issues": issues,
        "latest_validation_run": latest_run_info,
    }


def approve_product(db: Session, product_id: int) -> Dict[str, Any]:
    """
    Sets product review_status to 'approved' without modifying validation status.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ProductNotFoundError("Product not found.")

    product.review_status = "approved"
    db.commit()

    return {
        "product_id": product.id,
        "review_status": product.review_status,
    }


def reject_product(db: Session, product_id: int) -> Dict[str, Any]:
    """
    Sets product review_status to 'rejected' without modifying validation status.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ProductNotFoundError("Product not found.")

    product.review_status = "rejected"
    db.commit()

    return {
        "product_id": product.id,
        "review_status": product.review_status,
    }


def get_product_review_status(db: Session, product_id: int) -> Dict[str, Any]:
    """
    Returns current validation_status and review_status for a product.
    """
    details = get_product_review_details(db, product_id)
    return {
        "product_id": details["product_id"],
        "validation_status": details["validation_status"],
        "review_status": details["review_status"],
    }


def get_ai_suggestion_for_issue(
    db: Session, product_id: int, issue_code: str
) -> AISuggestion:
    """
    Retrieves product review details, finds the matching validation issue code,
    and calls the AI service to generate a structured suggestion.
    """
    product_details = get_product_review_details(db, product_id)
    issues = product_details.get("issues", [])

    matching_issue = None
    for issue in issues:
        if issue.get("code") == issue_code:
            matching_issue = issue
            break

    if not matching_issue:
        raise ValidationIssueNotFoundError("Validation issue not found.")

    return generate_validation_suggestion(product_details, matching_issue)
