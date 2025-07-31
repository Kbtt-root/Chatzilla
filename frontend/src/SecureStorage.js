/**
 * Secure Storage Manager
 * Enhanced privacy and safety focused storage implementation
 */

class SecureStorageManager {
    constructor() {
        this.storagePrefix = 'secure_chat_';
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes for enhanced privacy
        this.init();
    }

    init() {
        // Set up session timeout monitoring for privacy
        this.setupSessionTimeout();
        
        // Clear any existing insecure data
        this.clearLegacyData();
        
        // Set up beforeunload cleanup for privacy
        window.addEventListener('beforeunload', () => {
            this.clearSensitiveData();
        });

        // Set up privacy-focused page visibility handling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            }
        });
    }

    /**
     * Clear legacy insecure data from old implementations
     */
    clearLegacyData() {
        const keysToRemove = [];
        
        // Check both localStorage and sessionStorage
        for (let storage of [localStorage, sessionStorage]) {
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key && (key.startsWith('chatzilla_') || key.includes('insecure_'))) {
                    keysToRemove.push({storage, key});
                }
            }
        }
        
        keysToRemove.forEach(({storage, key}) => {
            storage.removeItem(key);
            console.warn(`Removed insecure legacy data: ${key}`);
        });
    }

    /**
     * Store data securely with enhanced privacy protection
     */
    secureSet(key, value) {
        try {
            const data = {
                value: value,
                timestamp: Date.now(),
                checksum: this.generateChecksum(JSON.stringify(value)),
                expires: Date.now() + (12 * 60 * 60 * 1000) // 12 hours expiry for privacy
            };
            
            // Use sessionStorage for enhanced privacy (data cleared on browser close)
            sessionStorage.setItem(this.storagePrefix + key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to store data securely:', error);
            return false;
        }
    }

    /**
     * Retrieve data securely with integrity and privacy checks
     */
    secureGet(key) {
        try {
            const storedData = sessionStorage.getItem(this.storagePrefix + key);
            if (!storedData) return null;

            const data = JSON.parse(storedData);
            
            // Check data integrity
            const expectedChecksum = this.generateChecksum(JSON.stringify(data.value));
            if (data.checksum !== expectedChecksum) {
                console.warn('Data integrity check failed, removing corrupted data');
                this.secureRemove(key);
                return null;
            }

            // Check if data is expired (privacy protection)
            if (Date.now() > data.expires) {
                console.warn('Data expired, removing for privacy protection');
                this.secureRemove(key);
                return null;
            }

            return data.value;
        } catch (error) {
            console.error('Failed to retrieve data securely:', error);
            return null;
        }
    }

    /**
     * Remove data securely
     */
    secureRemove(key) {
        try {
            sessionStorage.removeItem(this.storagePrefix + key);
            return true;
        } catch (error) {
            console.error('Failed to remove data securely:', error);
            return false;
        }
    }

    /**
     * Generate checksum for integrity verification
     */
    generateChecksum(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    /**
     * Clear all sensitive data for enhanced privacy
     */
    clearSensitiveData() {
        const keysToRemove = [];
        
        // Clear sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.storagePrefix)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
        });

        // Also clear any remaining localStorage entries for privacy
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('chatzilla_') || key.startsWith(this.storagePrefix))) {
                localStorage.removeItem(key);
            }
        }

        console.info('Sensitive data cleared for privacy protection');
    }

    /**
     * Setup session timeout monitoring for enhanced privacy
     */
    setupSessionTimeout() {
        let lastActivity = Date.now();
        
        // Update last activity on user interaction
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, () => {
                lastActivity = Date.now();
            }, { passive: true });
        });

        // Check for session timeout every minute
        setInterval(() => {
            if (Date.now() - lastActivity > this.sessionTimeout) {
                this.handleSessionTimeout();
            }
        }, 60 * 1000);
    }

    /**
     * Handle session timeout for privacy protection
     */
    handleSessionTimeout() {
        console.warn('Session timeout - clearing sensitive data for privacy');
        this.clearSensitiveData();
        
        // Show privacy-focused timeout message
        this.showPrivacyTimeoutMessage();
    }

    /**
     * Handle page hidden for privacy protection
     */
    handlePageHidden() {
        // Clear sensitive data when page is hidden for enhanced privacy
        setTimeout(() => {
            if (document.hidden) {
                this.clearSensitiveData();
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Show privacy-focused timeout message
     */
    showPrivacyTimeoutMessage() {
        if (window.location.pathname !== '/login') {
            alert('Your session has expired for privacy and security reasons. Please refresh the page to continue.');
            window.location.reload();
        }
    }

    /**
     * Enhanced input sanitization for privacy and safety
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // Enhanced sanitization to prevent privacy leaks and safety issues
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .replace(/\\/g, '&#x5C;')
            .replace(/`/g, '&#x60;')
            .replace(/=/g, '&#x3D;')
            .trim()
            .substring(0, 1000); // Limit length for privacy
    }

    /**
     * Privacy-aware rate limiting
     */
    rateLimit(action, limit = 10, windowMs = 60000) {
        const key = `rateLimit_${action}`;
        const now = Date.now();
        
        let attempts = this.secureGet(key) || [];
        
        // Remove expired attempts
        attempts = attempts.filter(timestamp => now - timestamp < windowMs);
        
        if (attempts.length >= limit) {
            console.warn(`Rate limit exceeded for action: ${action} - privacy protection activated`);
            return false;
        }
        
        attempts.push(now);
        this.secureSet(key, attempts);
        
        return true;
    }

    /**
     * Generate secure session ID for privacy
     */
    generateSessionId() {
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new Uint8Array(16);
            window.crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        } else {
            // Enhanced fallback for privacy
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substr(2, 9);
            return `session_${timestamp}_${random}`;
        }
    }

    /**
     * Get privacy-focused security report
     */
    getSecurityReport() {
        return {
            sessionId: this.generateSessionId(),
            storageUsed: this.getStorageUsage(),
            lastActivity: Date.now(),
            securityLevel: 'enhanced-privacy',
            version: '2.0.0-secure',
            privacyMode: 'active'
        };
    }

    /**
     * Get storage usage statistics for privacy monitoring
     */
    getStorageUsage() {
        let used = 0;
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.storagePrefix)) {
                used += sessionStorage.getItem(key).length;
            }
        }
        return { used, unit: 'characters', storage: 'session' };
    }

    /**
     * Privacy-focused data cleanup
     */
    performPrivacyCleanup() {
        // Remove expired data
        const keysToCheck = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.storagePrefix)) {
                keysToCheck.push(key);
            }
        }

        keysToCheck.forEach(key => {
            const shortKey = key.replace(this.storagePrefix, '');
            const data = this.secureGet(shortKey);
            if (!data) {
                // Data was expired and removed
                console.info(`Expired data removed for privacy: ${shortKey}`);
            }
        });
    }
}

