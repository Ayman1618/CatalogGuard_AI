from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.review_service import (
    ProductNotFoundError,
    approve_product,
    get_product_review_details,
    get_product_review_status,
    get_review_queue,
    reject_product,
)

router = APIRouter()


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="Get product review queue",
)
def get_reviews_queue_endpoint(db: Session = Depends(get_db)):
    """
    Retrieve products that require review (i.e. products whose latest validation status is 'invalid' or 'warning').
    """
    return get_review_queue(db)


@router.get(
    "/{product_id}",
    status_code=status.HTTP_200_OK,
    summary="Get product review details",
)
def get_product_review_details_endpoint(
    product_id: int, db: Session = Depends(get_db)
):
    """
    Retrieve detailed product information, validation status, review status, and issues.
    """
    try:
        return get_product_review_details(db, product_id)
    except ProductNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/{product_id}/approve",
    status_code=status.HTTP_200_OK,
    summary="Approve a product",
)
def approve_product_endpoint(product_id: int, db: Session = Depends(get_db)):
    """
    Approve a product by setting its review_status to 'approved'.
    Does NOT modify the automated validation status.
    """
    try:
        return approve_product(db, product_id)
    except ProductNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/{product_id}/reject",
    status_code=status.HTTP_200_OK,
    summary="Reject a product",
)
def reject_product_endpoint(product_id: int, db: Session = Depends(get_db)):
    """
    Reject a product by setting its review_status to 'rejected'.
    Does NOT modify the automated validation status.
    """
    try:
        return reject_product(db, product_id)
    except ProductNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/{product_id}/status",
    status_code=status.HTTP_200_OK,
    summary="Get product review status",
)
def get_product_review_status_endpoint(
    product_id: int, db: Session = Depends(get_db)
):
    """
    Retrieve current validation_status and review_status for a product.
    """
    try:
        return get_product_review_status(db, product_id)
    except ProductNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
