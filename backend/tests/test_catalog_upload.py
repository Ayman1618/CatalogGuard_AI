import io
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.catalog_upload import CatalogUpload
from app.models.product import Product

# Create isolated in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_successful_csv_upload():
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
    db = TestingSessionLocal()
    upload = db.query(CatalogUpload).filter_by(id=data["upload_id"]).first()
    assert upload is not None
    assert upload.total_products == 2

    products = db.query(Product).filter_by(upload_id=upload.id).all()
    assert len(products) == 2
    db.close()


def test_successful_xlsx_upload():
    df = pd.DataFrame([
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
    ])
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

    db = TestingSessionLocal()
    products = db.query(Product).all()
    assert len(products) == 1
    assert products[0].sku == "XLSX001"
    db.close()


def test_unsupported_file_type():
    files = {
        "file": ("document.txt", io.BytesIO(b"some text content"), "text/plain")
    }
    response = client.post("/api/v1/catalogs/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_missing_required_column():
    # Missing 'sku' column
    csv_content = "name,category,price,inventory\nLaptop,Electronics,999.99,10\n"
    files = {
        "file": ("bad_catalog.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")
    }
    response = client.post("/api/v1/catalogs/upload", files=files)
    assert response.status_code == 400
    assert "Missing required catalog column" in response.json()["detail"]
    assert "sku" in response.json()["detail"]


def test_empty_catalog():
    # Header only, no data rows
    csv_content = "sku,name,category,price,inventory\n"
    files = {
        "file": ("empty.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")
    }
    response = client.post("/api/v1/catalogs/upload", files=files)
    assert response.status_code == 400
    assert "no product rows" in response.json()["detail"].lower()


def test_transaction_rollback_on_duplicate_sku():
    # First upload SKU001
    csv_content1 = (
        "sku,name,category,price,inventory\nSKU001,Laptop,Electronics,999.99,10\n"
    )
    client.post(
        "/api/v1/catalogs/upload",
        files={"file": ("cat1.csv", io.BytesIO(csv_content1.encode("utf-8")), "text/csv")},
    )

    db = TestingSessionLocal()
    initial_product_count = db.query(Product).count()
    initial_upload_count = db.query(CatalogUpload).count()
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
        files={"file": ("cat2.csv", io.BytesIO(csv_content2.encode("utf-8")), "text/csv")},
    )
    assert response.status_code == 400

    # Ensure transaction rolled back completely
    final_product_count = db.query(Product).count()
    final_upload_count = db.query(CatalogUpload).count()
    assert final_product_count == initial_product_count
    assert final_upload_count == initial_upload_count
    db.close()


def test_get_catalog_upload_history():
    csv_content = (
        "sku,name,category,price,inventory\nSKU_HIST_1,Item 1,Cat 1,10.00,5\n"
    )
    client.post(
        "/api/v1/catalogs/upload",
        files={"file": ("history.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )

    response = client.get("/api/v1/catalogs")
    assert response.status_code == 200
    history = response.json()
    assert isinstance(history, list)
    assert len(history) >= 1
    assert history[0]["filename"] == "history.csv"
    assert history[0]["total_products"] == 1
    assert history[0]["status"] == "processed"
