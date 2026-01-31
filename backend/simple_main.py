"""Simple FastAPI backend for Lost&Found AI platform."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uvicorn

app = FastAPI(
    title="Lost&Found AI Platform",
    description="AI-driven lost/found platform - Simple Backend",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data storage
items_db = []
users_db = []

@app.get("/")
def read_root():
    return {
        "message": "Lost&Found AI Platform API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/dashboard")
def get_dashboard():
    return {
        "user_stats": {
            "total_items": len(items_db),
            "lost_items": len([i for i in items_db if i.get("type") == "lost"]),
            "found_items": len([i for i in items_db if i.get("type") == "found"]),
            "open_items": len([i for i in items_db if i.get("status") == "open"]),
            "resolved_items": len([i for i in items_db if i.get("status") == "resolved"])
        },
        "recent_items": items_db[-10:],  # Last 10 items
        "public_items": [
            {
                "id": "1",
                "type": "lost",
                "product": "iPhone 14 Pro",
                "brand": "Apple",
                "color": "Deep Purple",
                "description": "Lost iPhone with cracked screen protector",
                "gps": {"lat": 12.9716, "lng": 77.5946, "address": "Bangalore, India"},
                "status": "open",
                "created_at": "2026-01-31T10:00:00Z"
            },
            {
                "id": "2", 
                "type": "found",
                "product": "Leather Wallet",
                "brand": "Unknown",
                "color": "Brown",
                "description": "Found brown leather wallet near metro station",
                "gps": {"lat": 12.9716, "lng": 77.5946, "address": "Bangalore, India"},
                "status": "open",
                "created_at": "2026-01-31T11:00:00Z"
            },
            {
                "id": "3",
                "type": "lost", 
                "product": "MacBook Air",
                "brand": "Apple",
                "color": "Silver",
                "description": "Lost MacBook Air with university stickers",
                "gps": {"lat": 12.9716, "lng": 77.5946, "address": "Bangalore, India"},
                "status": "open",
                "created_at": "2026-01-31T12:00:00Z"
            }
        ]
    }

@app.post("/api/auth/login")
def login(credentials: dict):
    return {
        "access_token": "demo_token_12345",
        "token_type": "bearer",
        "expires_in": 86400,
        "user": {
            "id": "1",
            "email": credentials.get("email", "demo@lostfound.ai"),
            "full_name": "Demo User",
            "role": "USER"
        }
    }

@app.post("/api/auth/register") 
def register(user_data: dict):
    return {
        "access_token": "demo_token_12345",
        "token_type": "bearer", 
        "expires_in": 86400,
        "user": {
            "id": "1",
            "email": user_data.get("email"),
            "full_name": user_data.get("full_name"),
            "role": "USER"
        }
    }

@app.get("/api/auth/me")
def get_current_user():
    return {
        "id": "1",
        "email": "demo@lostfound.ai",
        "full_name": "Demo User",
        "role": "USER",
        "created_at": "2026-01-31T10:00:00Z"
    }

@app.post("/api/items/lost")
def create_lost_item(item_data: dict):
    item = {
        "id": str(len(items_db) + 1),
        "type": "lost",
        **item_data
    }
    items_db.append(item)
    return {"item_id": item["id"], "message": "Lost item reported successfully"}

@app.post("/api/items/found")
def create_found_item(item_data: dict):
    item = {
        "id": str(len(items_db) + 1),
        "type": "found", 
        **item_data
    }
    items_db.append(item)
    
    # Mock AI matching
    matches = [
        {
            "item": {
                "id": "1",
                "product": "Similar Item",
                "description": "AI matched item",
                "score": 0.85
            },
            "score": 0.85,
            "breakdown": {
                "image": 0.9,
                "text_image": 0.8,
                "location": 0.85,
                "time": 0.9
            }
        }
    ]
    
    return {
        "item_id": item["id"],
        "message": "Found item reported successfully", 
        "matches_found": len(matches),
        "top_matches": matches
    }

@app.get("/api/items")
def get_user_items():
    return items_db

@app.get("/api/items/{item_id}")
def get_item(item_id: str):
    # Mock item data
    item = {
        "id": item_id,
        "type": "lost",
        "product": "Demo Item",
        "description": "This is a demo item for testing",
        "gps": {"lat": 12.9716, "lng": 77.5946, "address": "Bangalore, India"},
        "status": "open",
        "created_at": "2026-01-31T10:00:00Z"
    }
    
    return {
        "item": item,
        "can_claim": True,
        "can_modify": False
    }

@app.post("/api/ai/match/{item_id}")
def get_item_matches(item_id: str):
    # Mock AI matching response
    return [
        {
            "item": {
                "id": "match_1",
                "type": "found",
                "product": "Matched Item 1",
                "description": "AI found this matching item",
                "gps": {"lat": 12.9716, "lng": 77.5946},
                "status": "open",
                "created_at": "2026-01-31T11:00:00Z"
            },
            "score": 0.92,
            "breakdown": {
                "image": 0.95,
                "text_image": 0.88,
                "location": 0.92,
                "time": 0.94
            }
        }
    ]

@app.post("/api/upload/image")
def upload_image():
    # Mock image upload
    return {"image_url": "https://mock-s3-bucket.s3.amazonaws.com/images/demo/mock_image.jpg"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)