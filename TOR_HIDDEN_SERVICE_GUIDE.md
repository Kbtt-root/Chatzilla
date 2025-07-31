# 🧅 CHATZILLA TOR HIDDEN SERVICE SETUP GUIDE

## Overview
This guide explains how to configure Chatzilla to run as a Tor hidden service (onion service) for enhanced privacy and anonymity.

## 🔐 Why Use Tor Hidden Services?

### Benefits:
- **End-to-end anonymity** for both users and service operators
- **Built-in encryption** through Tor's onion routing
- **No need for SSL certificates** (Tor provides encryption)
- **Censorship resistance** - harder to block than regular websites
- **Location privacy** - server location remains hidden
- **No DNS leaks** - .onion domains don't use regular DNS

### Use Cases:
- **Journalist communications** in restrictive countries
- **Whistleblowing platforms** for sensitive information
- **Privacy-focused messaging** for activists and dissidents
- **Enhanced security** for sensitive business communications
- **Anonymous support groups** and communities

## 🛠️ SETUP INSTRUCTIONS

### Prerequisites
```bash
# Install Tor (Ubuntu/Debian)
sudo apt update
sudo apt install tor

# Install Tor (CentOS/RHEL)
sudo yum install tor

# Install Tor (macOS with Homebrew)
brew install tor
```

### 1. Configure Tor Hidden Service

Create Tor configuration file:
```bash
sudo nano /etc/tor/torrc
```

Add hidden service configuration:
```bash
# Chatzilla Hidden Service Configuration
HiddenServiceDir /var/lib/tor/chatzilla_hidden_service/
HiddenServicePort 80 127.0.0.1:3000   # Frontend
HiddenServicePort 8001 127.0.0.1:8001 # Backend API

# Security settings
HiddenServiceVersion 3                  # Use v3 onion addresses (recommended)
HiddenServiceNonAnonymousMode 0        # Keep anonymity enabled
HiddenServiceSingleHopMode 0           # Use full Tor circuit

# Optional: Client authentication (for private services)
# HiddenServiceAuthorizeClient stealth client1,client2
```

### 2. Start Tor Service
```bash
# Start Tor
sudo systemctl start tor
sudo systemctl enable tor

# Check status
sudo systemctl status tor
```

### 3. Get Your Onion Address
```bash
# Wait for Tor to generate the address (may take a few minutes)
sudo cat /var/lib/tor/chatzilla_hidden_service/hostname
```

This will output something like:
```
abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890abcdef.onion
```

### 4. Update Chatzilla Configuration

#### Backend Configuration (`backend/.env`):
```bash
# Original configuration
MONGO_URL="mongodb://localhost:27017"
DB_NAME="chatzilla_secure"

# Add Tor-specific settings
TOR_ENABLED=true
ONION_ADDRESS="your-generated-address.onion"
ALLOW_ONION_ORIGINS=true

# Update CORS for .onion domains
FRONTEND_URL="http://your-generated-address.onion"
```

#### Frontend Configuration (`frontend/.env`):
```bash
# Update backend URL to use onion address
REACT_APP_BACKEND_URL=http://your-generated-address.onion:8001

# Tor-specific settings
REACT_APP_TOR_ENABLED=true
WDS_SOCKET_PORT=443
```

### 5. Update Security Middleware for Tor

Create Tor-specific security configuration:
```python
# backend/tor_security.py
from typing import List

class TorSecurityConfig:
    """Security configuration for Tor hidden services"""
    
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
    def is_tor_request(request) -> bool:
        """Check if request is coming through Tor"""
        # Check for Tor-specific headers
        tor_headers = [
            'X-Tor-Circuit-Type',
            'X-Forwarded-For-Tor',
        ]
        
        return any(header in request.headers for header in tor_headers)
    
    @staticmethod
    def get_tor_security_headers() -> dict:
        """Get security headers optimized for Tor"""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            # Note: HSTS not needed for .onion (always encrypted)
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data:; "
                "connect-src 'self'"
            ),
            "Referrer-Policy": "no-referrer",  # Enhanced privacy for Tor
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
        }
```

### 6. Update CORS Configuration

Modify `backend/secure_server.py`:
```python
from tor_security import TorSecurityConfig

# Update CORS origins
ALLOWED_ORIGINS = [
    "https://localhost:3000",
    "https://127.0.0.1:3000",
    os.environ.get('FRONTEND_URL', 'https://localhost:3000')
]

# Add Tor origins if enabled
if os.environ.get('TOR_ENABLED', 'false').lower() == 'true':
    ALLOWED_ORIGINS.extend(TorSecurityConfig.get_tor_allowed_origins())

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"],
)
```

