from datetime import datetime
from typing import Any, List, TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Integer, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.catalog_upload import CatalogUpload


class ValidationRun(Base):
    """SQLAlchemy model representing a validation run execution for a catalog upload."""

    __tablename__ = "validation_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    upload_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("catalog_uploads.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    total_products: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    valid_products: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warning_products: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    invalid_products: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_errors: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_warnings: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    health_score: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    results: Mapped[List[Any]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    catalog_upload: Mapped["CatalogUpload"] = relationship(
        "CatalogUpload", back_populates="validation_runs"
    )
