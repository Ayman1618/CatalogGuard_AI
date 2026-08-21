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
