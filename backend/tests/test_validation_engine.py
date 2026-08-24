from decimal import Decimal
import pytest

from app.models.product import Product
from app.services.validation import (
    CatalogValidationResult,
    ProductValidationResult,
    Severity,
    ValidationCode,
    ValidationStatus,
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
)


# ==========================================
# 1. Required Fields Tests
# ==========================================


def test_required_fields_all_present():
    product = {
        "sku": "SKU001",
        "name": "Wireless Mouse",
        "category": "Electronics",
        "price": Decimal("25.00"),
        "inventory": 50,
    }
    issues = validate_required_fields(product)
    assert len(issues) == 0


@pytest.mark.parametrize(
    "missing_field", ["sku", "name", "category", "price", "inventory"]
)
def test_missing_required_field_none(missing_field):
    product = {
        "sku": "SKU001",
        "name": "Wireless Mouse",
        "category": "Electronics",
        "price": Decimal("25.00"),
        "inventory": 50,
    }
    product[missing_field] = None

    issues = validate_required_fields(product)
    assert len(issues) == 1
    assert issues[0].code == ValidationCode.MISSING_REQUIRED_FIELD.value
    assert issues[0].field == missing_field
    assert issues[0].severity == Severity.ERROR.value


@pytest.mark.parametrize(
    "empty_field", ["sku", "name", "category", "price", "inventory"]
)
def test_empty_string_required_field(empty_field):
    product = {
        "sku": "SKU001",
        "name": "Wireless Mouse",
        "category": "Electronics",
        "price": Decimal("25.00"),
        "inventory": 50,
    }
    product[empty_field] = "   "

    issues = validate_required_fields(product)
    assert len(issues) == 1
    assert issues[0].code == ValidationCode.MISSING_REQUIRED_FIELD.value
    assert issues[0].field == empty_field
    assert issues[0].severity == Severity.ERROR.value


def test_multiple_missing_required_fields():
    product = {
        "sku": "",
        "name": None,
        "category": "Electronics",
        "price": None,
        "inventory": 10,
    }
    issues = validate_required_fields(product)
    flagged_fields = {i.field for i in issues}
    assert flagged_fields == {"sku", "name", "price"}


# ==========================================
# 2. Price Tests
# ==========================================


def test_positive_price():
    assert len(validate_price({"price": Decimal("10.50")})) == 0
    assert len(validate_price({"price": 100})) == 0
    assert len(validate_price({"price": "49.99"})) == 0


@pytest.mark.parametrize("invalid_price", [0, "0", Decimal("0.00"), -10, "-5.50", Decimal("-0.01")])
def test_zero_and_negative_price(invalid_price):
    issues = validate_price({"price": invalid_price})
    assert len(issues) == 1
    assert issues[0].code == ValidationCode.INVALID_PRICE.value
    assert issues[0].field == "price"
    assert issues[0].severity == Severity.ERROR.value
    assert "greater than 0" in issues[0].message


def test_non_numeric_price():
    issues = validate_price({"price": "invalid_number"})
    assert len(issues) == 1
    assert issues[0].code == ValidationCode.INVALID_PRICE.value
    assert issues[0].field == "price"
    assert issues[0].severity == Severity.ERROR.value


# ==========================================
# 3. Inventory Tests
# ==========================================


def test_valid_inventory():
    assert len(validate_inventory({"inventory": 0})) == 0
    assert len(validate_inventory({"inventory": 100})) == 0
    assert len(validate_inventory({"inventory": "5"})) == 0


@pytest.mark.parametrize("invalid_inv", [-1, "-5", -100])
def test_negative_inventory(invalid_inv):
    issues = validate_inventory({"inventory": invalid_inv})
    assert len(issues) == 1
    assert issues[0].code == ValidationCode.NEGATIVE_INVENTORY.value
    assert issues[0].field == "inventory"
    assert issues[0].severity == Severity.ERROR.value
    assert "cannot be negative" in issues[0].message


def test_non_integer_inventory():
    issues = validate_inventory({"inventory": "abc"})
    assert len(issues) == 1
    assert issues[0].code == ValidationCode.NEGATIVE_INVENTORY.value
    assert issues[0].field == "inventory"
    assert issues[0].severity == Severity.ERROR.value


# ==========================================
# 4. Optional Fields (Warnings) Tests
# ==========================================


def test_missing_image_url_and_brand_warnings():
    product = {
        "image_url": None,
        "brand": "",
    }
    issues = validate_optional_fields(product)
    assert len(issues) == 2

    codes = {i.code for i in issues}
    assert ValidationCode.MISSING_IMAGE_URL.value in codes
    assert ValidationCode.MISSING_BRAND.value in codes

    for issue in issues:
        assert issue.severity == Severity.WARNING.value


def test_present_optional_fields():
    product = {
        "image_url": "https://example.com/item.png",
        "brand": "Logitech",
    }
    issues = validate_optional_fields(product)
    assert len(issues) == 0


# ==========================================
# 5. Currency Tests
# ==========================================


