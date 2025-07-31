from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import jwt
import time
import re
from typing import Dict, Any, Optional
import secrets
import hashlib
import logging
from datetime import datetime, timedelta
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Rate limiting storage (in production, use Redis)
rate_limit_storage: Dict[str, list] = {}

class SecurityMiddleware(BaseHTTPMiddleware):
    """Comprehensive security middleware for enhanced privacy and safety"""
    
    async def dispatch(self, request: Request, call_next):
        # Add security headers for enhanced privacy and safety
        response = await call_next(request)
        
        # Essential security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' fonts.googleapis.com; "
            "font-src 'self' fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self'"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Privacy headers
        response.headers["X-Robots-Tag"] = "noindex, nofollow, nosnippet, noarchive"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
        
        return response

class AuthenticationManager:
    """JWT-based authentication manager for secure user sessions"""
    
    @staticmethod
    def generate_token(user_id: str, additional_claims: Dict[str, Any] = None) -> str:
        """Generate JWT token for user with enhanced privacy"""
        payload = {
            "user_id": user_id,
            "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
            "iat": datetime.utcnow(),
            "jti": secrets.token_urlsafe(16)  # JWT ID for token revocation
        }
        
        if additional_claims:
            payload.update(additional_claims)
            
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """Verify and decode JWT token with enhanced security"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            raise HTTPException(status_code=401, detail="Invalid token")

class InputValidator:
    """Enhanced input validation and sanitization for privacy and safety"""
    
    # Validation patterns for different input types
    PATTERNS = {
        'email': re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
        'phone': re.compile(r'^\+?[\d\s\-\(\)]{10,15}$'),
        'message': re.compile(r'^[\w\s\.\,\!\?\-\'\"\(\)\[\]]{1,1000}$'),
        'name': re.compile(r'^[a-zA-Z\s]{1,50}$'),
        'username': re.compile(r'^[a-zA-Z0-9_]{3,30}$'),
        'session_id': re.compile(r'^[a-zA-Z0-9]{16,32}$')
    }
    
    # Dangerous patterns that could compromise privacy/safety
    DANGEROUS_PATTERNS = [
        re.compile(r'<script.*?</script>', re.IGNORECASE | re.DOTALL),
        re.compile(r'javascript:', re.IGNORECASE),
        re.compile(r'vbscript:', re.IGNORECASE),
        re.compile(r'on\w+\s*=', re.IGNORECASE),
        re.compile(r'<iframe.*?>', re.IGNORECASE),
        re.compile(r'<object.*?>', re.IGNORECASE),
        re.compile(r'<embed.*?>', re.IGNORECASE),
        re.compile(r'\$\{.*\}'),  # Template injection
        re.compile(r'{{.*}}'),    # Template injection
        re.compile(r'\$\(.*\)'),  # MongoDB injection
        re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]'),  # Control characters
    ]
    
    @classmethod
    def sanitize_input(cls, input_data: str) -> str:
        """Sanitize user input to prevent XSS and injection attacks"""
        if not isinstance(input_data, str):
            return str(input_data)
        
        # Check for dangerous patterns
        for pattern in cls.DANGEROUS_PATTERNS:
            if pattern.search(input_data):
                logger.warning(f"Dangerous pattern detected in input: {input_data[:50]}...")
                raise HTTPException(status_code=400, detail="Invalid input detected")
        
        # HTML encode special characters for privacy/safety
        sanitized = (input_data
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&#x27;')
            .replace('/', '&#x2F;'))
        
        return sanitized.strip()
    
    @classmethod
    def validate_input(cls, input_data: str, input_type: str) -> bool:
        """Validate input against predefined safe patterns"""
        if input_type not in cls.PATTERNS:
            return True
        
        return bool(cls.PATTERNS[input_type].match(input_data))
    
    @classmethod
    def validate_and_sanitize(cls, input_data: str, input_type: str = None) -> str:
        """Validate and sanitize input for enhanced safety"""
        sanitized = cls.sanitize_input(input_data)
        
        if input_type and not cls.validate_input(sanitized, input_type):
            raise HTTPException(status_code=400, detail=f"Invalid {input_type} format")
        
        return sanitized

class RateLimiter:
    """Rate limiting implementation for preventing abuse"""
    
    @staticmethod
    def is_rate_limited(key: str, limit: int = 100, window: int = 3600) -> bool:
        """Check if request is rate limited"""
        now = time.time()
        
        if key not in rate_limit_storage:
            rate_limit_storage[key] = []
        
        # Remove old entries
        rate_limit_storage[key] = [
            timestamp for timestamp in rate_limit_storage[key] 
            if now - timestamp < window
        ]
        
        # Check limit
        if len(rate_limit_storage[key]) >= limit:
            logger.warning(f"Rate limit exceeded for key: {key}")
            return True
        
        # Add current request
        rate_limit_storage[key].append(now)
        return False
    
    @staticmethod
    def get_client_key(request: Request) -> str:
        """Generate privacy-safe client key for rate limiting"""
        # Use combination of IP and User-Agent for better key generation
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        # Hash the combination for privacy protection
        key_data = f"{client_ip}:{user_agent}"
        return hashlib.sha256(key_data.encode()).hexdigest()[:16]

# Authentication dependency
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Get current authenticated user with enhanced security"""
    token = credentials.credentials
    return AuthenticationManager.verify_token(token)

