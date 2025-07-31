/**
 * Secure Storage Manager
 * Replaces the vulnerable security.js implementation
 */

class SecureStorageManager {
    constructor() {
        this.storagePrefix = 'chatzilla_secure_';
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.init();
    }

    init() {
        // Set up session timeout monitoring
        this.setupSessionTimeout();
        
        // Clear any existing insecure data
        this.clearLegacyData();
        
        // Set up beforeunload cleanup
        window.addEventListener('beforeunload', () => {
            this.clearSensitiveData();
        });
    }

    /**
     * Clear legacy insecure data from old implementation
     */
    clearLegacyData() {
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('chatzilla_') && !key.startsWith(this.storagePrefix)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.warn(`Removed insecure legacy data: ${key}`);
        });
    }

    /**
     * Store data securely (without client-side encryption)
     * Note: Real encryption should be done server-side
     */
    secureSet(key, value) {
        try {
            const data = {
                value: value,
                timestamp: Date.now(),
                checksum: this.generateChecksum(JSON.stringify(value))
            };
            
            sessionStorage.setItem(this.storagePrefix + key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to store data securely:', error);
            return false;
        }
    }

    /**
     * Retrieve data securely with integrity check
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

            // Check if data is expired (24 hours)
            if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
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
     * Generate simple checksum for integrity verification
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
     * Clear all sensitive data
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

        // Clear any remaining localStorage entries
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('chatzilla_')) {
                localStorage.removeItem(key);
            }
        }

        console.info('Sensitive data cleared');
    }

    /**
     * Setup session timeout monitoring
     */
    setupSessionTimeout() {
        let lastActivity = Date.now();
        
        // Update last activity on user interaction
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
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
     * Handle session timeout
     */
    handleSessionTimeout() {
        console.warn('Session timeout - clearing sensitive data');
        this.clearSensitiveData();
        
        // Redirect to login or show timeout message
        if (window.location.pathname !== '/login') {
            alert('Your session has expired for security reasons. Please refresh the page.');
            window.location.reload();
        }
    }

    /**
     * Input sanitization (basic XSS prevention)
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .trim();
    }

    /**
     * Simple rate limiting (client-side only - not secure)
     */
    rateLimit(action, limit = 10, windowMs = 60000) {
        const key = `rateLimit_${action}`;
        const now = Date.now();
        
        let attempts = this.secureGet(key) || [];
        
        // Remove expired attempts
        attempts = attempts.filter(timestamp => now - timestamp < windowMs);
        
        if (attempts.length >= limit) {
            console.warn(`Rate limit exceeded for action: ${action}`);
            return false;
        }
        
        attempts.push(now);
        this.secureSet(key, attempts);
        
        return true;
    }

    /**
     * Generate secure session ID
     */
    generateSessionId() {
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new Uint8Array(16);
            window.crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        } else {
            // Fallback for older browsers (less secure)
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    /**
     * Get security report
     */
    getSecurityReport() {
        return {
            sessionId: this.generateSessionId(),
            storageUsed: this.getStorageUsage(),
            lastActivity: Date.now(),
            securityLevel: 'enhanced',
            version: '2.0.0'
        };
    }

    /**
     * Get storage usage statistics
     */
    getStorageUsage() {
        let used = 0;
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.storagePrefix)) {
                used += sessionStorage.getItem(key).length;
            }
        }
        return { used, unit: 'characters' };
    }
}

// Authentication Manager
class AuthManager {
    constructor(storage) {
        this.storage = storage;
        this.tokenKey = 'auth_token';
        this.userKey = 'user_data';
        this.baseURL = process.env.REACT_APP_BACKEND_URL;
    }

    /**
     * Login user
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            
            // Store token and user data securely
            this.storage.secureSet(this.tokenKey, data.access_token);
            this.storage.secureSet(this.userKey, {
                user_id: data.user_id,
                username: data.username
            });

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Register user
     */
    async register(username, email, password) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            const data = await response.json();
            
            // Store token and user data securely
            this.storage.secureSet(this.tokenKey, data.access_token);
            this.storage.secureSet(this.userKey, {
                user_id: data.user_id,
                username: data.username
            });

            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    /**
     * Logout user
     */
    logout() {
        this.storage.secureRemove(this.tokenKey);
        this.storage.secureRemove(this.userKey);
        this.storage.clearSensitiveData();
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
     * Get authorization headers
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

// Initialize secure storage and auth
const secureStorage = new SecureStorageManager();
const authManager = new AuthManager(secureStorage);

// Replace the old insecure SecurityManager
window.secureStorage = secureStorage;
window.authManager = authManager;

// Backward compatibility (with warnings)
window.securityManager = {
    sanitizeInput: (input) => {
        console.warn('DEPRECATED: Using legacy sanitizeInput. Update to secureStorage.sanitizeInput');
        return secureStorage.sanitizeInput(input);
    },
    rateLimit: (action, limit, window) => {
        console.warn('DEPRECATED: Using legacy rateLimit. Update to secureStorage.rateLimit');
        return secureStorage.rateLimit(action, limit, window);
    },
    secureSet: (key, value) => {
        console.warn('DEPRECATED: Using legacy secureSet. Update to secureStorage.secureSet');
        return secureStorage.secureSet(key, value);
    },
    secureGet: (key) => {
        console.warn('DEPRECATED: Using legacy secureGet. Update to secureStorage.secureGet');
        return secureStorage.secureGet(key);
    },
    clearAllData: () => {
        console.warn('DEPRECATED: Using legacy clearAllData. Update to secureStorage.clearSensitiveData');
        return secureStorage.clearSensitiveData();
    },
    getSecurityReport: () => {
        console.warn('DEPRECATED: Using legacy getSecurityReport. Update to secureStorage.getSecurityReport');
        return secureStorage.getSecurityReport();
    },
    sessionId: secureStorage.generateSessionId()
};

export { SecureStorageManager, AuthManager };
export default secureStorage;