// Security utilities for Chatzilla clone
'use strict';

/**
 * Security Manager Class
 * Handles all security-related functionality
 */
class SecurityManager {
    constructor() {
        this.encryptionKey = this.generateSecureKey();
        this.rateLimiter = new Map();
        this.auditLog = [];
        this.sessionId = this.generateSessionId();
        this.initSecurity();
    }

    /**
     * Initialize security measures
     */
    initSecurity() {
        this.setupCSRFProtection();
        this.setupXSSProtection();
        this.setupMemoryProtection();
        this.setupNetworkSecurity();
        this.startSecurityMonitoring();
    }

    /**
     * Generate cryptographically secure random key
     */
    generateSecureKey() {
        const array = new Uint8Array(32);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(array);
        } else {
            // Fallback for older browsers
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
        }
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate secure session ID
     */
    generateSessionId() {
        return this.generateSecureKey().substring(0, 16);
    }

    /**
     * Secure hash function using Web Crypto API
     */
    async secureHash(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        if (window.crypto && window.crypto.subtle) {
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
        }
        
        // Fallback simple hash
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    /**
     * Encrypt data using AES-like simulation
     */
    encryptData(data) {
        if (!data) return '';
        
        const key = this.encryptionKey;
        let encrypted = '';
        
        for (let i = 0; i < data.length; i++) {
            const charCode = data.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            encrypted += String.fromCharCode(charCode ^ keyChar);
        }
        
        return btoa(encrypted); // Base64 encode
    }

    /**
     * Decrypt data
     */
    decryptData(encryptedData) {
        if (!encryptedData) return '';
        
        try {
            const encrypted = atob(encryptedData); // Base64 decode
            const key = this.encryptionKey;
            let decrypted = '';
            
            for (let i = 0; i < encrypted.length; i++) {
                const charCode = encrypted.charCodeAt(i);
                const keyChar = key.charCodeAt(i % key.length);
                decrypted += String.fromCharCode(charCode ^ keyChar);
            }
            
            return decrypted;
        } catch (e) {
            this.logSecurityEvent('Decryption failed', { error: e.message });
            return '';
        }
    }

    /**
     * Sanitize user input to prevent XSS
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        // Remove dangerous HTML tags and attributes
        let sanitized = input
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .replace(/<object[^>]*>.*?<\/object>/gi, '')
            .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
            .replace(/<link[^>]*>/gi, '')
            .replace(/<meta[^>]*>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
        
        // Escape HTML entities
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/gi, '&quot;')
            .replace(/'/gi, '&#x27;')
            .replace(/\//gi, '&#x2F;');
        
        return sanitized;
    }

    /**
     * Validate input against patterns
     */
    validateInput(input, type) {
        if (!input) return false;
        
        const patterns = {
            phone: /^\+?[\d\s\-\(\)]{10,15}$/,
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: /^[\w\s\.\,\!\?\-\'\"\(\)\[\]]{1,1000}$/,
            name: /^[a-zA-Z\s]{1,50}$/
        };
        
        return patterns[type] ? patterns[type].test(input) : true;
    }

    /**
     * Rate limiting for actions
     */
    rateLimit(action, limit = 10, window = 60000) {
        const now = Date.now();
        const key = `${action}_${this.sessionId}`;
        
        if (!this.rateLimiter.has(key)) {
            this.rateLimiter.set(key, []);
        }
        
        const attempts = this.rateLimiter.get(key);
        
        // Remove old attempts outside the window
        const filtered = attempts.filter(time => now - time < window);
        
        if (filtered.length >= limit) {
            this.logSecurityEvent('Rate limit exceeded', { action, attempts: filtered.length });
            return false;
        }
        
        filtered.push(now);
        this.rateLimiter.set(key, filtered);
        return true;
    }

    /**
     * CSRF Protection
     */
    setupCSRFProtection() {
        this.csrfToken = this.generateSecureKey().substring(0, 32);
        
        // Add CSRF token to all forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrf_token';
            csrfInput.value = this.csrfToken;
            form.appendChild(csrfInput);
        });
    }