@pytest.mark.parametrize("valid_curr", ["INR", "USD", "EUR", "GBP", "usd", "inr", "eur", "gbp"])
def test_supported_currencies(valid_curr):
    issues = validate_currency({"currency": valid_curr})
    assert len(issues) == 0


@pytest.mark.parametrize("unsupported_curr", ["JPY", "CAD", "AUD", "BTC", "XYZ"])
def test_unsupported_currency(unsupported_curr):
    issues = validate_currency({"currency": unsupported_curr})
    assert len(issues) == 1
    assert issues[0].code == ValidationCode.INVALID_CURRENCY.value
    assert issues[0].field == "currency"
    assert issues[0].severity == Severity.ERROR.value
    assert "not supported" in issues[0].message


# ==========================================
# 6. Duplicate SKU Tests (Catalog-level)
# ==========================================


def test_unique_skus():
    products = [
        {"sku": "SKU001", "name": "Item 1"},
        {"sku": "SKU002", "name": "Item 2"},
        {"sku": "SKU003", "name": "Item 3"},
    ]
    duplicate_issues = find_duplicate_skus(products)
    assert len(duplicate_issues) == 0


def test_duplicate_skus_flags_all_occurrences():
    products = [
        {"sku": "SKU_DUP", "name": "Item 1"},
        {"sku": "SKU_UNIQUE", "name": "Item 2"},
        {"sku": "SKU_DUP", "name": "Item 3"},
        {"sku": "SKU_DUP", "name": "Item 4"},
    ]
    duplicate_issues = find_duplicate_skus(products)
    # Indices 0, 2, 3 should be flagged
    assert set(duplicate_issues.keys()) == {0, 2, 3}
    assert 1 not in duplicate_issues

    for idx in (0, 2, 3):
        assert len(duplicate_issues[idx]) == 1
        assert duplicate_issues[idx][0].code == ValidationCode.DUPLICATE_SKU.value
        assert duplicate_issues[idx][0].field == "sku"
        assert duplicate_issues[idx][0].severity == Severity.ERROR.value


# ==========================================
# 7. Duplicate Product Name Tests (Normalized Exact Matching)
# ==========================================


@pytest.mark.parametrize(
    "input_name,expected_normalized",
    [
        ("Apple iPhone 15", "apple iphone 15"),
        ("  apple   iphone 15  ", "apple iphone 15"),
        ("APPLE\tIPHONE\n15", "apple iphone 15"),
        ("", ""),
        (None, ""),
    ],
)
def test_normalize_product_name(input_name, expected_normalized):
    assert normalize_product_name(input_name) == expected_normalized


def test_duplicate_product_names_flags_all_occurrences():
    products = [
        {"name": "Apple iPhone 15"},
        {"name": "Samsung Galaxy S24"},
        {"name": " apple   iphone 15 "},
    ]
    duplicate_issues = find_duplicate_product_names(products)
    # Indices 0 and 2 should be flagged
    assert set(duplicate_issues.keys()) == {0, 2}
    assert 1 not in duplicate_issues

    for idx in (0, 2):
        assert len(duplicate_issues[idx]) == 1
        assert duplicate_issues[idx][0].code == ValidationCode.DUPLICATE_PRODUCT_NAME.value
        assert duplicate_issues[idx][0].field == "name"
        assert duplicate_issues[idx][0].severity == Severity.WARNING.value


# ==========================================
# 8. Status Calculation Logic Tests
# ==========================================


def test_product_status_valid():
    result = calculate_product_status([])
    assert result == ValidationStatus.VALID


def test_product_status_warning_only():
    warning_issue = validate_optional_fields({"brand": None})[0]
    result = calculate_product_status([warning_issue])
    assert result == ValidationStatus.WARNING


def test_product_status_invalid_with_error():
    error_issue = validate_price({"price": -10})[0]
    result = calculate_product_status([error_issue])
    assert result == ValidationStatus.INVALID


def test_product_status_invalid_with_mixed_error_and_warning():
    warning_issue = validate_optional_fields({"brand": None})[0]
    error_issue = validate_price({"price": -10})[0]
    result = calculate_product_status([warning_issue, error_issue])
    assert result == ValidationStatus.INVALID


# ==========================================
# 9. Health Score Calculation Tests
# ==========================================


def test_health_score_perfect_catalog():
    # 100 products, 0 invalid, 0 warning
    score = calculate_catalog_health_score(
        total_products=100, invalid_products=0, warning_products=0
    )
    assert score == 100


def test_health_score_all_invalid():
    # 100 products, 100 invalid: 100 - (1.0 * 70) = 30
    score = calculate_catalog_health_score(
        total_products=100, invalid_products=100, warning_products=0
    )
    assert score == 30


def test_health_score_all_warning():
    # 100 products, 100 warning: 100 - (1.0 * 30) = 70
    score = calculate_catalog_health_score(
        total_products=100, invalid_products=0, warning_products=100
    )
    assert score == 70