// Enhanced Authentication Manager with privacy focus
class AuthManager {
    constructor(storage) {
        this.storage = storage;
        this.tokenKey = 'auth_token';
        this.userKey = 'user_data';
        this.baseURL = process.env.REACT_APP_BACKEND_URL;
    }

    /**
     * Login user with enhanced privacy protection
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: this.storage.sanitizeInput(email), 
                    password: password 
                })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            
            // Store token and user data securely with privacy protection
            this.storage.secureSet(this.tokenKey, data.access_token);
            this.storage.secureSet(this.userKey, {
                user_id: data.user_id,
                username: this.storage.sanitizeInput(data.username)
            });

            console.info('User authenticated successfully with privacy protection');
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Register user with enhanced privacy protection
     */
    async register(username, email, password) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username: this.storage.sanitizeInput(username),
                    email: this.storage.sanitizeInput(email),
                    password: password 
                })
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            const data = await response.json();
            
            // Store token and user data securely
            this.storage.secureSet(this.tokenKey, data.access_token);
            this.storage.secureSet(this.userKey, {
                user_id: data.user_id,
                username: this.storage.sanitizeInput(data.username)
            });

            console.info('User registered successfully with privacy protection');
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    /**
     * Logout user with privacy-focused cleanup
     */
    logout() {
        this.storage.secureRemove(this.tokenKey);
        this.storage.secureRemove(this.userKey);
        this.storage.clearSensitiveData();
        console.info('User logged out with complete privacy cleanup');
    }

    /**
     * Get authentication token
     */
    getToken() {
        return this.storage.secureGet(this.tokenKey);
    }

    /**
     * Get user data
     */
    getUser() {
        return this.storage.secureGet(this.userKey);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        return !!(token && user);
    }

    /**
     * Get authorization headers for secure API calls
     */
    getAuthHeaders() {
        const token = this.getToken();
        if (!token) return {};
        
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Initialize secure storage and auth with privacy focus
const secureStorage = new SecureStorageManager();
const authManager = new AuthManager(secureStorage);

// Perform privacy cleanup on initialization
secureStorage.performPrivacyCleanup();

// Set up periodic privacy cleanup
setInterval(() => {
    secureStorage.performPrivacyCleanup();
}, 10 * 60 * 1000); // Every 10 minutes

// Make available globally
window.secureStorage = secureStorage;
window.authManager = authManager;

// Export for ES6 modules
export { SecureStorageManager, AuthManager };
export default secureStorage;