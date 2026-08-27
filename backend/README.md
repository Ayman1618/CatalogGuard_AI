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
- `GEMINI_API_KEY`: Google Gemini API Key for AI-assisted validation suggestions (optional)

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

## Running Tests

Execute the automated test suite:

```bash
pytest
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

### Validation API Endpoints

#### Validate Catalog Upload
Runs the deterministic validation engine over all products belonging to a specific catalog upload, creates a persistent `ValidationRun` record, and returns structured results.

- **Endpoint**: `POST /api/v1/catalogs/{upload_id}/validate`
- **Example Request**:
  ```bash
  curl -X POST "http://127.0.0.1:8000/api/v1/catalogs/1/validate"
  ```
- **Example Response**:
  ```json
  {
    "upload_id": 1,
    "total_products": 100,
    "valid_products": 70,
    "warning_products": 20,
    "invalid_products": 10,
    "total_errors": 15,
    "total_warnings": 25,
    "health_score": 87,
    "results": [
      {
        "product_id": 101,
        "sku": "SKU101",
        "status": "valid",
        "issues": []
      },
      {
        "product_id": 102,
        "sku": "SKU102",
        "status": "invalid",
        "issues": [
          {
            "code": "INVALID_PRICE",
            "field": "price",
            "severity": "error",
            "message": "Price must be greater than 0."
          }
        ]
      }
    ]
  }
  ```

#### Retrieve Validation Result
Retrieves the most recent validation result for a catalog upload without re-running validation.

- **Endpoint**: `GET /api/v1/catalogs/{upload_id}/validation`
- **Example Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/v1/catalogs/1/validation"
  ```

## Review Workflow

CatalogGuard includes a human-in-the-loop backend review workflow that allows operations users to inspect products with validation issues and manually approve or reject them.

### Workflow & Principles

1. **Queue Inclusion**: Products with automated validation statuses of `invalid` or `warning` enter the review queue.
2. **Human Inspection**: Operations users inspect detailed product attributes and validation issues.
3. **Decisions**: Products can be marked as `approved` or `rejected`. Decisions can be changed if needed (`pending` -> `approved`/`rejected`, `approved` <-> `rejected`).
4. **Validation Independence**: `review_status` (`pending`, `approved`, `rejected`) is strictly independent of `validation_status` (`valid`, `warning`, `invalid`). For example, an `invalid` product can be human-approved if verified externally, and automated validation status remains unmodified.

### Review API Endpoints

#### Review Queue
Retrieves products requiring operations review (`invalid` or `warning` status).
- **Endpoint**: `GET /api/v1/reviews`
- **Example Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/v1/reviews"
  ```

#### Product Review Details
Retrieves detailed product info, validation status, review status, issues, and latest validation run metadata.
- **Endpoint**: `GET /api/v1/reviews/{product_id}`
- **Example Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/v1/reviews/12"
  ```

#### Approve Product
Sets product `review_status` to `approved`.
- **Endpoint**: `POST /api/v1/reviews/{product_id}/approve`
- **Example Request**:
  ```bash
  curl -X POST "http://127.0.0.1:8000/api/v1/reviews/12/approve"
  ```

#### Reject Product
Sets product `review_status` to `rejected`.
- **Endpoint**: `POST /api/v1/reviews/{product_id}/reject`
- **Example Request**:
  ```bash
  curl -X POST "http://127.0.0.1:8000/api/v1/reviews/12/reject"
  ```

#### Review Status Summary
Retrieves current validation status and review status summary.
- **Endpoint**: `GET /api/v1/reviews/{product_id}/status`
- **Example Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/v1/reviews/12/status"
  ```

## AI-Assisted Validation Suggestions

CatalogGuard includes a Google Gemini-powered AI assistant that provides plain-language explanations and recommended operational actions for existing deterministic validation issues.

### Key AI Principles

1. **Deterministic Authority**: The rule engine remains the sole source of truth for catalog validity. AI does NOT determine or override validation status.
2. **Read-Only Assistance**: AI suggestions do NOT modify product attributes or automatically approve/reject products.
3. **Optional Service**: Requires the `GEMINI_API_KEY` environment variable. If unconfigured or unavailable, the application operates normally with AI features gracefully returning HTTP 503.

### AI Endpoint

#### Get Issue AI Suggestion
Generates a structured AI explanation, recommended reviewer action, and confidence score for a specific validation issue code on a product.

- **Endpoint**: `POST /api/v1/reviews/{product_id}/issues/{issue_code}/suggestion`
- **Example Request**:
  ```bash
  curl -X POST "http://127.0.0.1:8000/api/v1/reviews/12/issues/INVALID_PRICE/suggestion"
  ```
- **Example Response**:
  ```json
  {
    "explanation": "The product price is set to zero or a negative value, which is invalid for marketplace publication.",
    "suggestion": "Check the source catalog spreadsheet and update the product with the intended positive selling price.",
    "confidence": "high"
  }
  ```

## Catalog Analytics

CatalogGuard provides basic analytics endpoints that aggregate historical database metrics and validation run results to power the operations dashboard.

### Analytics Endpoints

#### Analytics Summary
Retrieves aggregate product counts, latest catalog health score, validation status breakdown (`valid`, `warning`, `invalid`), top validation issue occurrences, and review queue counts.

- **Endpoint**: `GET /api/v1/analytics/summary`
- **Example Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/v1/analytics/summary"
  ```
- **Example Response**:
  ```json
  {
    "total_catalogs": 10,
    "total_products": 1250,
    "latest_health_score": 87,
    "latest_validation": {
      "total_products": 100,
      "valid_products": 70,
      "warning_products": 20,
      "invalid_products": 10,
      "total_errors": 15,
      "total_warnings": 25
    },
    "status_breakdown": {
      "valid": 70,
      "warning": 20,
      "invalid": 10
    },
    "top_issues": [
      {
        "code": "MISSING_IMAGE_URL",
        "count": 18
      },
      {
        "code": "MISSING_BRAND",
        "count": 12
      }
    ],
    "products_requiring_review": 30
  }
  ```

#### Health Score History
Retrieves historical validation run health scores ordered chronologically to track catalog quality over time.

- **Endpoint**: `GET /api/v1/analytics/health-history`
- **Example Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/v1/analytics/health-history"
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
