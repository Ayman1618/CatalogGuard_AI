# CatalogGuard Backend

FastAPI backend service for the CatalogGuard platform.

## Requirements

- Python 3.10+
- PostgreSQL 14+

## Database

CatalogGuard uses PostgreSQL as its database store, with SQLAlchemy 2.0 ORM for database operations and Alembic for schema migrations.

## Environment Configuration

Copy `.env.example` to `.env` and set your configuration variables:

```bash
cp .env.example .env
```

Key environment variables:
- `APP_NAME`: Name of the application (default: `CatalogGuard API`)
- `ENVIRONMENT`: Runtime environment (`development`, `production`, etc.)
- `DATABASE_URL`: PostgreSQL connection string (format: `postgresql+psycopg://username:password@localhost:5432/catalogguard`)

## Setup

1. Create a virtual environment:
   ```bash
   python3 -m venv .venv
   ```

2. Activate the virtual environment:
   - On macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```
   - On Windows:
     ```cmd
     .venv\Scripts\activate
     ```

3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

4. Run Database Migrations:
   ```bash
   alembic upgrade head
   ```

## Running the Server

Start the FastAPI development server from the `backend` directory:

```bash
uvicorn app.main:app --reload
```

## Catalog Upload & Ingestion

CatalogGuard supports ingesting product catalogs from CSV and Excel spreadsheets.

### Supported File Types
- CSV (`.csv`)
- Excel (`.xlsx`)

### Expected Catalog Columns
- **Required**: `sku`, `name`, `category`, `price`, `inventory`
- **Optional**: `description`, `brand`, `currency` (defaults to `"INR"`), `image_url`

### API Endpoints

#### Upload Catalog
- **Endpoint**: `POST /api/v1/catalogs/upload`
- **Content-Type**: `multipart/form-data`
- **Example Request**:
  ```bash
  curl -X POST "http://127.0.0.1:8000/api/v1/catalogs/upload" \
    -F "file=@products.csv"
  ```
- **Example Response**:
  ```json
  {
    "message": "Catalog uploaded successfully",
    "upload_id": 1,
    "filename": "products.csv",
    "total_products": 25,
    "status": "processed"
  }
  ```

#### Catalog Upload History
- **Endpoint**: `GET /api/v1/catalogs`
- **Example Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/v1/catalogs"
  ```

## Catalog Validation

CatalogGuard features a deterministic, rule-based catalog validation engine located in `app/services/validation/`. The engine checks individual product records and full catalogs to catch structural and data quality issues prior to publication.

### Supported Validation Rules

| Rule Code | Target Field | Severity | Description |
|-----------|--------------|----------|-------------|
| `MISSING_REQUIRED_FIELD` | `sku`, `name`, `category`, `price`, `inventory` | Error | Required field is missing or empty |
| `INVALID_PRICE` | `price` | Error | Price must be a valid number greater than 0 |
| `NEGATIVE_INVENTORY` | `inventory` | Error | Inventory cannot be negative (must be >= 0) |
| `MISSING_IMAGE_URL` | `image_url` | Warning | Product image URL is missing |
| `MISSING_BRAND` | `brand` | Warning | Product brand is missing |
| `INVALID_CURRENCY` | `currency` | Error | Currency must be one of `INR`, `USD`, `EUR`, `GBP` |
| `DUPLICATE_SKU` | `sku` | Error | Duplicate SKU detected across the catalog (flags all occurrences) |
| `DUPLICATE_PRODUCT_NAME` | `name` | Warning | Duplicate product name detected via normalized exact matching |

### Product Status

- **Valid**: No errors or warnings detected.
- **Warning**: Only non-blocking quality issues detected (no blocking errors).
- **Invalid**: At least one blocking validation error detected.

### Catalog Health Score

The catalog health score is a deterministic quality metric from 0 to 100:

$$\text{Score} = 100 - \left(\frac{\text{Invalid Products}}{\text{Total Products}} \times 70\right) - \left(\frac{\text{Warning Products}}{\text{Total Products}} \times 30\right)$$

- Clamped between 0 and 100, rounded to the nearest whole number.
- An empty catalog returns 100.

## Health Check

Verify the service is running:

- Endpoint: `GET /health`
- Response:
  ```json
  {
    "status": "ok"
  }
  ```

FastAPI automatic interactive documentation (Swagger UI) is available at `/docs`.

