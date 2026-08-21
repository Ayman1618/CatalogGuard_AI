from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.catalog_upload import CatalogUpload
from app.models.product import Product
from app.services.catalog_parser import CatalogParseError, parse_catalog_file

router = APIRouter()


@router.post(
    "/upload",
    status_code=status.HTTP_200_OK,
    summary="Upload product catalog CSV or XLSX",
)
async def upload_catalog(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload and ingest a product catalog from a CSV or XLSX file.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing.",
        )

    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading uploaded file: {str(e)}",
        )

    try:
        parsed_products, file_type, total_count = parse_catalog_file(
            contents, file.filename
        )
    except CatalogParseError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Perform atomic database transaction
    try:
        catalog_upload = CatalogUpload(
            filename=file.filename,
            file_type=file_type,
            total_products=total_count,
            status="processed",
        )
        db.add(catalog_upload)
        db.flush()  # Obtain catalog_upload.id

        product_objects = [
            Product(
                upload_id=catalog_upload.id,
                sku=p["sku"],
                name=p["name"],
                description=p["description"],
                category=p["category"],
                brand=p["brand"],
                price=p["price"],
                currency=p["currency"],
                inventory=p["inventory"],
                image_url=p["image_url"],
            )
            for p in parsed_products
        ]
        db.add_all(product_objects)
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error during catalog ingestion (e.g. duplicate SKU): {str(e.orig)}",
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected server error during catalog ingestion: {str(e)}",
        )

    return {
        "message": "Catalog uploaded successfully",
        "upload_id": catalog_upload.id,
        "filename": catalog_upload.filename,
        "total_products": catalog_upload.total_products,
        "status": catalog_upload.status,
    }


@router.get("", summary="Get catalog upload history")
def get_catalog_uploads(db: Session = Depends(get_db)):
    """
    Retrieve previous catalog upload history metadata.
    """
    uploads = (
        db.query(CatalogUpload)
        .order_by(CatalogUpload.created_at.desc())
        .all()
    )

    return [
        {
            "upload_id": u.id,
            "filename": u.filename,
            "file_type": u.file_type,
            "total_products": u.total_products,
            "status": u.status,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in uploads
    ]
