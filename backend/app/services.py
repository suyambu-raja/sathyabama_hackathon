"""Business logic services for Lost&Found AI platform using SQLAlchemy."""
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import (
    User, Item, ItemType, ItemStatus, UserRole
)

class ItemService:
    """Service for item management."""
    
    @staticmethod
    def create_item(db: Session, item_data: dict, user_id: int) -> Item:
        """Create a new item."""
        new_item = Item(
            type=ItemType(item_data["type"]),
            owner_id=user_id,
            product=item_data["product"],
            brand=item_data.get("brand"),
            color=item_data.get("color"),
            description=item_data["description"],
            image_url=item_data.get("image_url"),
            lat=item_data.get("lat", 0.0),
            lng=item_data.get("lng", 0.0),
            address=item_data.get("address")
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return new_item

    @staticmethod
    def get_items(db: Session, item_type: Optional[str] = None):
        """List all items."""
        query = db.query(Item)
        if item_type:
            query = query.filter(Item.type == ItemType(item_type))
        return query.all()

class UserService:
    """Service for user management."""
    
    @staticmethod
    def create_user(db: Session, user_data: dict, hashed_password: str) -> User:
        """Create a new user."""
        new_user = User(
            email=user_data["email"],
            full_name=user_data.get("full_name"),
            phone=user_data.get("phone"),
            hashed_password=hashed_password,
            role=UserRole.USER
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()