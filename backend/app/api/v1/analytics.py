from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.analytics_service import (
    AnalyticsSummary,
    HealthHistoryResponse,
    get_analytics_summary,
    get_health_history,
)

router = APIRouter()


@router.get(
    "/summary",
    response_model=AnalyticsSummary,
    status_code=status.HTTP_200_OK,
    summary="Get catalog analytics summary",
)
def get_analytics_summary_endpoint(db: Session = Depends(get_db)):
    """
    Retrieve summary catalog and validation analytics metrics including total catalogs,
    total products, latest health score, status breakdown, top validation issues,
    and review queue counts.
    """
    return get_analytics_summary(db)


@router.get(
    "/health-history",
    response_model=HealthHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get catalog validation health score history",
)
def get_health_history_endpoint(db: Session = Depends(get_db)):
    """
    Retrieve historical validation run health scores ordered chronologically.
    """
    return get_health_history(db)
