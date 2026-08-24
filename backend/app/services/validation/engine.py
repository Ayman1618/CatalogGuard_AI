from typing import Any, List, Optional, Sequence

from app.services.validation.rules import (
    find_duplicate_product_names,
    find_duplicate_skus,
    get_field,
    validate_single_product_rules,
)
from app.services.validation.schemas import (
    CatalogValidationResult,
    ProductValidationResult,
    Severity,
    ValidationIssue,
    ValidationStatus,
)


def calculate_product_status(issues: Sequence[ValidationIssue]) -> ValidationStatus:
    """
    Computes overall product status based on issue severities:
    - 'invalid': If at least one ERROR exists.
    - 'warning': If there are no ERRORs but one or more WARNINGs exist.
    - 'valid': If there are no issues.
    """
    has_error = any(
        issue.severity == Severity.ERROR or issue.severity == "error"
        for issue in issues
    )
    if has_error:
        return ValidationStatus.INVALID

    has_warning = any(
        issue.severity == Severity.WARNING or issue.severity == "warning"
        for issue in issues
    )
    if has_warning:
        return ValidationStatus.WARNING

    return ValidationStatus.VALID


def calculate_catalog_health_score(
    total_products: int, invalid_products: int, warning_products: int
) -> int:
    """
    Calculates a deterministic Catalog Health Score between 0 and 100.

    Formula:
        score = 100 - (invalid_products / total_products * 70) - (warning_products / total_products * 30)

    Clamped between 0 and 100, rounded to the nearest integer.
    Empty catalogs return 100.
    """
    if total_products <= 0:
        return 100

    raw_score = (
        100.0
        - ((invalid_products / total_products) * 70.0)
        - ((warning_products / total_products) * 30.0)
    )
    clamped_score = max(0.0, min(100.0, raw_score))
    return int(round(clamped_score))


def validate_product(product: Any) -> ProductValidationResult:
    """
    Validates a single product against standalone rules (Rules 1-6).
    Accepts SQLAlchemy Product instances, dicts, or objects with attributes.
    """
    product_id = get_field(product, "id", get_field(product, "product_id", None))
    sku_val = get_field(product, "sku", None)
    sku = str(sku_val) if sku_val is not None else None

    issues = validate_single_product_rules(product)
    status = calculate_product_status(issues)

    return ProductValidationResult(
        product_id=product_id,
        sku=sku,
        status=status,
        issues=issues,
    )


def validate_catalog(products: Sequence[Any]) -> CatalogValidationResult:
    """
    Validates an entire catalog of products, applying both single-product rules
    and catalog-wide rules (duplicate SKUs and duplicate product names).
    """
    total_products = len(products)
    if total_products == 0:
        return CatalogValidationResult(
            total_products=0,
            valid_products=0,
            warning_products=0,
            invalid_products=0,
            total_errors=0,
            total_warnings=0,
            health_score=100,
            results=[],
        )

    # 1. Collect single-product rule issues for each product
    product_issues_list: List[List[ValidationIssue]] = [
        validate_single_product_rules(p) for p in products
    ]

    # 2. Collect catalog-level duplicate issues
    duplicate_sku_issues = find_duplicate_skus(products)
    for idx, issues in duplicate_sku_issues.items():
        product_issues_list[idx].extend(issues)

    duplicate_name_issues = find_duplicate_product_names(products)
    for idx, issues in duplicate_name_issues.items():
        product_issues_list[idx].extend(issues)

    # 3. Build product validation results and calculate metrics
    product_results: List[ProductValidationResult] = []
    valid_count = 0
    warning_count = 0
    invalid_count = 0
    total_errors = 0
    total_warnings = 0

    for idx, product in enumerate(products):
        issues = product_issues_list[idx]
        status = calculate_product_status(issues)

        product_id = get_field(product, "id", get_field(product, "product_id", None))
        sku_val = get_field(product, "sku", None)
        sku = str(sku_val) if sku_val is not None else None

        if status == ValidationStatus.VALID or status == "valid":
            valid_count += 1
        elif status == ValidationStatus.WARNING or status == "warning":
            warning_count += 1
        elif status == ValidationStatus.INVALID or status == "invalid":
            invalid_count += 1

        for issue in issues:
            if issue.severity == Severity.ERROR or issue.severity == "error":
                total_errors += 1
            elif issue.severity == Severity.WARNING or issue.severity == "warning":
                total_warnings += 1

        product_results.append(
            ProductValidationResult(
                product_id=product_id,
                sku=sku,
                status=status,
                issues=issues,
            )
        )

    health_score = calculate_catalog_health_score(
        total_products=total_products,
        invalid_products=invalid_count,
        warning_products=warning_count,
    )

    return CatalogValidationResult(
        total_products=total_products,
        valid_products=valid_count,
        warning_products=warning_count,
        invalid_products=invalid_count,
        total_errors=total_errors,
        total_warnings=total_warnings,
        health_score=health_score,
        results=product_results,
    )
