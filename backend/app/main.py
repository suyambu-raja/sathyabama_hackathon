from fastapi import FastAPI, Depends, HTTPException, status, APIRouter, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta
import uvicorn
from typing import List, Optional
from sqlalchemy.orm import Session
import os
import shutil
from pathlib import Path

from .config import settings
from .database import get_db, Base, engine
from . import models
from .models import (
    UserCreate, UserLogin, Token, ItemCreate, ItemUpdate,
    ClaimRequest, ClaimOut, OTPVerifyRequest, MatchResponse, ItemType, ItemStatus,
    UserOut, ItemOut,
)
from .auth import AuthManager, get_current_active_user, get_current_user, require_role
from .services import UserService, ItemService

# Create database tables
Base.metadata.create_all(bind=engine)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Initialize FastAPI app
app = FastAPI(
    title="Lost&Found AI Platform",
    description="AI-driven lost/found platform with multimodal matching and secure verification",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# API Router
api_router = APIRouter(prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Lost&Found AI API", "docs": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# --- AUTHENTICATION ROUTES ---

@api_router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    existing_user = UserService.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed_password = AuthManager.get_password_hash(user_data.password)
    user = UserService.create_user(db, user_data.dict(), hashed_password)

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = AuthManager.create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token"""
    user = AuthManager.authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = AuthManager.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/users/me", response_model=UserOut)
def read_current_user(current_user: models.User = Depends(get_current_active_user)):
    """Get current user profile"""
    return current_user

# --- ITEM ROUTES ---

@api_router.get("/items", response_model=List[ItemOut])
def list_items(
    item_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all items with optional filtering by type"""
    items = ItemService.get_items(db, item_type)
    return items

@api_router.post("/items", response_model=ItemOut)
def create_item(
    item_data: ItemCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new item (lost or found)"""
    item = ItemService.create_item(db, item_data.dict(), current_user.id)
    return item

@api_router.get("/items/{item_id}", response_model=ItemOut)
def get_item(item_id: int, db: Session = Depends(get_db)):
    """Get a specific item by ID"""
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@api_router.put("/items/{item_id}", response_model=ItemOut)
def update_item(
    item_id: int,
    item_data: ItemUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an existing item"""
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if user owns the item
    if item.owner_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this item"
        )
    
    # Update item fields
    update_data = item_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item

@api_router.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an item"""
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if user owns the item
    if item.owner_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this item"
        )
    
    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}

@api_router.get("/my-items", response_model=List[ItemOut])
def get_my_items(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's items"""
    items = db.query(models.Item).filter(models.Item.owner_id == current_user.id).all()
    return items

# --- DASHBOARD ROUTE ---

@api_router.get("/dashboard")
def get_dashboard(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    item_type: Optional[str] = None
):
    """Get dashboard data with user statistics and recent items"""
    # Get user's items
    query = db.query(models.Item).filter(models.Item.owner_id == current_user.id)
    
    if item_type:
        query = query.filter(models.Item.type == item_type)
    
    all_items = query.all()
    
    # Calculate statistics
    total_items = len(all_items)
    lost_items = len([i for i in all_items if i.type == models.ItemType.LOST])
    open_items = len([i for i in all_items if i.status == models.ItemStatus.OPEN])
    resolved_items = len([i for i in all_items if i.status in [models.ItemStatus.CLAIMED, models.ItemStatus.RELEASED]])
    
    # Get recent items (last 10)
    recent_items = query.order_by(models.Item.created_at.desc()).limit(10).all()
    
    return {
        "user_stats": {
            "total_items": total_items,
            "lost_items": lost_items,
            "open_items": open_items,
            "resolved_items": resolved_items,
        },
        "recent_items": recent_items,
    }

# --- FILE UPLOAD ROUTE ---

@api_router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_active_user)
):
    """Upload an image file"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{current_user.id}_{timestamp}.{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Return full URL so frontend can display images
    # In production, use proper domain. For development, use localhost
    base_url = settings.base_url if hasattr(settings, 'base_url') else "http://localhost:8000"
    image_url = f"{base_url}/uploads/{filename}"
    
    return {"image_url": image_url}

# --- AI MATCHING ROUTE ---

@api_router.post("/ai/match/{item_id}", response_model=List[MatchResponse])
def get_ai_matches(
    item_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI matches for an item (MVP: returns empty list)"""
    # For MVP, return empty list
    # In production, this would call the AI matching service
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Return existing matches from database
    matches = db.query(models.Match).filter(
        (models.Match.lost_item_id == item_id) | (models.Match.found_item_id == item_id)
    ).all()
    
    return matches

# --- CLAIMS ROUTES ---

@api_router.post("/claims", response_model=ClaimOut)
def create_claim(
    claim_data: ClaimRequest,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a claim for an item"""
    # Check if item exists
    item = db.query(models.Item).filter(models.Item.id == claim_data.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if user already has a claim for this item
    existing_claim = db.query(models.Claim).filter(
        models.Claim.item_id == claim_data.item_id,
        models.Claim.claimant_id == current_user.id
    ).first()
    
    if existing_claim:
        raise HTTPException(
            status_code=400,
            detail="You have already claimed this item"
        )
    
    # Create claim
    claim = models.Claim(
        item_id=claim_data.item_id,
        claimant_id=current_user.id,
        status="pending"
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    
    return claim

@api_router.post("/claims/verify-otp")
def verify_otp(
    otp_data: OTPVerifyRequest,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Verify OTP for claim (MVP: mock verification)"""
    # Check if claim exists
    claim = db.query(models.Claim).filter(models.Claim.id == otp_data.claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Check if user owns the claim
    if claim.claimant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # For MVP, accept any OTP code (in production, verify against sent OTP)
    if otp_data.otp_code:
        claim.status = "verified"
        db.commit()
        return {
            "message": "OTP verified successfully",
            "status": "verified",
            "next_step": "Contact item owner for handover"
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

# --- ADMIN ROUTES ---

@api_router.get("/admin/escalations", response_model=List[ItemOut])
def get_escalations(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all escalated items (admin only)"""
    # Check if user is admin
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.POLICE, models.UserRole.MANAGEMENT]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get escalated items
    escalated_items = db.query(models.Item).filter(
        models.Item.status == models.ItemStatus.ESCALATED
    ).all()
    
    return escalated_items

@api_router.post("/admin/escalate")
def trigger_escalation(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Trigger escalation for old unclaimed items (admin only)"""
    # Check if user is admin
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.POLICE, models.UserRole.MANAGEMENT]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Find items older than 30 days with status 'open'
    from datetime import timedelta
    threshold_date = datetime.utcnow() - timedelta(days=30)
    
    old_items = db.query(models.Item).filter(
        models.Item.status == models.ItemStatus.OPEN,
        models.Item.created_at < threshold_date
    ).all()
    
    # Mark as escalated
    count = 0
    for item in old_items:
        item.status = models.ItemStatus.ESCALATED
        count += 1
    
    db.commit()
    
    return {
        "message": f"Escalated {count} items",
        "count": count
    }

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)