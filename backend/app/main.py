from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.catalogs import router as catalogs_router
from app.api.v1.reviews import router as reviews_router

app = FastAPI(
    title="CatalogGuard API",
    description="Backend API for CatalogGuard platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(catalogs_router, prefix="/api/v1/catalogs", tags=["Catalogs"])
app.include_router(reviews_router, prefix="/api/v1/reviews", tags=["Reviews"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