def test_health_score_mixed():
    # 100 products, 10 invalid, 20 warning: 100 - (10/100*70) - (20/100*30) = 100 - 7 - 6 = 87
    score = calculate_catalog_health_score(
        total_products=100, invalid_products=10, warning_products=20
    )
    assert score == 87


def test_health_score_bounds_and_empty():
    assert calculate_catalog_health_score(0, 0, 0) == 100
    # Clamping tests
    assert calculate_catalog_health_score(10, 20, 20) == 0  # Would be negative, clamped to 0


# ==========================================
# 10. Single Product Validation & Dict / Model Compatibility
# ==========================================


def test_validate_product_valid_dict():
    product_dict = {
        "id": 1,
        "sku": "SKU100",
        "name": "Mechanical Keyboard",
        "category": "Electronics",
        "brand": "Keychron",
        "price": Decimal("89.99"),
        "currency": "USD",
        "inventory": 25,
        "image_url": "https://example.com/kb.jpg",
    }
    result: ProductValidationResult = validate_product(product_dict)
    assert result.status == ValidationStatus.VALID
    assert result.product_id == 1
    assert result.sku == "SKU100"
    assert len(result.issues) == 0


def test_validate_product_with_sqlalchemy_model():
    product = Product(
        id=42,
        sku="SKU-MODEL",
        name="Gaming Mouse",
        category="Peripherals",
        brand=None,  # Warning: missing brand
        price=Decimal("49.99"),
        currency="USD",
        inventory=-5,  # Error: negative inventory
        image_url="https://example.com/mouse.png",
    )
    result = validate_product(product)
    assert result.status == ValidationStatus.INVALID
    assert result.product_id == 42
    assert result.sku == "SKU-MODEL"

    issue_codes = {i.code for i in result.issues}
    assert ValidationCode.NEGATIVE_INVENTORY.value in issue_codes
    assert ValidationCode.MISSING_BRAND.value in issue_codes


# ==========================================
# 11. Full Catalog Validation Integration Test
# ==========================================


def test_validate_catalog_mixed_dataset():
    catalog = [
        # 1. Perfect Valid Product
        {
            "id": 1,
            "sku": "SKU-001",
            "name": "Standard Laptop",
            "category": "Computers",
            "brand": "Dell",
            "price": Decimal("1000.00"),
            "currency": "USD",
            "inventory": 10,
            "image_url": "https://example.com/laptop.jpg",
        },
        # 2. Warning-only Product (Missing brand & image_url)
        {
            "id": 2,
            "sku": "SKU-002",
            "name": "USB-C Cable",
            "category": "Accessories",
            "brand": None,
            "price": Decimal("15.00"),
            "currency": "USD",
            "inventory": 100,
            "image_url": None,
        },
        # 3. Invalid Product (Negative inventory & invalid currency)
        {
            "id": 3,
            "sku": "SKU-003",
            "name": "Monitor Stand",
            "category": "Office",
            "brand": "StandCo",
            "price": Decimal("40.00"),
            "currency": "JPY",  # Invalid currency error
            "inventory": -2,  # Negative inventory error
            "image_url": "https://example.com/stand.jpg",
        },
        # 4. Duplicate SKU Product A
        {
            "id": 4,
            "sku": "SKU-DUP",
            "name": "Desk Lamp",
            "category": "Lighting",
            "brand": "LightCo",
            "price": Decimal("25.00"),
            "currency": "USD",
            "inventory": 15,
            "image_url": "https://example.com/lamp.jpg",
        },
        # 5. Duplicate SKU Product B (and Duplicate Name with #4)
        {
            "id": 5,
            "sku": "SKU-DUP",
            "name": "  desk  lamp  ",
            "category": "Lighting",
            "brand": "LightCo",
            "price": Decimal("25.00"),
            "currency": "USD",
            "inventory": 15,
            "image_url": "https://example.com/lamp.jpg",
        },
    ]

    result: CatalogValidationResult = validate_catalog(catalog)

    assert result.total_products == 5
    # Product 1 is valid
    assert result.results[0].status == ValidationStatus.VALID
    # Product 2 has only warnings (missing brand and image)
    assert result.results[1].status == ValidationStatus.WARNING
    # Product 3 has errors (negative inventory, unsupported currency)
    assert result.results[2].status == ValidationStatus.INVALID
    # Product 4 has duplicate SKU error -> invalid
    assert result.results[3].status == ValidationStatus.INVALID
    # Product 5 has duplicate SKU error -> invalid
    assert result.results[4].status == ValidationStatus.INVALID

    assert result.valid_products == 1
    assert result.warning_products == 1
    assert result.invalid_products == 3

    # Total counts check
    assert result.invalid_products + result.warning_products + result.valid_products == 5

    # Health score: 100 - (3/5 * 70) - (1/5 * 30) = 100 - 42 - 6 = 52
    assert result.health_score == 52


def test_validate_empty_catalog():
    result = validate_catalog([])
    assert result.total_products == 0
    assert result.valid_products == 0
    assert result.warning_products == 0
    assert result.invalid_products == 0
    assert result.total_errors == 0
    assert result.total_warnings == 0
    assert result.health_score == 100
    assert result.results == []
