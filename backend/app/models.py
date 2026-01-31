from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base
from pydantic import BaseModel, EmailStr
from typing import Optional

class ItemType(enum.Enum):
    LOST = "lost"
    FOUND = "found"

class ItemStatus(enum.Enum):
    OPEN = "open"
    MATCHED = "matched"
    CLAIMED = "claimed"
    RELEASED = "released"
    ESCALATED = "escalated"

class UserRole(enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"
    POLICE = "POLICE"
    MANAGEMENT = "MANAGEMENT"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    items = relationship("Item", back_populates="owner")

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(ItemType))
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    product = Column(String)
    brand = Column(String, nullable=True)
    color = Column(String, nullable=True)
    description = Column(String)
    
    image_url = Column(String, nullable=True)
    lat = Column(Float, default=0.0)
    lng = Column(Float, default=0.0)
    address = Column(String, nullable=True)
    
    status = Column(Enum(ItemStatus), default=ItemStatus.OPEN)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="items")
    matches = relationship("Match", primaryjoin="or_(Item.id==Match.lost_item_id, Item.id==Match.found_item_id)")

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    lost_item_id = Column(Integer, ForeignKey("items.id"))
    found_item_id = Column(Integer, ForeignKey("items.id"))
    score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"))
    claimant_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

# Pydantic models for API requests/responses
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ItemCreate(BaseModel):
    type: str  # "lost" or "found"
    product: str
    brand: Optional[str] = None
    color: Optional[str] = None
    description: str
    image_url: Optional[str] = None
    lat: Optional[float] = 0.0
    lng: Optional[float] = 0.0
    address: Optional[str] = None

class ItemUpdate(BaseModel):
    product: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None

class ItemOut(BaseModel):
    id: int
    type: ItemType
    owner_id: int
    product: str
    brand: Optional[str] = None
    color: Optional[str] = None
    description: str
    image_url: Optional[str] = None
    lat: float
    lng: float
    address: Optional[str] = None
    status: ItemStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ClaimRequest(BaseModel):
    item_id: int
    verification_responses: Optional[dict] = None
    phone_number: Optional[str] = None

class ClaimOut(BaseModel):
    id: int
    item_id: int
    claimant_id: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
    
class OTPVerifyRequest(BaseModel):
    claim_id: int
    otp_code: str

class MatchResponse(BaseModel):
    id: int
    lost_item_id: int
    found_item_id: int
    score: float
    created_at: datetime
    
    class Config:
        from_attributes = True