# CatalogGuard

> **Validate. Standardize. Publish.**

CatalogGuard is an AI-assisted product catalog validation platform built for multi-vendor marketplaces. It helps marketplace administrators detect and resolve catalog inconsistencies before products go live, reducing customer-facing errors and improving overall catalog quality.

---

## 🚀 Features

- 📤 Upload product catalogs via CSV or Excel
- ✅ Rule-based validation for common catalog errors
- 🤖 AI-powered correction suggestions for ambiguous records
- 📊 Dashboard with catalog health insights and validation metrics
- 👨💼 Admin review workflow for approving or rejecting AI suggestions
- 📄 Export validated product catalogs as CSV

---

## 📸 Screenshots

> Add screenshots here once the UI is complete.

| Dashboard | Validation Results |
|-----------|--------------------|
| *(Coming Soon)* | *(Coming Soon)* |

---

## 🏗️ Tech Stack

### Frontend
- Next.js
- Tailwind CSS
- shadcn/ui

### Backend
- FastAPI

### Database
- PostgreSQL
- SQLAlchemy

### AI
- Gemini Flash API

### File Processing
- Pandas

### Authentication
- JWT

### Deployment
- Vercel (Frontend)
- Render (Backend)

---

## 📂 Project Structure

```
catalogguard/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
│
├── backend/
│   ├── app/
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── validators/
│   └── utils/
│
├── uploads/
├── docs/
└── README.md
```

---

## ⚙️ How It Works

1. Seller uploads a CSV or Excel catalog.
2. The system performs rule-based validation.
3. Products with issues are flagged.
4. AI generates suggestions for applicable records.
5. An administrator reviews the suggestions.
6. Approved products are published.
7. The cleaned catalog can be exported.

---

## 📋 Validation Checks

CatalogGuard validates:

- Missing mandatory fields
- Invalid product prices
- Negative inventory
- Duplicate SKUs
- Duplicate product names
- Missing image URLs
- Invalid categories
- Incorrect data formats

---

## 🤖 AI Assistance

AI is used selectively for cases where rule-based validation is insufficient.

Examples include:

- Product title standardization
- Category recommendations
- Spelling corrections
- Formatting improvements

AI suggestions are always reviewed by an administrator before approval.

---

## 📊 Dashboard Metrics

- Total Products Uploaded
- Validation Success Rate
- Invalid Products
- Duplicate Products
- Pending Reviews
- Catalog Health Score
- Average Processing Time

---

## 🎯 Project Goals

- Improve catalog quality
- Reduce manual validation effort
- Prevent invalid products from going live
- Improve customer trust
- Streamline marketplace operations

---

## 🔮 Future Enhancements

- Seller API integration
- Image validation
- Bulk approval workflow
- Multi-language support
- Price anomaly detection
- Real-time inventory synchronization

---

## 👥 Team

- **Ayman Velani** – Backend Development & AI Integration
- **Rushikesh Zope** – Frontend Development & UI/UX
- **Yash Bodhe** – Database, Testing & Documentation

---

## 📄 License

This project is developed for educational purposes as part of a college software engineering project.
