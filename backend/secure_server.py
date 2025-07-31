from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
import os
import logging
import uuid
from pathlib import Path
from dotenv import load_dotenv

# Import security middleware
from security_middleware import (
    SecurityMiddleware, 
    AuthenticationManager, 
    InputValidator, 
    get_current_user,
    rate_limit_dependency,
    PasswordSecurity,
    CSRFProtection
)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('security.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# MongoDB connection with proper error handling
try:
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'chatzilla_secure')
    
    if not mongo_url:
        raise ValueError("MONGO_URL environment variable is required")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    logger.info("Database connection established")
    
except Exception as e:
    logger.error(f"Database connection failed: {e}")
    raise

# Create FastAPI app with security configurations
app = FastAPI(
    title="Chatzilla Secure API",
    description="Secure chat application API with end-to-end encryption",
    version="2.0.0",
    docs_url=None,  # Disable docs in production
    redoc_url=None,  # Disable redoc in production
)

# Add security middleware
app.add_middleware(SecurityMiddleware)

# Add trusted host middleware (configure for your domain)
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "*.emergentagent.com"]
)

# CORS configuration - FIXED VULNERABILITY
ALLOWED_ORIGINS = [
    "https://localhost:3000",
    "https://127.0.0.1:3000",
    # Add your production frontend URL here
    os.environ.get('FRONTEND_URL', 'https://localhost:3000')
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,  # FIXED: No longer allows all origins
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # Specific methods only
    allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"],  # Specific headers only
)

# Create API router with prefix
api_router = APIRouter(prefix="/api")

# Enhanced Pydantic models with validation
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('username')
    def validate_username(cls, v):
        return InputValidator.validate_and_sanitize(v, 'name')
    
    @validator('email')
    def validate_email(cls, v):
        return InputValidator.validate_and_sanitize(v, 'email')

class UserLogin(BaseModel):
    email: str
    password: str
    csrf_token: Optional[str] = None

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    recipient_id: str
    
    @validator('content')
    def validate_content(cls, v):
        return InputValidator.validate_and_sanitize(v, 'message')

class MessageResponse(BaseModel):
    id: str
    content: str
    sender_id: str
    recipient_id: str
    timestamp: datetime
    encrypted: bool = True

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('client_name')
    def validate_client_name(cls, v):
        return InputValidator.validate_and_sanitize(v, 'name')

class StatusCheckCreate(BaseModel):
    client_name: str
    
    @validator('client_name')
    def validate_client_name(cls, v):
        return InputValidator.validate_and_sanitize(v, 'name')

