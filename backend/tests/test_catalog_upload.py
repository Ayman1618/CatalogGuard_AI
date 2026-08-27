import io
import pandas as pd
from app.models.catalog_upload import CatalogUpload
from app.models.product import Product


def test_successful_csv_upload(client, db_session):
    csv_content = (
        "sku,name,description,category,brand,price,currency,inventory,image_url\n"
        "SKU001,Laptop,High performance laptop,Electronics,TechBrand,999.99,USD,10,http://example.com/img1.jpg\n"
        "SKU002,Mouse,Ergonomic wireless mouse,Electronics,TechBrand,25.50,USD,50,http://example.com/img2.jpg\n"
    )
    files = {
        "file": ("products.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")
    }

    response = client.post("/api/v1/catalogs/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Catalog uploaded successfully"
    assert data["filename"] == "products.csv"
    assert data["total_products"] == 2
    assert data["status"] == "processed"
    assert "upload_id" in data

    # Verify DB contents
    upload = db_session.query(CatalogUpload).filter_by(id=data["upload_id"]).first()
    assert upload is not None
    assert upload.total_products == 2

    products = db_session.query(Product).filter_by(upload_id=upload.id).all()
    assert len(products) == 2


def test_successful_xlsx_upload(client, db_session):
    df = pd.DataFrame(
        [
            {
                "sku": "XLSX001",
                "name": "Keyboard",
                "description": "Mechanical Keyboard",
                "category": "Electronics",
                "brand": "KeyBrand",
                "price": 75.00,
                "currency": "INR",
                "inventory": 20,
                "image_url": "http://example.com/kb.jpg",
            }
        ]
    )
    excel_buffer = io.BytesIO()
    with pd.ExcelWriter(excel_buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
    excel_buffer.seek(0)

    files = {
        "file": (
            "catalog.xlsx",
            excel_buffer,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    }

    response = client.post("/api/v1/catalogs/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["total_products"] == 1
    assert data["filename"] == "catalog.xlsx"

    products = db_session.query(Product).all()
    assert len(products) == 1
    assert products[0].sku == "XLSX001"


def test_unsupported_file_type(client):
    files = {
        "file": ("document.txt", io.BytesIO(b"some text content"), "text/plain")
    }
    response = client.post("/api/v1/catalogs/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_missing_required_column(client):
    # Missing 'sku' column
    csv_content = "name,category,price,inventory\nLaptop,Electronics,999.99,10\n"
    files = {
        "file": ("bad_catalog.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")
    }
    response = client.post("/api/v1/catalogs/upload", files=files)
    assert response.status_code == 400
    assert "Missing required catalog column" in response.json()["detail"]
    assert "sku" in response.json()["detail"]


def test_empty_catalog(client):
    # Header only, no data rows
    csv_content = "sku,name,category,price,inventory\n"
    files = {
        "file": ("empty.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")
    }
    response = client.post("/api/v1/catalogs/upload", files=files)
    assert response.status_code == 400
    assert "no product rows" in response.json()["detail"].lower()


def test_transaction_rollback_on_duplicate_sku(client, db_session):
    # First upload SKU001
    csv_content1 = (
        "sku,name,category,price,inventory\nSKU001,Laptop,Electronics,999.99,10\n"
    )
    client.post(
        "/api/v1/catalogs/upload",
        files={
            "file": ("cat1.csv", io.BytesIO(csv_content1.encode("utf-8")), "text/csv")
        },
    )

    initial_product_count = db_session.query(Product).count()
    initial_upload_count = db_session.query(CatalogUpload).count()
    assert initial_product_count == 1
    assert initial_upload_count == 1

    # Second upload attempts to insert duplicate SKU001
    csv_content2 = (
        "sku,name,category,price,inventory\n"
        "SKU002,Mouse,Electronics,25.00,5\n"
        "SKU001,Laptop,Electronics,999.99,10\n"
    )
    response = client.post(
        "/api/v1/catalogs/upload",
        files={
            "file": ("cat2.csv", io.BytesIO(csv_content2.encode("utf-8")), "text/csv")
        },
    )
    assert response.status_code == 400

    # Ensure transaction rolled back completely
    final_product_count = db_session.query(Product).count()
    final_upload_count = db_session.query(CatalogUpload).count()
    assert final_product_count == initial_product_count
    assert final_upload_count == initial_upload_count


def test_get_catalog_upload_history(client):
    csv_content = (
        "sku,name,category,price,inventory\nSKU_HIST_1,Item 1,Cat 1,10.00,5\n"
    )
    client.post(
        "/api/v1/catalogs/upload",
        files={
            "file": (
                "history.csv",
                io.BytesIO(csv_content.encode("utf-8")),
                "text/csv",
            )
        },
    )

    response = client.get("/api/v1/catalogs")
    assert response.status_code == 200
    history = response.json()
    assert isinstance(history, list)
    assert len(history) >= 1
    assert history[0]["filename"] == "history.csv"
    assert history[0]["total_products"] == 1
    assert history[0]["status"] == "processed"


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "CatalogGuard API"
    assert data["version"] == "0.1.0"
    assert data["docs_url"] == "/docs"
    assert data["health_url"] == "/health"


def test_successful_csv_upload_with_utf8_bom(client, db_session):
    # UTF-8 with BOM prefix
    csv_content = (
        "\ufeffsku,name,description,category,brand,price,currency,inventory,image_url\n"
        "BOM001,BOM Laptop,High performance laptop,Electronics,TechBrand,1299.99,USD,10,http://example.com/bom.jpg\n"
    )
    files = {
        "file": (
            "products_bom.csv",
            io.BytesIO(csv_content.encode("utf-8-sig")),
            "text/csv",
        )
    }

    response = client.post("/api/v1/catalogs/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Catalog uploaded successfully"
    assert data["total_products"] == 1

    product = db_session.query(Product).filter_by(sku="BOM001").first()
    assert product is not None
    assert product.name == "BOM Laptop"

