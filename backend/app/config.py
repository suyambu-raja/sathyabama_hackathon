"""Configuration management for Lost&Found AI backend."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow",
        case_sensitive=False
    )
    
    # App Configuration
    debug: bool = True
    secret_key: str = "your-super-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    
    # Database
    database_url: str = "sqlite:///./lost_found.db"
    
    # AWS S3
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_s3_bucket_name: str = "lost-found-images"
    aws_region: str = "us-east-1"
    
    # Communication
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    
    # Payment (Mock)
    razorpay_key_id: str = "mock_key_id"
    razorpay_key_secret: str = "mock_key_secret"
    
    # Geocoding
    nominatim_user_agent: str = "LostFoundAI/1.0"


settings = Settings()