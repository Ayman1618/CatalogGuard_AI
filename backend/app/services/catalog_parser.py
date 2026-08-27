import io
import os
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Tuple
import pandas as pd


class CatalogParseError(Exception):
    """Exception raised when catalog file parsing or structural validation fails."""

    pass


REQUIRED_COLUMNS = ["sku", "name", "category", "price", "inventory"]
OPTIONAL_COLUMNS = ["description", "brand", "currency", "image_url"]


def parse_catalog_file(
    file_contents: bytes, filename: str
) -> Tuple[List[Dict[str, Any]], str, int]:
    """
    Parses and performs basic structural validation on a CSV or XLSX catalog file.

    Returns:
        Tuple of (list_of_product_dicts, file_type, total_products_count)

    Raises:
        CatalogParseError: If file type is unsupported, empty, missing required columns,
                           or contains unparseable row data.
    """
    if not file_contents or len(file_contents.strip()) == 0:
        raise CatalogParseError("File is empty or contains no data.")

    ext = os.path.splitext(filename)[1].lower()
    if ext == ".csv":
        file_type = "csv"
        try:
            df = pd.read_csv(io.BytesIO(file_contents), encoding="utf-8-sig")
        except UnicodeDecodeError:
            try:
                df = pd.read_csv(io.BytesIO(file_contents), encoding="latin1")
            except Exception as e:
                raise CatalogParseError(f"Failed to parse CSV file: {str(e)}")
        except Exception as e:
            raise CatalogParseError(f"Failed to parse CSV file: {str(e)}")
    elif ext in [".xlsx", ".xls"]:
        file_type = "xlsx"
        try:
            df = pd.read_excel(io.BytesIO(file_contents), engine="openpyxl")
        except Exception as e:
            raise CatalogParseError(f"Failed to parse Excel file: {str(e)}")
    else:
        raise CatalogParseError(
            "Unsupported file type. Only CSV (.csv) and Excel (.xlsx) files are supported."
        )

    if df.empty:
        raise CatalogParseError("Catalog file contains no product rows.")

    # Normalize column names (strip whitespace and convert to lowercase)
    column_mapping = {col: str(col).strip().lower() for col in df.columns}
    df = df.rename(columns=column_mapping)

    # Check for missing required columns
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_columns:
        raise CatalogParseError(
            f"Missing required catalog column: '{missing_columns[0]}'"
        )

    products: List[Dict[str, Any]] = []

    for idx, row in df.iterrows():
        row_num = idx + 1  # 1-indexed for user display

        # Check required fields
        for col in REQUIRED_COLUMNS:
            val = row.get(col)
            if pd.isna(val) or str(val).strip() == "":
                raise CatalogParseError(
                    f"Missing required value for '{col}' at row {row_num}"
                )

        sku = str(row["sku"]).strip()
        name = str(row["name"]).strip()
        category = str(row["category"]).strip()

        # Parse & convert price
        raw_price = str(row["price"]).strip()
        try:
            price_dec = Decimal(raw_price)
        except (InvalidOperation, ValueError):
            raise CatalogParseError(
                f"Invalid price value '{raw_price}' at row {row_num}: must be a valid number"
            )

        # Parse & convert inventory
        raw_inventory = row["inventory"]
        try:
            if isinstance(raw_inventory, float) and not raw_inventory.is_integer():
                raise ValueError()
            inventory_int = int(raw_inventory)
        except (ValueError, TypeError):
            raise CatalogParseError(
                f"Invalid inventory value '{raw_inventory}' at row {row_num}: must be an integer"
            )

        # Optional fields
        desc_val = row.get("description")
        description = (
            str(desc_val).strip()
            if pd.notna(desc_val) and str(desc_val).strip() != ""
            else None
        )

        brand_val = row.get("brand")
        brand = (
            str(brand_val).strip()
            if pd.notna(brand_val) and str(brand_val).strip() != ""
            else None
        )

        curr_val = row.get("currency")
        currency = (
            str(curr_val).strip()
            if pd.notna(curr_val) and str(curr_val).strip() != ""
            else "INR"
        )

        img_val = row.get("image_url")
        image_url = (
            str(img_val).strip()
            if pd.notna(img_val) and str(img_val).strip() != ""
            else None
        )

        products.append(
            {
                "sku": sku,
                "name": name,
                "description": description,
                "category": category,
                "brand": brand,
                "price": price_dec,
                "currency": currency,
                "inventory": inventory_int,
                "image_url": image_url,
            }
        )

    return products, file_type, len(products)
