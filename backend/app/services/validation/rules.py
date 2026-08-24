import re
from collections import defaultdict
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional, Sequence, Set

from app.services.validation.schemas import Severity, ValidationCode, ValidationIssue

REQUIRED_FIELDS = ["sku", "name", "category", "price", "inventory"]
SUPPORTED_CURRENCIES: Set[str] = {"INR", "USD", "EUR", "GBP"}


def get_field(product: Any, field_name: str, default: Any = None) -> Any:
    """Helper to extract field value from a dictionary, SQLAlchemy model, or object."""
    if isinstance(product, dict):
        return product.get(field_name, default)
    return getattr(product, field_name, default)


def normalize_product_name(name: Optional[str]) -> str:
    """
    Normalizes product name for exact comparison:
    - Strips leading and trailing whitespace
    - Converts to lowercase
    - Collapses multiple internal whitespace characters to a single space
    """
    if name is None:
        return ""
    stripped = str(name).strip().lower()
    return re.sub(r"\s+", " ", stripped)


def validate_required_fields(product: Any) -> List[ValidationIssue]:
    """
    Rule 1: Check that required fields are present and not empty.
    Required: sku, name, category, price, inventory
    """
    issues: List[ValidationIssue] = []
    for field in REQUIRED_FIELDS:
        val = get_field(product, field)
        if val is None or (isinstance(val, str) and val.strip() == ""):
            issues.append(
                ValidationIssue(
                    code=ValidationCode.MISSING_REQUIRED_FIELD.value,
                    field=field,
                    severity=Severity.ERROR,
                    message=f"Required field '{field}' is missing or empty.",
                )
            )
    return issues


def validate_price(product: Any) -> List[ValidationIssue]:
    """
    Rule 2: Price must be greater than 0.
    """
    price_val = get_field(product, "price")
    if price_val is None or (isinstance(price_val, str) and price_val.strip() == ""):
        return []  # Handled by validate_required_fields

    try:
        dec_price = Decimal(str(price_val).strip())
        if dec_price <= 0:
            return [
                ValidationIssue(
                    code=ValidationCode.INVALID_PRICE.value,
                    field="price",
                    severity=Severity.ERROR,
                    message=f"Price must be greater than 0. Received: {price_val}.",
                )
            ]
    except (InvalidOperation, ValueError, TypeError):
        return [
            ValidationIssue(
                code=ValidationCode.INVALID_PRICE.value,
                field="price",
                severity=Severity.ERROR,
                message=f"Price must be a valid number greater than 0. Received: {price_val}.",
            )
        ]

    return []


def validate_inventory(product: Any) -> List[ValidationIssue]:
    """
    Rule 3: Inventory cannot be negative (must be >= 0).
    """
    inv_val = get_field(product, "inventory")
    if inv_val is None or (isinstance(inv_val, str) and inv_val.strip() == ""):
        return []  # Handled by validate_required_fields

    try:
        int_inv = int(inv_val)
        if int_inv < 0:
            return [
                ValidationIssue(
                    code=ValidationCode.NEGATIVE_INVENTORY.value,
                    field="inventory",
                    severity=Severity.ERROR,
                    message=f"Inventory cannot be negative. Received: {inv_val}.",
                )
            ]
    except (ValueError, TypeError):
        return [
            ValidationIssue(
                code=ValidationCode.NEGATIVE_INVENTORY.value,
                field="inventory",
                severity=Severity.ERROR,
                message=f"Inventory must be a valid integer. Received: {inv_val}.",
            )
        ]

    return []


def validate_optional_fields(product: Any) -> List[ValidationIssue]:
    """
    Rule 4 & 5: Check for missing image_url and missing brand.
    Produces warnings that do not make the product invalid on their own.
    """
    issues: List[ValidationIssue] = []

    image_url = get_field(product, "image_url")
    if image_url is None or (isinstance(image_url, str) and image_url.strip() == ""):
        issues.append(
            ValidationIssue(
                code=ValidationCode.MISSING_IMAGE_URL.value,
                field="image_url",
                severity=Severity.WARNING,
                message="Product image URL is missing.",
            )
        )

    brand = get_field(product, "brand")
    if brand is None or (isinstance(brand, str) and brand.strip() == ""):
        issues.append(
            ValidationIssue(
                code=ValidationCode.MISSING_BRAND.value,
                field="brand",
                severity=Severity.WARNING,
                message="Product brand is missing.",
            )
        )

    return issues


def validate_currency(product: Any) -> List[ValidationIssue]:
    """
    Rule 6: Supported currencies are INR, USD, EUR, GBP.
    If currency is present but not in the supported set, produces an error.
    """
    currency = get_field(product, "currency")
    if currency is not None and (not isinstance(currency, str) or currency.strip() != ""):
        curr_str = str(currency).strip().upper()
        if curr_str not in SUPPORTED_CURRENCIES:
            supported = ", ".join(sorted(SUPPORTED_CURRENCIES))
            return [
                ValidationIssue(
                    code=ValidationCode.INVALID_CURRENCY.value,
                    field="currency",
                    severity=Severity.ERROR,
                    message=f"Currency '{currency}' is not supported. Supported currencies are: {supported}.",
                )
            ]
    return []


def validate_single_product_rules(product: Any) -> List[ValidationIssue]:
    """Applies all single-product validation rules (Rules 1-6)."""
    issues: List[ValidationIssue] = []
    issues.extend(validate_required_fields(product))
    issues.extend(validate_price(product))
    issues.extend(validate_inventory(product))
    issues.extend(validate_optional_fields(product))
    issues.extend(validate_currency(product))
    return issues


def find_duplicate_skus(products: Sequence[Any]) -> Dict[int, List[ValidationIssue]]:
    """
    Rule 7: Detect duplicate SKUs within the catalog.
    All occurrences of duplicate SKUs receive an error issue.
    """
    sku_to_indices: Dict[str, List[int]] = defaultdict(list)
    issues_by_index: Dict[int, List[ValidationIssue]] = defaultdict(list)

    for idx, product in enumerate(products):
        sku = get_field(product, "sku")
        if sku is not None and str(sku).strip() != "":
            sku_key = str(sku).strip()
            sku_to_indices[sku_key].append(idx)

    for sku_key, indices in sku_to_indices.items():
        if len(indices) > 1:
            for idx in indices:
                issues_by_index[idx].append(
                    ValidationIssue(
                        code=ValidationCode.DUPLICATE_SKU.value,
                        field="sku",
                        severity=Severity.ERROR,
                        message=f"Duplicate SKU '{sku_key}' found in catalog.",
                    )
                )

    return issues_by_index


def find_duplicate_product_names(
    products: Sequence[Any],
) -> Dict[int, List[ValidationIssue]]:
    """
    Rule 8: Detect duplicate product names using normalized exact matching.
    All occurrences of duplicate product names receive a warning issue.
    """
    name_to_indices: Dict[str, List[int]] = defaultdict(list)
    issues_by_index: Dict[int, List[ValidationIssue]] = defaultdict(list)

    for idx, product in enumerate(products):
        name = get_field(product, "name")
        normalized = normalize_product_name(name)
        if normalized:
            name_to_indices[normalized].append(idx)

    for normalized_name, indices in name_to_indices.items():
        if len(indices) > 1:
            for idx in indices:
                raw_name = get_field(products[idx], "name")
                issues_by_index[idx].append(
                    ValidationIssue(
                        code=ValidationCode.DUPLICATE_PRODUCT_NAME.value,
                        field="name",
                        severity=Severity.WARNING,
                        message=f"Duplicate product name '{raw_name}' found in catalog.",
                    )
                )

    return issues_by_index
