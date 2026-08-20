from sqlalchemy import Numeric
from app.core.database import Base
from app.models.product import Product


def test_product_model_metadata():
    """Verify that Product model is correctly defined and registered in SQLAlchemy metadata."""
    assert Product.__tablename__ == "products"
    assert "products" in Base.metadata.tables

    table = Base.metadata.tables["products"]
    columns = {col.name: col for col in table.columns}

    expected_columns = [
        "id",
        "sku",
        "name",
        "description",
        "category",
        "brand",
        "price",
        "currency",
        "inventory",
        "image_url",
        "created_at",
        "updated_at",
    ]

    for col_name in expected_columns:
        assert col_name in columns, f"Column '{col_name}' missing from products table"

    # Verify specific constraints and types
    assert columns["id"].primary_key is True
    assert columns["sku"].unique is True
    assert columns["sku"].nullable is False
    assert columns["name"].nullable is False
    assert columns["category"].nullable is False
    assert isinstance(columns["price"].type, Numeric)
    assert columns["currency"].default.arg == "INR"
    assert columns["inventory"].default.arg == 0
