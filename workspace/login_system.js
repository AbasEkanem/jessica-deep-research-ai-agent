/**
 * Login System - Complete Authentication Implementation
 * 
 * This module provides a complete login page implementation with:
 * - Form validation (email format, password requirements)
 * - Mock authentication logic
 * - Error handling and user feedback
 * - Session/token management
 * - Security best practices
 * 
 * @version 1.0.0
 * @author Your Name
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Password requirements
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIRE_UPPERCASE: true,
    PASSWORD_REQUIRE_LOWERCASE: true,
    PASSWORD_REQUIRE_NUMBER: true,
    PASSWORD_REQUIRE_SPECIAL: true,
    PASSWORD_SPECIAL_CHARS: '!@#$%^&*',
    
    // Session management
    TOKEN_EXPIRY_HOURS: 24,
    REMEMBER_ME_DAYS: 30,
    
    // Rate limiting (mock implementation)
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15,
    
    // API endpoints (replace with actual endpoints in production)
    API_ENDPOINTS: {
        LOGIN: '/api/auth/login',
        REFRESH_TOKEN: '/api/auth/refresh',
        LOGOUT: '/api/auth/logout'
    }
};

// ============================================================================
// MOCK USER DATABASE (Replace with real backend in production)
// ============================================================================

const MOCK_USERS = [
    {
        id: 1,
        email: 'user@example.com',
        passwordHash: 'hashed_password_here', // In production, use bcrypt/argon2
        name: 'Demo User',
        role: 'user',
        isActive: true
    },
    {
        id: 2,
        email: 'admin@example.com',
        passwordHash: 'hashed_admin_password',
        name: 'Admin User',
        role: 'admin',
        isActive: true
    }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - Raw user input
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    // Remove potentially dangerous characters
    return input
        .replace(/[<>]/g, '') // Remove < and >
        .trim();
}

/**
 * Validate email format using regex
 * @param {string} email - Email address to validate
 * @returns {object} - Validation result with isValid and message
 */
