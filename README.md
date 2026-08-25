# CatalogGuard

> **Validate. Standardize. Publish.**

CatalogGuard is a product catalog quality and validation platform built for multi-vendor marketplaces. It helps marketplace administrators detect, validate, and resolve catalog inconsistencies before products go live, reducing customer-facing errors and improving overall catalog quality.

---

## 🚀 Features

- 📤 **Catalog Upload & Ingestion**: Upload product catalogs via CSV or Excel (`.xlsx`).
- ✅ **Deterministic Rule Validation**: Automated checks for missing fields, invalid prices, negative inventory, duplicate SKUs, invalid currency, and missing brand/image assets.
- 📊 **Operations Dashboard**: Real-time KPI metrics, catalog health scores, and recent ingestion history.
- 👨‍💼 **Review Queue**: Human-in-the-loop inspection and decision triage for products requiring manual operations review.
- ✔️ **Approve / Reject Workflow**: Independent human operational decision-making with instant status synchronization.

---

## 🏗️ Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Lucide React

### Backend
- FastAPI
- SQLAlchemy 2.0 ORM & Alembic
- PostgreSQL
- Pandas & openpyxl

---

## 📂 Project Structure

```
CatalogGuard_AI/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Endpoints (catalogs, reviews)
│   │   ├── core/            # Database configuration
│   │   ├── models/          # SQLAlchemy ORM models
│   │   └── services/        # Parsers, validation engine, review service
│   ├── alembic/             # Schema migrations
│   └── tests/               # Pytest suite
│
├── frontend/
│   ├── app/                 # Next.js App Router (/, /uploads, /reviews, /reviews/[productId])
│   ├── components/          # Dashboard, Uploads, Reviews, Layout, UI
│   ├── lib/                 # Centralized API client & utilities
│   └── types/               # TypeScript interfaces
│
└── README.md
```

---

## ⚙️ Local Development Setup

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# or .venv\Scripts\activate # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

The backend API will run on `http://localhost:8000`. Interactive API documentation is available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Run Next.js development server
npm run dev
```

The frontend application will be accessible at `http://localhost:3000`.

---

## 👥 Team

- **Ayman Velani** – Backend Development
- **Rushikesh Zope** – Frontend Development & UI/UX
- **Yash Bodhe** – Database, Testing & Documentation

---

## 📄 License

This project is developed for educational purposes as part of a software engineering project.
