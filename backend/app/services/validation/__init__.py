"""
Catalog validation package for CatalogGuard.
Provides deterministic, rule-based product and catalog validation services.
"""

from app.services.validation.engine import (
    calculate_catalog_health_score,
    calculate_product_status,
    validate_catalog,
    validate_product,
)
from app.services.validation.rules import (
    find_duplicate_product_names,
    find_duplicate_skus,
    normalize_product_name,
    validate_currency,
    validate_inventory,
    validate_optional_fields,
    validate_price,
    validate_required_fields,
    validate_single_product_rules,
)
from app.services.validation.schemas import (
    CatalogValidationResult,
    ProductValidationResult,
    Severity,
    ValidationCode,
    ValidationIssue,
    ValidationStatus,
)

__all__ = [
    "Severity",
    "ValidationStatus",
    "ValidationCode",
    "ValidationIssue",
    "ProductValidationResult",
    "CatalogValidationResult",
    "validate_product",
    "validate_catalog",
    "calculate_product_status",
    "calculate_catalog_health_score",
    "validate_required_fields",
    "validate_price",
    "validate_inventory",
    "validate_optional_fields",
    "validate_currency",
    "validate_single_product_rules",
    "find_duplicate_skus",
    "find_duplicate_product_names",
    "normalize_product_name",
]