async def rate_limit_dependency(request: Request):
    """Rate limiting dependency for API protection"""
    client_key = RateLimiter.get_client_key(request)
    
    if RateLimiter.is_rate_limited(client_key, limit=100, window=3600):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

# Enhanced password security
class PasswordSecurity:
    """Secure password hashing and verification"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using PBKDF2 with enhanced security"""
        import hashlib
        import secrets
        
        # Generate a random salt for each password
        salt = secrets.token_hex(16)
        # Use 100,000 iterations for strong security
        pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return f"{salt}:{pwdhash.hex()}"
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify password against hash"""
        import hashlib
        
        try:
            salt, pwdhash = hashed.split(':')
            computed_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return computed_hash.hex() == pwdhash
        except ValueError:
            return False

# CSRF Protection for enhanced safety
class CSRFProtection:
    """CSRF token generation and validation"""
    
    @staticmethod
    def generate_csrf_token(session_id: str) -> str:
        """Generate CSRF token for session"""
        import hmac
        
        message = f"{session_id}:{int(time.time())}"
        return hmac.new(
            JWT_SECRET.encode(), 
            message.encode(), 
            hashlib.sha256
        ).hexdigest()
    
    @staticmethod
    def validate_csrf_token(token: str, session_id: str, max_age: int = 3600) -> bool:
        """Validate CSRF token"""
        import hmac
        
        try:
            # Extract timestamp from token by regenerating with current session
            current_time = int(time.time())
            
            # Check tokens generated within the time window
            for timestamp in range(current_time - max_age, current_time + 1):
                message = f"{session_id}:{timestamp}"
                expected_token = hmac.new(
                    JWT_SECRET.encode(), 
                    message.encode(), 
                    hashlib.sha256
                ).hexdigest()
                
                if hmac.compare_digest(token, expected_token):
                    return True
            
            return False
        except Exception:
            return False

# Privacy-focused logging
class PrivacyLogger:
    """Enhanced logging that protects user privacy"""
    
    @staticmethod
    def log_security_event(event: str, details: Dict[str, Any] = None):
        """Log security events while protecting privacy"""
        if details:
            # Remove or hash sensitive information
            safe_details = {}
            for key, value in details.items():
                if key in ['password', 'token', 'email', 'phone']:
                    safe_details[key] = '[REDACTED]'
                elif key == 'ip':
                    # Hash IP for privacy
                    safe_details[key] = hashlib.sha256(str(value).encode()).hexdigest()[:8]
                else:
                    safe_details[key] = value
            details = safe_details
        
        logger.info(f"Security Event: {event} - Details: {details}")