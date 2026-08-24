from enum import Enum
from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class Severity(str, Enum):
    """Severity levels for validation issues."""

    ERROR = "error"
    WARNING = "warning"


class ValidationStatus(str, Enum):
    """Overall validation status of a product."""

    VALID = "valid"
    WARNING = "warning"
    INVALID = "invalid"


class ValidationCode(str, Enum):
    """Standard rule codes for validation issues."""

    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    INVALID_PRICE = "INVALID_PRICE"
    NEGATIVE_INVENTORY = "NEGATIVE_INVENTORY"
    MISSING_IMAGE_URL = "MISSING_IMAGE_URL"
    MISSING_BRAND = "MISSING_BRAND"
    INVALID_CURRENCY = "INVALID_CURRENCY"
    DUPLICATE_SKU = "DUPLICATE_SKU"
    DUPLICATE_PRODUCT_NAME = "DUPLICATE_PRODUCT_NAME"


class ValidationIssue(BaseModel):
    """Represents an individual validation issue (error or warning)."""

    model_config = ConfigDict(use_enum_values=True)

    code: str
    field: str
    severity: Severity
    message: str


class ProductValidationResult(BaseModel):
    """Validation result for a single product record."""

    model_config = ConfigDict(use_enum_values=True)

    product_id: Optional[Any] = None
    sku: Optional[str] = None
    status: ValidationStatus
    issues: List[ValidationIssue] = Field(default_factory=list)


class CatalogValidationResult(BaseModel):
    """Catalog-level validation summary and product results."""

    model_config = ConfigDict(use_enum_values=True)

    total_products: int
    valid_products: int
    warning_products: int
    invalid_products: int
    total_errors: int
    total_warnings: int
    health_score: int
    results: List[ProductValidationResult] = Field(default_factory=list)


class CatalogValidationResponse(CatalogValidationResult):
    """API response model for catalog validation, including the target upload_id."""

    upload_id: int
