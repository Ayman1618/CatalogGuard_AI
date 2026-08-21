from fastapi import FastAPI
from app.api.v1.catalogs import router as catalogs_router

app = FastAPI(
    title="CatalogGuard API",
    description="Backend API for CatalogGuard platform",
    version="0.1.0",
)

app.include_router(catalogs_router, prefix="/api/v1/catalogs", tags=["Catalogs"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