function validateEmail(email) {
    if (!email) {
        return { isValid: false, message: 'Email is required' };
    }
    
    const sanitizedEmail = sanitizeInput(email);
    
    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(sanitizedEmail)) {
        return { isValid: false, message: 'Please enter a valid email address' };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Validate password against requirements
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid, message, and requirements
 */
function validatePassword(password) {
    const errors = [];
    const requirements = {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
    };
    
    if (!password) {
        return { 
            isValid: false, 
            message: 'Password is required',
            requirements 
        };
    }
    
    // Check minimum length
    if (password.length >= CONFIG.PASSWORD_MIN_LENGTH) {
        requirements.length = true;
    } else {
        errors.push(`At least ${CONFIG.PASSWORD_MIN_LENGTH} characters`);
    }
    
    // Check uppercase
    if (CONFIG.PASSWORD_REQUIRE_UPPERCASE && /[A-Z]/.test(password)) {
        requirements.uppercase = true;
    } else if (CONFIG.PASSWORD_REQUIRE_UPPERCASE) {
        errors.push('At least one uppercase letter');
    }
    
    // Check lowercase
    if (CONFIG.PASSWORD_REQUIRE_LOWERCASE && /[a-z]/.test(password)) {
        requirements.lowercase = true;
    } else if (CONFIG.PASSWORD_REQUIRE_LOWERCASE) {
        errors.push('At least one lowercase letter');
    }
    
    // Check number
    if (CONFIG.PASSWORD_REQUIRE_NUMBER && /\d/.test(password)) {
        requirements.number = true;
    } else if (CONFIG.PASSWORD_REQUIRE_NUMBER) {
        errors.push('At least one number');
    }
    
    // Check special character
    if (CONFIG.PASSWORD_REQUIRE_SPECIAL) {
        const specialRegex = new RegExp(`[${CONFIG.PASSWORD_SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
        if (specialRegex.test(password)) {
            requirements.special = true;
        } else {
            errors.push(`At least one special character (${CONFIG.PASSWORD_SPECIAL_CHARS})`);
        }
    }
    
    const isValid = Object.values(requirements).every(req => req === true);
    
    return {
        isValid,
        message: isValid ? '' : errors.join(', '),
        requirements
    };
}

/**
 * Generate a mock JWT token (for demonstration only)
 * In production, use a proper JWT library like jsonwebtoken
 * @param {object} user - User object
 * @returns {string} - Mock JWT token
 */
function generateMockToken(user) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (CONFIG.TOKEN_EXPIRY_HOURS * 3600)
    }));
    const signature = btoa('mock_signature_replace_with_real_secret');
    
    return `${header}.${payload}.${signature}`;
}

/**
 * Decode a mock JWT token
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
function decodeMockToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(atob(parts[1]));
        
        // Check if token is expired
        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }
        
        return payload;
    } catch (error) {
        return null;
    }
}

/**
 * Store authentication data in session storage or local storage
 * @param {object} authData - Authentication data to store
 * @param {boolean} rememberMe - Whether to use local storage (persistent)
 */
function storeAuthData(authData, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    try {
        storage.setItem('authToken', authData.token);
        storage.setItem('authUser', JSON.stringify(authData.user));
        storage.setItem('authExpiry', authData.expiry.toString());
    } catch (error) {
        console.error('Error storing auth data:', error);
    }
}

/**
 * Retrieve authentication data from storage
 * @returns {object|null} - Authentication data or null if not found
 */
function getAuthData() {
    try {
        // Check sessionStorage first
        let token = sessionStorage.getItem('authToken');
        let userStr = sessionStorage.getItem('authUser');
        let expiry = sessionStorage.getItem('authExpiry');
        
        // If not in sessionStorage, check localStorage
        if (!token) {
            token = localStorage.getItem('authToken');
            userStr = localStorage.getItem('authUser');
            expiry = localStorage.getItem('authExpiry');
        }
        
        if (!token || !userStr || !expiry) {
            return null;
        }
        
        // Check if token is expired
        if (parseInt(expiry) < Date.now()) {
            clearAuthData();
            return null;
        }
        
        const user = JSON.parse(userStr);
        return { token, user, expiry: parseInt(expiry) };
    } catch (error) {
        console.error('Error retrieving auth data:', error);
        return null;
    }
}

/**
 * Clear authentication data from storage
 */
function clearAuthData() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUser');
    sessionStorage.removeItem('authExpiry');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('authExpiry');
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if authenticated
 */
function isAuthenticated() {
    const authData = getAuthData();
    return authData !== null;
}

// ============================================================================
// AUTHENTICATION SERVICE (Mock Implementation)
// ============================================================================

/**
 * Mock authentication service
 * In production, replace with actual API calls
 */
const AuthService = {
    /**
     * Authenticate user with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<object>} - Authentication result
     */
    async login(email, password) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sanitize inputs
        const sanitizedEmail = sanitizeInput(email);
        
        // Find user in mock database
        const user = MOCK_USERS.find(u => 
            u.email.toLowerCase() === sanitizedEmail.toLowerCase() && 
            u.isActive
        );
        
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        // In production, use bcrypt.compare(password, user.passwordHash)
        // For demo, we'll accept any password that meets requirements
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            throw new Error('Invalid email or password');
        }
        
        // Generate token
        const token = generateMockToken(user);
        const expiry = Date.now() + (CONFIG.TOKEN_EXPIRY_HOURS * 3600 * 1000);
        
        return {
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            expiry
        };
    },
    
    /**
     * Refresh authentication token
     * @returns {Promise<object>} - New token data
     */
    async refreshToken() {
        // In production, call API to refresh token
        const authData = getAuthData();
        if (!authData) {
            throw new Error('No active session');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newToken = generateMockToken(authData.user);
        const expiry = Date.now() + (CONFIG.TOKEN_EXPIRY_HOURS * 3600 * 1000);
        
        return {
            success: true,
            token: newToken,
            user: authData.user,
            expiry
        };
    },
    
    /**
     * Logout user
     * @returns {Promise<object>} - Logout result
     */
    async logout() {
        // In production, call API to invalidate token
        await new Promise(resolve => setTimeout(resolve, 300));
        
        clearAuthData();
        
        return { success: true };
    }
};

// ============================================================================
// UI CONTROLLER
// ============================================================================

/**
 * Login form controller
 */
class LoginController {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.rememberMeCheckbox = document.getElementById('rememberMe');
        this.submitBtn = document.getElementById('submitBtn');
        this.togglePasswordBtn = document.getElementById('togglePassword');
        this.generalError = document.getElementById('generalError');
        this.successMessage = document.getElementById('successMessage');
        
        this.loginAttempts = 0;
        this.lockoutUntil = null;
        
        this.init();
    }
    
    /**
     * Initialize the login controller
     */
    init() {
        // Check if user is already authenticated
        if (isAuthenticated()) {
            this.showSuccess('You are already logged in. Redirecting...');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
            return;
        }
        
        // Load saved email if remember me was checked
        this.loadSavedEmail();
        
        // Attach event listeners
        this.attachEventListeners();
        
        // Update password requirements UI
        this.updatePasswordRequirementsUI();
    }
    
    /**
     * Attach event listeners to form elements
     */
    attachEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        this.emailInput.addEventListener('blur', () => this.validateEmailField());
        this.emailInput.addEventListener('input', () => this.clearFieldError('email'));
        
        this.passwordInput.addEventListener('input', () => {
            this.clearFieldError('password');
            this.updatePasswordRequirementsUI();
        });
        
        // Toggle password visibility
        this.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        
        // Close alert buttons
        const closeButtons = this.form.querySelectorAll('.alert-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideAlert('generalError');
            });
        });
    }
    
    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        // Check for lockout
        if (this.isLockedOut()) {
            this.showError(
                `Too many failed attempts. Please try again in ${this.getLockoutRemainingTime()}.`
            );
            return;
        }
        
        // Clear previous messages
        this.hideAlert('generalError');
        this.hideAlert('successMessage');
        
        // Validate form
        const isFormValid = this.validateForm();
        if (!isFormValid) {
            return;
        }
        
        // Get form values
        const email = this.emailInput.value;
        const password = this.passwordInput.value;
        const rememberMe = this.rememberMeCheckbox.checked;
        
        // Show loading state
        this.setLoading(true);
        
        try {
            // Attempt authentication
            const authResult = await AuthService.login(email, password);
            
            // Store auth data
            storeAuthData(authResult, rememberMe);
            
            // Save email if remember me is checked
            if (rememberMe) {
                this.saveEmail(email);
            } else {
                this.clearSavedEmail();
            }
            
            // Reset login attempts
            this.loginAttempts = 0;
            
            // Show success message
            this.showSuccess('Login successful! Redirecting...');
            
            // Redirect to dashboard (or specified redirect URL)
            setTimeout(() => {
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
                window.location.href = redirectUrl;
            }, 1500);
            
        } catch (error) {
            // Increment login attempts
            this.loginAttempts++;
            
            // Check if we should lock out
            if (this.loginAttempts >= CONFIG.MAX_LOGIN_ATTEMPTS) {
                this.lockoutUntil = Date.now() + (CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000);
                this.showError(
                    `Too many failed attempts. Account locked for ${CONFIG.LOCKOUT_DURATION_MINUTES} minutes.`
                );
            } else {
                // Show error message
                const remainingAttempts = CONFIG.MAX_LOGIN_ATTEMPTS - this.loginAttempts;
                this.showError(
                    `${error.message}. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`
                );
            }
            
            // Focus on password field for retry
            this.passwordInput.focus();
            this.passwordInput.select();
            
        } finally {
            // Hide loading state
            this.setLoading(false);
        }
    }
    
    /**
     * Validate the entire form
     * @returns {boolean} - True if form is valid
     */
    validateForm() {
        let isValid = true;
        
        // Validate email
        const emailValidation = this.validateEmailField();
        if (!emailValidation.isValid) {
            isValid = false;
        }
        
        // Validate password
        const passwordValidation = this.validatePasswordField();
        if (!passwordValidation.isValid) {
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Validate email field
     * @returns {object} - Validation result
     */
    validateEmailField() {
        const email = this.emailInput.value;
        const validation = validateEmail(email);
        
        if (!validation.isValid) {
            this.showFieldError('email', validation.message);
        }
        
        return validation;
    }
    
    /**
     * Validate password field
     * @returns {object} - Validation result
     */
    validatePasswordField() {
        const password = this.passwordInput.value;
        const validation = validatePassword(password);
        
        if (!validation.isValid) {
            this.showFieldError('password', validation.message);
        }
        
        return validation;
    }
    
    /**
     * Show field error
     * @param {string} fieldName - Name of the field
     * @param {string} message - Error message
     */
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement && inputElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            inputElement.classList.add('error');
        }
    }
    
    /**
     * Clear field error
     * @param {string} fieldName - Name of the field
     */
    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement && inputElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
            inputElement.classList.remove('error');
        }
    }
    
    /**
     * Show general error alert
     * @param {string} message - Error message
     */
    showError(message) {
        const alertElement = this.generalError;
        const messageElement = alertElement.querySelector('.alert-message');
        
        messageElement.textContent = message;
        alertElement.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideAlert('generalError');
        }, 5000);
    }
    
    /**
     * Show success alert
     * @param {string} message - Success message
     */
    showSuccess(message) {
        const alertElement = this.successMessage;
        const messageElement = alertElement.querySelector('.alert-message');
        
        messageElement.textContent = message;
        alertElement.style.display = 'flex';
    }
    
    /**
     * Hide alert
     * @param {string} alertId - ID of the alert element
     */
    hideAlert(alertId) {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            alertElement.style.display = 'none';
        }
    }
    
    /**
     * Set loading state
     * @param {boolean} isLoading - Whether to show loading state
     */
    setLoading(isLoading) {
        const btnText = this.submitBtn.querySelector('.btn-text');
        const btnLoader = this.submitBtn.querySelector('.btn-loader');
        
        if (isLoading) {
            this.submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
        } else {
            this.submitBtn.disabled = false;
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
        }
    }
    
    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        const type = this.passwordInput.type === 'password' ? 'text' : 'password';
        this.passwordInput.type = type;
        
        const eyeIcon = this.togglePasswordBtn.querySelector('.eye-icon');
        eyeIcon.textContent = type === 'password' ? '👁️' : '🙈';
    }
    
    /**
     * Update password requirements UI
     */
    updatePasswordRequirementsUI() {
        const password = this.passwordInput.value;
        const validation = validatePassword(password);
        
        // Update each requirement item
        const requirements = [
            { id: 'req-length', met: validation.requirements.length },
            { id: 'req-uppercase', met: validation.requirements.uppercase },
            { id: 'req-lowercase', met: validation.requirements.lowercase },
            { id: 'req-number', met: validation.requirements.number },
            { id: 'req-special', met: validation.requirements.special }
        ];
        
        requirements.forEach(req => {
            const element = document.getElementById(req.id);
            if (element) {
                if (req.met) {
                    element.classList.add('met');
                    element.innerHTML = '✓ ' + element.textContent.replace('✓ ', '');
                } else {
                    element.classList.remove('met');
                    element.innerHTML = element.textContent.replace('✓ ', '');
                }
            }
        });
    }
    
    /**
     * Check if account is locked out
     * @returns {boolean} - True if locked out
     */
    isLockedOut() {
        if (!this.lockoutUntil) return false;
        return Date.now() < this.lockoutUntil;
    }
    
    /**
     * Get remaining lockout time
     * @returns {string} - Formatted time remaining
     */
    getLockoutRemainingTime() {
        if (!this.lockoutUntil) return '';
        
        const remaining = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        
        return `${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds > 1 ? 's' : ''}`;
    }
    
    /**
     * Save email for remember me functionality
     * @param {string} email - Email to save
     */
    saveEmail(email) {
        try {
            localStorage.setItem('rememberedEmail', sanitizeInput(email));
        } catch (error) {
            console.error('Error saving email:', error);
        }
    }
    
    /**
     * Load saved email
     */
    loadSavedEmail() {
        try {
            const savedEmail = localStorage.getItem('rememberedEmail');
            if (savedEmail) {
                this.emailInput.value = savedEmail;
                this.rememberMeCheckbox.checked = true;
            }
        } catch (error) {
            console.error('Error loading saved email:', error);
        }
    }
    
    /**
     * Clear saved email
     */
    clearSavedEmail() {
        try {
            localStorage.removeItem('rememberedEmail');
        } catch (error) {
            console.error('Error clearing saved email:', error);
        }
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the login system when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Create login controller instance
    window.loginController = new LoginController();
    
    // Expose utility functions for debugging (remove in production)
    window.AuthUtils = {
        validateEmail,
        validatePassword,
        isAuthenticated,
        getAuthData,
        clearAuthData
    };
    
    console.log('Login system initialized');
});

// ============================================================================
// EXPORT FOR MODULE SYSTEMS (Optional)
// ============================================================================

// If using ES modules, uncomment the following:
/*
export {
    validateEmail,
    validatePassword,
    AuthService,
    LoginController,
    isAuthenticated,
    getAuthData,
    clearAuthData
};
*/
