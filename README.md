# CatalogGuard

> **Validate. Standardize. Publish.**

CatalogGuard is an AI-assisted product catalog quality and validation platform built for multi-vendor marketplaces. It enables marketplace operators to ingest, validate, triage, and approve product catalogs before publishing them to the marketplace.

---

## 🚀 Features

- 📤 **Catalog Upload & Ingestion**: Upload product catalogs via CSV or Excel (`.xlsx`) with automatic header normalization and UTF-8 BOM decoding.
- ✅ **Deterministic Rule Validation**: Automated checks for missing fields, invalid prices, negative inventory, duplicate SKUs, duplicate product names, invalid currencies, and missing brand/image assets.
- 📊 **Operations Dashboard**: Real-time KPI metrics, catalog health scores, status breakdown visualizations, top issue occurrences, and health history tracking.
- 👨‍💼 **Review Queue**: Human-in-the-loop inspection for products flagged with data quality errors or warnings.
- ✔️ **Approve / Reject Workflow**: Independent human review decision-making with persistent status updates.
- 🤖 **AI-Assisted Suggestions**: Plain-language explanations and recommended reviewer actions powered by Google Gemini (strictly supplemental; non-destructive to deterministic validation).
- 📈 **Catalog Analytics & Trends**: Historical health score progression across validation runs.

---

## 🏗️ Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Lucide React

### Backend
- FastAPI
- SQLAlchemy 2.0 ORM & Alembic
- PostgreSQL 14+
- Pandas & openpyxl
- Google GenAI SDK (`gemini-2.5-flash` optional AI assistance)

---

## 📂 Project Structure

```
CatalogGuard_AI/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Endpoints (catalogs, reviews, analytics)
│   │   ├── core/            # Database engine and session configuration
│   │   ├── models/          # SQLAlchemy ORM models (CatalogUpload, Product, ValidationRun)
│   │   └── services/        # Parsers, validation engine, review, AI, analytics
│   ├── alembic/             # Schema migration scripts
│   └── tests/               # Pytest unit & integration test suite (98 tests)
│
├── frontend/
│   ├── app/                 # Next.js App Router (/, /uploads, /reviews, /reviews/[productId])
│   ├── components/          # Dashboard, Uploads, Reviews, Layout, UI components
│   ├── lib/                 # Centralized API client & utilities
│   └── types/               # TypeScript interfaces matching backend models
│
├── demo/
│   └── demo_catalog.csv     # Sample multi-vendor catalog with intentional test cases
│
└── README.md
```

---

## ⚙️ Local Development Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Linux/macOS
# or .venv\Scripts\activate # Windows

# Install backend dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

The backend API will run on `http://localhost:8000`.
Interactive API documentation (Swagger UI) is available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

The frontend application will run on `http://localhost:3000`.

### 3. Running Backend Tests

```bash
cd backend
pytest
```

---

## 📋 Deterministic Validation Rules

| Rule Code | Target Field | Severity | Description |
|-----------|--------------|----------|-------------|
| `MISSING_REQUIRED_FIELD` | `sku`, `name`, `category`, `price`, `inventory` | Error | Required field is missing or empty |
| `INVALID_PRICE` | `price` | Error | Price must be a valid number greater than 0 |
| `NEGATIVE_INVENTORY` | `inventory` | Error | Inventory cannot be negative (must be >= 0) |
| `MISSING_IMAGE_URL` | `image_url` | Warning | Product image URL is missing |
| `MISSING_BRAND` | `brand` | Warning | Product brand is missing |
| `INVALID_CURRENCY` | `currency` | Error | Currency must be one of `INR`, `USD`, `EUR`, `GBP` |
| `DUPLICATE_SKU` | `sku` | Error | Duplicate SKU detected across the catalog |
| `DUPLICATE_PRODUCT_NAME` | `name` | Warning | Duplicate product name detected across the catalog |

---

## 🧪 Demo Workflow

To test the complete end-to-end flow:

1. Open `http://localhost:3000` to view the **Operations Dashboard**.
2. Navigate to **Upload Catalog** (`/uploads`).
3. Drag and drop `demo/demo_catalog.csv` to ingest sample catalog products.
4. Click **Validate** on the uploaded catalog to run deterministic validation checks and view the catalog health score.
5. Navigate to **Review Queue** (`/reviews`) to inspect flagged products.
6. Click any product to open the **Product Review Inspection** page (`/reviews/[productId]`).
7. Click **Get AI Suggestion** on any validation issue to see Gemini-assisted explanations and recommended reviewer actions.
8. Click **Approve Product** or **Reject Product** to set the operational review decision.
9. Return to the **Dashboard** (`/`) to observe real-time KPI metrics, validation breakdown, and health history progression.

---

## 👥 Team

- **Ayman Velani** – Backend Development & AI Integration
- **Rushikesh Zope** – Frontend Development & UI/UX
- **Yash Bodhe** – Database, Testing & Documentation

---

## 📄 License

This project is developed for educational purposes as part of a software engineering capstone project.