### 7. Nginx Configuration (Optional)

If using Nginx as a reverse proxy:
```nginx
# /etc/nginx/sites-available/chatzilla-tor
server {
    listen 127.0.0.1:3000;
    
    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3001;  # Your React dev server
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Tor-Circuit-Type "hidden-service";
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Tor-Circuit-Type "hidden-service";
    }
}
```

## 🔒 SECURITY CONSIDERATIONS

### Enhanced Security Features:
1. **Client Authentication**: Use Tor's client auth for private services
2. **Rate Limiting**: More aggressive rate limiting for Tor traffic
3. **Logging**: Enhanced logging for security monitoring
4. **Session Management**: Shorter session timeouts for enhanced security

### Example Enhanced Configuration:
```python
# Enhanced security for Tor hidden service
class TorEnhancedSecurity:
    # Shorter session timeout for anonymity
    SESSION_TIMEOUT = 15 * 60  # 15 minutes instead of 30
    
    # More aggressive rate limiting
    TOR_RATE_LIMITS = {
        'login': (5, 300),      # 5 attempts per 5 minutes
        'register': (2, 3600),  # 2 registrations per hour
        'message': (20, 60),    # 20 messages per minute
    }
    
    # Enhanced input validation
    MAX_MESSAGE_LENGTH = 500   # Shorter messages for anonymity
    MAX_USERNAME_LENGTH = 20   # Shorter usernames
```

## 🌐 CLIENT ACCESS INSTRUCTIONS

### For Users:
1. **Install Tor Browser**: Download from https://www.torproject.org/
2. **Access the Service**: Enter your .onion address in Tor Browser
3. **Verify Security**: Check for the onion icon in the address bar
4. **Use Safely**: Follow standard Tor browser security practices

### Security Tips for Users:
- Always use Tor Browser (not regular browsers with Tor proxy)
- Keep Tor Browser updated
- Don't download files unless necessary
- Don't enable JavaScript for maximum security
- Use unique usernames not linked to real identity

## 📊 MONITORING & MAINTENANCE

### Log Analysis:
```bash
# Monitor Tor logs
sudo tail -f /var/log/tor/log

# Monitor application logs for Tor traffic
grep "X-Tor-Circuit-Type" /var/log/chatzilla/access.log
```

### Health Checks:
```bash
# Check if hidden service is reachable
curl --socks5 127.0.0.1:9050 http://your-address.onion/api/health

# Check Tor circuit
sudo -u debian-tor tor --verify-config
```

### Backup Important Files:
```bash
# Backup Tor keys (CRITICAL - loss means new .onion address)
sudo cp -r /var/lib/tor/chatzilla_hidden_service/ /secure/backup/location/

# Backup application data
sudo cp -r /app/ /secure/backup/location/app-backup/
```

## ⚖️ LEGAL & ETHICAL CONSIDERATIONS

### Legal Compliance:
- **Know your jurisdiction**: Hidden services are legal in most countries
- **Content compliance**: Ensure content complies with applicable laws
- **Data protection**: Follow GDPR/privacy regulations even for anonymous services
- **Terms of service**: Clearly state acceptable use policies

### Ethical Guidelines:
- Use for **legitimate privacy needs** only
- Don't facilitate illegal activities
- Implement strong **content moderation**
- Provide **abuse reporting** mechanisms
- Respect user privacy while preventing misuse

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Install and configure Tor
- [ ] Generate .onion address
- [ ] Update application configuration
- [ ] Test hidden service accessibility
- [ ] Implement enhanced security measures
- [ ] Set up monitoring and logging
- [ ] Backup Tor keys securely
- [ ] Document access instructions for users
- [ ] Implement content moderation policies
- [ ] Set up regular security audits

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues:
1. **Hidden service not accessible**: Check Tor configuration and firewall
2. **CORS errors**: Verify .onion address in allowed origins
3. **Slow performance**: Normal for Tor - users expect longer load times
4. **Authentication issues**: Ensure JWT tokens work over Tor

### Performance Optimization:
- Enable compression for better Tor performance
- Optimize images and assets for slower connections
- Implement aggressive caching strategies
- Use minimal JavaScript for better compatibility

---

**⚠️ Important Note**: Running a Tor hidden service requires careful consideration of legal, ethical, and security implications. Ensure you understand the responsibilities and legal requirements in your jurisdiction before deployment.

---

*Guide Version: 1.0*  
*Compatible with: Tor v4.x, Chatzilla Secure v2.0*  
*Last Updated: $(date)*