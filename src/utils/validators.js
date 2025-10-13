/**
 * Validation Utilities
 * Common validation functions used across the application
 * @module utils/validators
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate BIN pattern
 * @param {string} binPattern - BIN pattern to validate
 * @returns {boolean} True if valid
 */
function isValidBinPattern(binPattern) {
  if (!binPattern || typeof binPattern !== 'string') {
    return false;
  }
  const normalized = binPattern.replace(/\s/g, '').toLowerCase();
  return /^[0-9x]+$/.test(normalized) && normalized.length >= 6;
}

/**
 * Validate card number using Luhn algorithm
 * @param {string} cardNumber - Card number to validate
 * @returns {boolean} True if valid
 */
function isValidCardNumber(cardNumber) {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return false;
  }
  
  if (!/^\d+$/.test(cardNumber)) {
    return false;
  }

  let sum = 0;
  let isEven = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate ZIP code format (US)
 * @param {string} zipCode - ZIP code to validate
 * @returns {boolean} True if valid
 */
function isValidZipCode(zipCode) {
  if (!zipCode || typeof zipCode !== 'string') {
    return false;
  }
  // 5 digits or 5+4 format
  return /^\d{5}(-\d{4})?$/.test(zipCode);
}

/**
 * Validate phone number format (US)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  // Various US phone formats
  const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid and message
 */
function validatePassword(password, options = {}) {
  const {
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumbers = false,
    requireSpecial = false
  } = options;

  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < minLength) {
    return { isValid: false, message: `Password must be at least ${minLength} characters` };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain uppercase letters' };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain lowercase letters' };
  }

  if (requireNumbers && !/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain numbers' };
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain special characters' };
  }

  return { isValid: true, message: 'Password is valid' };
}

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
function sanitizeString(input, options = {}) {
  const { maxLength = 1000, allowSpecialChars = true } = options;

  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  if (!allowSpecialChars) {
    sanitized = sanitized.replace(/[^\w\s\-\.@]/g, '');
  }

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate date range
 * @param {Date|string} date - Date to validate
 * @param {Object} options - Validation options
 * @returns {boolean} True if valid
 */
function isValidDateRange(date, options = {}) {
  const { minDate, maxDate } = options;

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return false;
  }

  if (minDate && dateObj < new Date(minDate)) {
    return false;
  }

  if (maxDate && dateObj > new Date(maxDate)) {
    return false;
  }

  return true;
}

/**
 * Validate integer in range
 * @param {*} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if valid
 */
function isValidIntegerRange(value, min, max) {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return false;
  }
  return value >= min && value <= max;
}

module.exports = {
  isValidEmail,
  isValidBinPattern,
  isValidCardNumber,
  isValidZipCode,
  isValidPhone,
  validatePassword,
  sanitizeString,
  isValidDateRange,
  isValidIntegerRange
};