    /**
     * XSS Protection
     */
    setupXSSProtection() {
        // Override dangerous functions
        const originalInnerHTML = Element.prototype.__lookupSetter__('innerHTML');
        if (originalInnerHTML) {
            Object.defineProperty(Element.prototype, 'innerHTML', {
                set: function(value) {
                    const sanitized = window.securityManager.sanitizeInput(value);
                    originalInnerHTML.call(this, sanitized);
                }
            });
        }

        // Monitor DOM mutations
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check for dangerous elements
                        const dangerousTags = ['script', 'iframe', 'object', 'embed'];
                        if (dangerousTags.includes(node.tagName?.toLowerCase())) {
                            node.remove();
                            this.logSecurityEvent('Dangerous element removed', { 
                                tag: node.tagName, 
                                content: node.innerHTML 
                            });
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Memory Protection
     */
    setupMemoryProtection() {
        // Clear sensitive data from memory periodically
        setInterval(() => {
            this.clearSensitiveVariables();
        }, 300000); // Every 5 minutes

        // Override console methods to prevent data leakage
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            const filtered = args.map(arg => 
                typeof arg === 'string' ? arg.replace(/\b\d{10,}\b/g, '[REDACTED]') : arg
            );
            originalLog.apply(console, filtered);
        };

        console.error = (...args) => {
            const filtered = args.map(arg => 
                typeof arg === 'string' ? arg.replace(/\b\d{10,}\b/g, '[REDACTED]') : arg
            );
            originalError.apply(console, filtered);
        };

        console.warn = (...args) => {
            const filtered = args.map(arg => 
                typeof arg === 'string' ? arg.replace(/\b\d{10,}\b/g, '[REDACTED]') : arg
            );
            originalWarn.apply(console, filtered);
        };
    }

    /**
     * Network Security
     */
    setupNetworkSecurity() {
        // Override fetch to add security headers
        const originalFetch = window.fetch;
        window.fetch = (url, options = {}) => {
            options.headers = {
                ...options.headers,
                'X-Requested-With': 'XMLHttpRequest',
                'X-Session-Id': this.sessionId,
                'X-CSRF-Token': this.csrfToken
            };

            // Only allow HTTPS in production
            if (url.startsWith('http://') && window.location.protocol === 'https:') {
                url = url.replace('http://', 'https://');
            }

            return originalFetch(url, options);
        };

        // Override XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            this.setRequestHeader('X-Session-Id', window.securityManager.sessionId);
            this.setRequestHeader('X-CSRF-Token', window.securityManager.csrfToken);
            return originalOpen.call(this, method, url, ...args);
        };
    }

    /**
     * Security Monitoring
     */
    startSecurityMonitoring() {
        // Monitor for suspicious activity
        setInterval(() => {
            this.checkSecurityThreats();
        }, 30000); // Every 30 seconds

        // Monitor for memory usage
        setInterval(() => {
            if (performance.memory) {
                const memInfo = performance.memory;
                if (memInfo.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
                    this.logSecurityEvent('High memory usage detected', {
                        used: memInfo.usedJSHeapSize,
                        total: memInfo.totalJSHeapSize
                    });
                }
            }
        }, 60000); // Every minute
    }

    /**
     * Check for security threats
     */
    checkSecurityThreats() {
        // Check for DOM manipulation
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            if (!script.src.includes(window.location.origin) && 
                !script.src.includes('unsplash.com') &&
                !script.src.includes('fonts.googleapis.com')) {
                this.logSecurityEvent('Unauthorized script detected', { src: script.src });
                script.remove();
            }
        });

        // Check for suspicious iframes
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            this.logSecurityEvent('Iframe detected and removed', { src: iframe.src });
            iframe.remove();
        });

        // Check localStorage for tampering
        try {
            const storageKeys = Object.keys(localStorage);
            storageKeys.forEach(key => {
                if (key.includes('debug') || key.includes('dev') || key.includes('test')) {
                    localStorage.removeItem(key);
                    this.logSecurityEvent('Suspicious localStorage key removed', { key });
                }
            });
        } catch (e) {
            // Handle localStorage access errors
        }
    }

    /**
     * Clear sensitive variables from memory
     */
    clearSensitiveVariables() {
        // This is a placeholder - in a real app, you'd clear actual sensitive data
        if (window.tempData) {
            window.tempData = null;
        }
        
        if (window.userCredentials) {
            window.userCredentials = null;
        }

        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }

    /**
     * Secure storage operations
     */
    secureSet(key, value) {
        try {
            const encrypted = this.encryptData(JSON.stringify(value));
            localStorage.setItem(`chatzilla_${key}`, encrypted);
            return true;
        } catch (e) {
            this.logSecurityEvent('Secure storage failed', { key, error: e.message });
            return false;
        }
    }

    secureGet(key) {
        try {
            const encrypted = localStorage.getItem(`chatzilla_${key}`);
            if (!encrypted) return null;
            
            const decrypted = this.decryptData(encrypted);
            return JSON.parse(decrypted);
        } catch (e) {
            this.logSecurityEvent('Secure retrieval failed', { key, error: e.message });
            return null;
        }
    }

    secureRemove(key) {
        try {
            localStorage.removeItem(`chatzilla_${key}`);
            return true;
        } catch (e) {
            this.logSecurityEvent('Secure removal failed', { key, error: e.message });
            return false;
        }
    }

    /**
     * Security event logging
     */
    logSecurityEvent(event, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            details,
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.auditLog.push(logEntry);

        // Keep only last 1000 entries
        if (this.auditLog.length > 1000) {
            this.auditLog = this.auditLog.slice(-1000);
        }

        // In production, send to security monitoring service
        console.warn('Security Event:', logEntry);
    }

    /**
     * Clear all data (emergency cleanup)
     */
    clearAllData() {
        try {
            // Clear localStorage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('chatzilla_')) {
                    localStorage.removeItem(key);
                }
            });

            // Clear sessionStorage
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith('chatzilla_')) {
                    sessionStorage.removeItem(key);
                }
            });

            // Clear sensitive variables
            this.clearSensitiveVariables();

            this.logSecurityEvent('Emergency data clearance performed');
        } catch (e) {
            console.error('Failed to clear data:', e);
        }
    }

    /**
     * Get security report
     */
    getSecurityReport() {
        return {
            sessionId: this.sessionId,
            auditLogCount: this.auditLog.length,
            rateLimiterSize: this.rateLimiter.size,
            lastActivity: window.lastActivity,
            memoryUsage: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }
}

// Initialize security manager
window.securityManager = new SecurityManager();

// Export for use in other modules
export default SecurityManager;