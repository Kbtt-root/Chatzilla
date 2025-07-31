"""
Tor Hidden Service Security Configuration for Chatzilla
Enhanced security measures for anonymous communication
"""

import os
import hashlib
import time
from typing import List, Dict, Any, Optional
from fastapi import Request, HTTPException
import logging

logger = logging.getLogger(__name__)

class TorSecurityConfig:
    """Security configuration optimized for Tor hidden services"""
    
    # Enhanced security settings for Tor
    TOR_SESSION_TIMEOUT = 15 * 60  # 15 minutes (shorter for anonymity)
    TOR_MAX_MESSAGE_LENGTH = 500   # Shorter messages for traffic analysis resistance
    TOR_MAX_USERNAME_LENGTH = 20   # Shorter usernames for anonymity
    
    # Tor-specific rate limits (more restrictive)
    TOR_RATE_LIMITS = {
        'login': (5, 300),      # 5 attempts per 5 minutes
        'register': (2, 3600),  # 2 registrations per hour
        'message': (20, 60),    # 20 messages per minute
        'contact_select': (50, 60),  # 50 contacts per minute
        'search': (30, 60),     # 30 searches per minute
    }
    
    @staticmethod
    def get_tor_allowed_origins() -> List[str]:
        """Get allowed origins for Tor hidden service"""
        onion_address = os.environ.get('ONION_ADDRESS')
        if not onion_address:
            return []
            
        return [
            f"http://{onion_address}",
            f"https://{onion_address}",  # In case of Tor over HTTPS
        ]
    
    @staticmethod
    def is_tor_request(request: Request) -> bool:
        """Detect if request is coming through Tor"""
        # Check for Tor-specific indicators
        tor_indicators = [
            # Common Tor headers
            request.headers.get('X-Tor-Circuit-Type'),
            request.headers.get('X-Forwarded-For-Tor'),
            
            # Check if Host header contains .onion
            '.onion' in request.headers.get('host', ''),
            
            # Check User-Agent for Tor Browser patterns
            'Tor Browser' in request.headers.get('user-agent', ''),
        ]
        
        return any(tor_indicators)
    
    @staticmethod
    def get_tor_security_headers() -> Dict[str, str]:
        """Get security headers optimized for Tor hidden services"""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            # Note: HSTS not needed for .onion (Tor provides encryption)
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data:; "
                "connect-src 'self'; "
                "form-action 'self'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'"
            ),
            "Referrer-Policy": "no-referrer",  # Enhanced privacy for Tor
            "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
            "X-Tor-Enhanced": "true",  # Custom header to indicate Tor optimization
        }
    
    @staticmethod
    def sanitize_for_tor(data: str) -> str:
        """Enhanced sanitization for Tor users (traffic analysis resistance)"""
        if not data:
            return ""
        
        # Basic sanitization
        sanitized = (data
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&#x27;')
            .replace('/', '&#x2F;')
            .strip())
        
        # Normalize length to resist traffic analysis
        # Pad shorter messages to minimum length
        min_length = 20
        if len(sanitized) < min_length and sanitized:
            # Add invisible padding
            padding_needed = min_length - len(sanitized)
            sanitized += ' ' * padding_needed
        
        return sanitized[:TorSecurityConfig.TOR_MAX_MESSAGE_LENGTH]
    
    @staticmethod
    def generate_tor_session_id() -> str:
        """Generate session ID optimized for Tor"""
        # Use high entropy for Tor sessions
        entropy_sources = [
            str(time.time_ns()),
            os.urandom(32).hex(),
            str(hash(os.urandom(16))),
        ]
        
        combined = ''.join(entropy_sources)
        return hashlib.sha256(combined.encode()).hexdigest()[:32]
    
    @staticmethod
    def get_tor_rate_limit(action: str) -> tuple:
        """Get rate limit settings for Tor traffic"""
        return TorSecurityConfig.TOR_RATE_LIMITS.get(action, (10, 60))
    
    @staticmethod
    def log_tor_activity(request: Request, action: str, details: Dict[str, Any] = None):
        """Log activity with Tor-specific privacy considerations"""
        if details is None:
            details = {}
        
        # Hash IP for privacy (even though it's usually 127.0.0.1 for Tor)
        client_ip = request.client.host if request.client else "unknown"
        hashed_ip = hashlib.sha256(client_ip.encode()).hexdigest()[:16]
        
        log_entry = {
            "action": action,
            "hashed_client": hashed_ip,
            "is_tor": TorSecurityConfig.is_tor_request(request),
            "timestamp": time.time(),
            "user_agent_hash": hashlib.sha256(
                request.headers.get('user-agent', '').encode()
            ).hexdigest()[:16],
            **details
        }
        
        logger.info(f"Tor Activity: {log_entry}")

