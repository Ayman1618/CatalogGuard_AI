from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.validation_run import ValidationRun


class CatalogUpload(Base):
    """SQLAlchemy model representing a catalog upload event."""

    __tablename__ = "catalog_uploads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    total_products: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="processed"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    products: Mapped[List["Product"]] = relationship(
        "Product", back_populates="catalog_upload", cascade="all, delete-orphan"
    )
    validation_runs: Mapped[List["ValidationRun"]] = relationship(
        "ValidationRun", back_populates="catalog_upload", cascade="all, delete-orphan"
    )