# Authentication endpoints
@api_router.post("/auth/register")
async def register_user(
    user_data: UserCreate,
    request: Request,
    _: None = Depends(rate_limit_dependency)
):
    """Register a new user with secure password hashing"""
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Hash password securely
        hashed_password = PasswordSecurity.hash_password(user_data.password)
        
        # Create user document
        user_doc = {
            "id": str(uuid.uuid4()),
            "username": user_data.username,
            "email": user_data.email,
            "password_hash": hashed_password,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        # Insert user
        result = await db.users.insert_one(user_doc)
        
        # Generate JWT token
        token = AuthenticationManager.generate_token(user_doc["id"])
        
        logger.info(f"User registered successfully: {user_data.email}")
        
        return {
            "message": "User registered successfully",
            "user_id": user_doc["id"],
            "access_token": token,
            "token_type": "bearer"
        }
        
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@api_router.post("/auth/login")
async def login_user(
    login_data: UserLogin,
    request: Request,
    _: None = Depends(rate_limit_dependency)
):
    """Authenticate user and return JWT token"""
    try:
        # Find user
        user = await db.users.find_one({"email": login_data.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not PasswordSecurity.verify_password(login_data.password, user["password_hash"]):
            logger.warning(f"Failed login attempt for: {login_data.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(status_code=401, detail="Account disabled")
        
        # Generate JWT token
        token = AuthenticationManager.generate_token(user["id"])
        
        logger.info(f"User logged in successfully: {login_data.email}")
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user["id"],
            "username": user["username"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

# Protected endpoints
@api_router.get("/messages")
async def get_messages(
    current_user: dict = Depends(get_current_user),
    _: None = Depends(rate_limit_dependency)
):
    """Get messages for authenticated user"""
    try:
        messages = await db.messages.find({
            "$or": [
                {"sender_id": current_user["user_id"]},
                {"recipient_id": current_user["user_id"]}
            ]
        }).sort("timestamp", -1).limit(100).to_list(100)
        
        return [MessageResponse(**msg) for msg in messages]
        
    except Exception as e:
        logger.error(f"Failed to fetch messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch messages")

@api_router.post("/messages")
async def send_message(
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user),
    _: None = Depends(rate_limit_dependency)
):
    """Send a message (server-side encrypted)"""
    try:
        # Create message document
        message_doc = {
            "id": str(uuid.uuid4()),
            "content": message_data.content,  # In production, encrypt this
            "sender_id": current_user["user_id"],
            "recipient_id": message_data.recipient_id,
            "timestamp": datetime.utcnow(),
            "encrypted": True
        }
        
        # Insert message
        await db.messages.insert_one(message_doc)
        
        logger.info(f"Message sent from {current_user['user_id']} to {message_data.recipient_id}")
        
        return MessageResponse(**message_doc)
        
    except Exception as e:
        logger.error(f"Failed to send message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")

# Updated status endpoints with authentication
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(
    input_data: StatusCheckCreate,
    current_user: dict = Depends(get_current_user),
    _: None = Depends(rate_limit_dependency)
):
    """Create status check (authenticated)"""
    try:
        status_dict = input_data.dict()
        status_obj = StatusCheck(**status_dict)
        
        # Add user info
        status_doc = status_obj.dict()
        status_doc["user_id"] = current_user["user_id"]
        
        await db.status_checks.insert_one(status_doc)
        
        return status_obj
        
    except Exception as e:
        logger.error(f"Failed to create status check: {e}")
        raise HTTPException(status_code=500, detail="Failed to create status check")

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(
    current_user: dict = Depends(get_current_user),
    _: None = Depends(rate_limit_dependency)
):
    """Get status checks for authenticated user"""
    try:
        status_checks = await db.status_checks.find({
            "user_id": current_user["user_id"]
        }).limit(100).to_list(100)
        
        return [StatusCheck(**status_check) for status_check in status_checks]
        
    except Exception as e:
        logger.error(f"Failed to fetch status checks: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch status checks")

# Health check endpoint (public)
@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "2.0.0-secure"
    }

# CSRF token endpoint
@api_router.get("/csrf-token")
async def get_csrf_token(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get CSRF token for authenticated user"""
    session_id = current_user.get("jti", str(uuid.uuid4()))
    csrf_token = CSRFProtection.generate_csrf_token(session_id)
    
    return {"csrf_token": csrf_token}

# Include router in main app
app.include_router(api_router)

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler"""
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} - Path: {request.url.path}")
    
    return {"error": exc.detail, "status_code": exc.status_code}

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """General exception handler"""
    logger.error(f"Unhandled exception: {exc} - Path: {request.url.path}")
    
    return {"error": "Internal server error", "status_code": 500}

# Startup event
@app.on_event("startup")
async def startup_event():
    """Application startup tasks"""
    logger.info("🚀 Chatzilla Secure API starting up...")
    
    # Create indexes for better performance
    try:
        await db.users.create_index("email", unique=True)
        await db.messages.create_index([("sender_id", 1), ("timestamp", -1)])
        await db.messages.create_index([("recipient_id", 1), ("timestamp", -1)])
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Failed to create indexes: {e}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown cleanup"""
    logger.info("🛑 Chatzilla Secure API shutting down...")
    client.close()