class TorInputValidator:
    """Enhanced input validation for Tor hidden services"""
    
    # Tor-specific validation patterns (more restrictive)
    TOR_PATTERNS = {
        'username': r'^[a-zA-Z0-9_]{3,20}$',  # Alphanumeric + underscore only
        'message': r'^[\w\s\.\,\!\?\-\'\"\(\)]{1,500}$',  # Shorter messages
        'search': r'^[\w\s]{1,50}$',  # Simple search terms only
    }
    
    @classmethod
    def validate_tor_input(cls, data: str, input_type: str) -> bool:
        """Validate input with Tor-specific restrictions"""
        if not data or input_type not in cls.TOR_PATTERNS:
            return False
        
        import re
        return bool(re.match(cls.TOR_PATTERNS[input_type], data))
    
    @classmethod
    def sanitize_and_validate_tor(cls, data: str, input_type: str) -> str:
        """Sanitize and validate input for Tor users"""
        # First sanitize
        sanitized = TorSecurityConfig.sanitize_for_tor(data)
        
        # Then validate
        if not cls.validate_tor_input(sanitized, input_type):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid {input_type} format for anonymous service"
            )
        
        return sanitized

class TorRateLimiter:
    """Enhanced rate limiting for Tor traffic"""
    
    def __init__(self):
        self.tor_attempts = {}
    
    def is_tor_rate_limited(self, key: str, action: str) -> bool:
        """Check rate limiting with Tor-specific thresholds"""
        limit, window = TorSecurityConfig.get_tor_rate_limit(action)
        current_time = time.time()
        
        if key not in self.tor_attempts:
            self.tor_attempts[key] = {}
        
        if action not in self.tor_attempts[key]:
            self.tor_attempts[key][action] = []
        
        # Clean old attempts
        self.tor_attempts[key][action] = [
            timestamp for timestamp in self.tor_attempts[key][action]
            if current_time - timestamp < window
        ]
        
        # Check limit
        if len(self.tor_attempts[key][action]) >= limit:
            logger.warning(f"Tor rate limit exceeded for {key}, action: {action}")
            return True
        
        # Add current attempt
        self.tor_attempts[key][action].append(current_time)
        return False
    
    def get_tor_client_key(self, request: Request) -> str:
        """Generate client key for Tor rate limiting"""
        # For Tor, we use a combination of factors since IP is usually 127.0.0.1
        factors = [
            request.client.host if request.client else "unknown",
            request.headers.get('user-agent', ''),
            request.headers.get('accept-language', ''),
            str(time.time() // 3600),  # Hour bucket for additional uniqueness
        ]
        
        combined = '|'.join(factors)
        return hashlib.sha256(combined.encode()).hexdigest()[:16]

class TorContentFilter:
    """Content filtering for Tor hidden services"""
    
    # Patterns that might indicate abuse or illegal content
    SUSPICIOUS_PATTERNS = [
        r'\b(drugs?|narcotics?)\b',
        r'\b(weapons?|guns?|explosives?)\b',
        r'\b(fraud|scam|phishing)\b',
        r'\b(child|minor|underage)\b.*\b(sexual|explicit)\b',
        r'\b(terrorist|terrorism|bomb)\b',
        r'\b(stolen|counterfeit|fake)\b.*\b(documents?|ids?)\b',
    ]
    
    @classmethod
    def scan_content(cls, content: str) -> Dict[str, Any]:
        """Scan content for suspicious patterns"""
        import re
        
        results = {
            "suspicious": False,
            "patterns_found": [],
            "risk_score": 0
        }
        
        content_lower = content.lower()
        
        for pattern in cls.SUSPICIOUS_PATTERNS:
            if re.search(pattern, content_lower, re.IGNORECASE):
                results["suspicious"] = True
                results["patterns_found"].append(pattern)
                results["risk_score"] += 1
        
        return results
    
    @classmethod
    def should_block_content(cls, content: str) -> bool:
        """Determine if content should be blocked"""
        scan_result = cls.scan_content(content)
        
        # Block if multiple suspicious patterns or high-risk patterns
        return scan_result["risk_score"] >= 2

# Global instances
tor_rate_limiter = TorRateLimiter()
tor_content_filter = TorContentFilter()

# Export main classes
__all__ = [
    'TorSecurityConfig',
    'TorInputValidator', 
    'TorRateLimiter',
    'TorContentFilter',
    'tor_rate_limiter',
    'tor_content_filter'
]