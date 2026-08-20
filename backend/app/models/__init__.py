"""
Database models package for CatalogGuard.
"""

from app.core.database import Base
from app.models.product import Product

__all__ = ["Base", "Product"]
