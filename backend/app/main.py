from fastapi import FastAPI

app = FastAPI(
    title="CatalogGuard API",
    description="Backend API for CatalogGuard platform",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {"status": "ok"}
