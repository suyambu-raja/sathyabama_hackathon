from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from . import models, database
from .config import settings

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer()

class AuthManager:
    @staticmethod
    def verify_password(plain_password, hashed_password):
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password):
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str):
        """Authenticate user using email and password from database"""
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            return False
        if not AuthManager.verify_password(password, user.hashed_password):
            return False
        # Update last login timestamp
        user.last_login = datetime.utcnow()
        db.commit()
        return user

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_role(required_role: models.UserRole):
    def role_dependency(current_user: models.User = Depends(get_current_active_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_dependency

class ABACChecker:
    """Attribute-Based Access Control checker placeholder"""
    @staticmethod
    def check_access(user: models.User, resource: str, action: str) -> bool:
        # Basic implementation - can be extended
        if user.role == models.UserRole.ADMIN:
            return True
        if user.role == models.UserRole.USER and action in ["read", "create"]:
            return True
        return False