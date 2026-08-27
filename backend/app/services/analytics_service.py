from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.catalog_upload import CatalogUpload
from app.models.product import Product
from app.models.validation_run import ValidationRun


class TopIssue(BaseModel):
    code: str = Field(..., description="Validation issue code")
    count: int = Field(..., description="Number of occurrences")


class StatusBreakdown(BaseModel):
    valid: int = Field(0, description="Count of valid products")
    warning: int = Field(0, description="Count of warning products")
    invalid: int = Field(0, description="Count of invalid products")


class LatestValidationSummary(BaseModel):
    total_products: int = Field(..., description="Total products in latest validation run")
    valid_products: int = Field(..., description="Valid products in latest run")
    warning_products: int = Field(..., description="Warning products in latest run")
    invalid_products: int = Field(..., description="Invalid products in latest run")
    total_errors: int = Field(..., description="Total errors in latest run")
    total_warnings: int = Field(..., description="Total warnings in latest run")


class AnalyticsSummary(BaseModel):
    total_catalogs: int = Field(..., description="Total processed catalog files")
    total_products: int = Field(..., description="Total products ingested across all catalogs")
    latest_health_score: Optional[int] = Field(
        None, description="Health score of the latest validation run (0-100)"
    )
    latest_validation: Optional[LatestValidationSummary] = Field(
        None, description="Summary of the latest validation run"
    )
    status_breakdown: StatusBreakdown = Field(
        ..., description="Product count breakdown by latest validation status"
    )
    top_issues: List[TopIssue] = Field(
        default_factory=list, description="Top most frequent validation issue codes"
    )
    products_requiring_review: int = Field(
        0, description="Products requiring operations review (invalid or warning status)"
    )


class HealthHistoryItem(BaseModel):
    validation_run_id: int
    upload_id: int
    health_score: int
    created_at: str


class HealthHistoryResponse(BaseModel):
    history: List[HealthHistoryItem] = Field(default_factory=list)


def get_analytics_summary(db: Session) -> AnalyticsSummary:
    """
    Calculates summary analytics from existing database models and validation results.
    """
    total_catalogs = db.query(CatalogUpload).count()
    total_products = db.query(Product).count()

    # Latest overall validation run
    latest_run = (
        db.query(ValidationRun)
        .order_by(ValidationRun.created_at.desc(), ValidationRun.id.desc())
        .first()
    )

    latest_health_score: Optional[int] = None
    latest_validation_summary: Optional[LatestValidationSummary] = None

    if latest_run:
        latest_health_score = latest_run.health_score
        latest_validation_summary = LatestValidationSummary(
            total_products=latest_run.total_products,
            valid_products=latest_run.valid_products,
            warning_products=latest_run.warning_products,
            invalid_products=latest_run.invalid_products,
            total_errors=latest_run.total_errors,
            total_warnings=latest_run.total_warnings,
        )

    # Calculate status breakdown and products requiring review
    # Find latest validation run for each upload
    uploads = db.query(CatalogUpload).all()
    valid_count = 0
    warning_count = 0
    invalid_count = 0

    for upload in uploads:
        run = (
            db.query(ValidationRun)
            .filter(ValidationRun.upload_id == upload.id)
            .order_by(ValidationRun.created_at.desc(), ValidationRun.id.desc())
            .first()
        )
        if run and run.results:
            for p_res in run.results:
                st = (p_res.get("status") or "").lower()
                if st == "valid":
                    valid_count += 1
                elif st == "warning":
                    warning_count += 1
                elif st == "invalid":
                    invalid_count += 1

    status_breakdown = StatusBreakdown(
        valid=valid_count,
        warning=warning_count,
        invalid=invalid_count,
    )
    products_requiring_review = warning_count + invalid_count

    # Calculate top 5 validation issues across all validation runs
    all_runs = db.query(ValidationRun).all()
    issue_counter: Counter = Counter()

    for run in all_runs:
        if run.results:
            for p_res in run.results:
                issues = p_res.get("issues") or []
                for issue in issues:
                    code = issue.get("code")
                    if code:
                        issue_counter[code] += 1

    top_issues = [
        TopIssue(code=code, count=count)
        for code, count in issue_counter.most_common(5)
    ]

    return AnalyticsSummary(
        total_catalogs=total_catalogs,
        total_products=total_products,
        latest_health_score=latest_health_score,
        latest_validation=latest_validation_summary,
        status_breakdown=status_breakdown,
        top_issues=top_issues,
        products_requiring_review=products_requiring_review,
    )


def get_health_history(db: Session) -> HealthHistoryResponse:
    """
    Returns historical validation run health scores ordered chronologically.
    """
    runs = (
        db.query(ValidationRun)
        .order_by(ValidationRun.created_at.asc(), ValidationRun.id.asc())
        .all()
    )

    items = [
        HealthHistoryItem(
            validation_run_id=run.id,
            upload_id=run.upload_id,
            health_score=run.health_score,
            created_at=run.created_at.isoformat() if run.created_at else "",
        )
        for run in runs
    ]

    return HealthHistoryResponse(history=items)
