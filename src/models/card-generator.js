/**
 * Card Generator
 * Generates valid test credit card numbers using Luhn algorithm
 * @module models/card-generator
 */

class CardGenerator {
  constructor(constants) {
    // Constants are REQUIRED - must be provided from IPC
    if (!constants) {
      throw new Error('CardGenerator requires constants from main process. Use: await window.appConstants.getConstants()');
    }
    
    if (!constants.CARD || !constants.CARD_TYPES || !constants.RETRY) {
      throw new Error('Invalid constants object. Missing CARD, CARD_TYPES, or RETRY properties.');
    }
    
    // Store constants from main process (single source of truth)
    this.CARD = constants.CARD;
    this.CARD_TYPES = constants.CARD_TYPES;
    this.RETRY = constants.RETRY;
    
    // Convenience properties
    this.MIN_CARD_LENGTH = this.CARD.MIN_LENGTH;
    this.MAX_CARD_LENGTH = this.CARD.MAX_LENGTH;
    this.BIN_MIN_LENGTH = this.CARD.BIN_MIN_LENGTH;
    this.BIN_MAX_LENGTH = this.CARD.BIN_MAX_LENGTH;
  }

  /**
   * Calculate Luhn checksum for a card number
   * @param {string} cardNumber - Partial card number (without check digit)
   * @returns {number} Luhn check digit
   * @throws {Error} If card number contains non-digits
   */
  luhnChecksum(cardNumber) {
    if (!/^\d+$/.test(cardNumber)) {
      throw new Error('Card number must contain only digits');
    }

    let total = 0;
    const digits = cardNumber.split('').reverse();

    for (let i = 0; i < digits.length; i++) {
      let digit = parseInt(digits[i], 10);
      
      // Double every second digit
      if ((i + 2) % 2 === 0) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      total += digit;
    }

    return (10 - (total % 10)) % 10;
  }

  /**
   * Validate a complete card number using Luhn algorithm
   * @param {string} cardNumber - Complete card number
   * @returns {boolean} True if valid
   */
  validateLuhn(cardNumber) {
    if (!cardNumber || !/^\d+$/.test(cardNumber)) {
      return false;
    }

    const checkDigit = parseInt(cardNumber.slice(-1), 10);
    const partial = cardNumber.slice(0, -1);

    try {
      const expected = this.luhnChecksum(partial);
      return checkDigit === expected;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a card number from BIN pattern
   * @param {string} binPattern - BIN pattern (e.g., "552461" or "552461xxxxxx")
   * @param {number} length - Target card length (optional)
   * @returns {string} Generated valid card number
   * @throws {Error} If pattern or length is invalid
   */
  generateFromBin(binPattern, length = null) {
    const pattern = this._normalizePattern(binPattern);
    const prefix = this._extractPrefix(pattern);
    const targetLength = this._determineLength(pattern, length);

    // Validate parameters
    if (targetLength <= prefix.length) {
      throw new Error('Card length must be greater than the BIN prefix length');
    }
    
    if (pattern.length > targetLength) {
      throw new Error('Card length cannot be shorter than the BIN pattern length');
    }

    // Build digits array from pattern
    const digits = this._buildDigitsArray(pattern, targetLength);

    // Fill random digits except last one (check digit)
    this._fillRandomDigits(digits, targetLength - 1);

    // Calculate and set check digit
    const checkDigit = this._calculateCheckDigit(digits, targetLength);
    
    const cardNumber = digits.join('');
    
    // Final validation
    if (!this.validateLuhn(cardNumber)) {
      throw new Error('Generated card number failed Luhn validation');
    }

    return cardNumber;
  }

  /**
   * Generate CVV code
   * @param {string} cardType - Card type (visa, mastercard, amex, etc.)
   * @param {number} lengthOverride - Override length (3 or 4)
   * @returns {string} Generated CVV
   * @throws {Error} If length override is invalid
   */
  generateCVV(cardType = 'visa', lengthOverride = null) {
    let targetLength;

    if (lengthOverride !== null) {
      if (lengthOverride !== this.CARD.CVV_MIN_LENGTH && lengthOverride !== this.CARD.CVV_MAX_LENGTH) {
        throw new Error(`CVV length must be ${this.CARD.CVV_MIN_LENGTH} or ${this.CARD.CVV_MAX_LENGTH} digits`);
      }
      targetLength = lengthOverride;
    } else {
      // American Express uses 4-digit CVV
      const normalizedType = cardType.toLowerCase();
      targetLength = (normalizedType === this.CARD_TYPES.AMEX || normalizedType === 'american express')
        ? this.CARD.CVV_MAX_LENGTH
        : this.CARD.CVV_MIN_LENGTH;
    }

    let cvv = '';
    for (let i = 0; i < targetLength; i++) {
      cvv += Math.floor(Math.random() * 10);
    }
    
    return cvv;
  }

  /**
   * Generate expiry date
   * @param {number} yearsAhead - Years into the future (default: 5)
   * @param {number} month - Specific month (optional)
   * @param {number} year - Specific year (optional)
   * @returns {Object} Expiry object with month and year
   * @throws {Error} If parameters are invalid
   */
  generateExpiry(yearsAhead = null, month = null, year = null) {
    if (yearsAhead === null) {
      yearsAhead = this.CARD.DEFAULT_EXPIRY_YEARS;
    }
    if (yearsAhead < 0) {
      throw new Error('years_ahead must be non-negative');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
    const currentYear = now.getFullYear();
    const maxYear = currentYear + yearsAhead;

    // Handle specific expiry date
    if (month !== null || year !== null) {
      return this._generateSpecificExpiry(month, year, currentYear, maxYear);
    }

    // Generate random expiry within range
    return this._generateRandomExpiry(currentMonth, currentYear, yearsAhead);
  }

  /**
   * Generate bulk cards
   * @param {string} binPattern - BIN pattern
   * @param {number} count - Number of cards to generate
   * @param {Object} options - Generation options
   * @returns {Array} Array of generated cards
   * @throws {Error} If generation fails or exceeds attempts
   */
  generateBulk(binPattern, count, options = {}) {
    const {
      length = null,
      cvvLength = null,
      yearsAhead = null,
      expiryMonth = null,
      expiryYear = null,
      cardType = null,
    } = options;

    const finalYearsAhead = yearsAhead !== null ? yearsAhead : this.CARD.DEFAULT_EXPIRY_YEARS;

    if (count <= 0) {
      throw new Error('Count must be a positive integer');
    }

    if (count > this.CARD.MAX_BULK_GENERATION) {
      throw new Error(`Cannot generate more than ${this.CARD.MAX_BULK_GENERATION} cards at once`);
    }

    // Use provided cardType or detect from BIN
    const detectedCardType = cardType || this.detectCardType(binPattern);
    const uniqueNumbers = new Set();
    const cards = [];
    const maxAttempts = Math.max(count * this.RETRY.MAX_CARD_GENERATION_MULTIPLIER, this.RETRY.MIN_ATTEMPTS);
    let attempts = 0;

    // Fixed expiry if specified
    let fixedExpiry = null;
    if (expiryMonth !== null || expiryYear !== null) {
      fixedExpiry = this.generateExpiry(finalYearsAhead, expiryMonth, expiryYear);
    }

    while (cards.length < count) {
      attempts++;
      if (attempts > maxAttempts) {
        throw new Error('Exceeded attempts while generating unique cards');
      }

      const number = this.generateFromBin(binPattern, length);
      
      // Ensure uniqueness
      if (uniqueNumbers.has(number)) {
        continue;
      }
      uniqueNumbers.add(number);

      const cvv = this.generateCVV(detectedCardType, cvvLength);
      const expiry = fixedExpiry || this.generateExpiry(finalYearsAhead);

      cards.push({
        number: number,
        cvv: cvv,
        exp_month: expiry.month,
        exp_year: expiry.year,
        card_type: detectedCardType,
      });
    }

    return cards;
  }

  /**
   * Detect card type from BIN pattern
   * @param {string} binPattern - BIN pattern
   * @returns {string} Detected card type
   */
  detectCardType(binPattern) {
    const digits = binPattern.replace(/[^0-9]/g, '');
    if (!digits) return this.CARD_TYPES.UNKNOWN;

    // Visa: starts with 4
    if (digits.startsWith('4')) {
      return this.CARD_TYPES.VISA;
    }

    const firstTwo = digits.substring(0, 2);
    
    // Mastercard: 51-55 or 2221-2720
    if (['51', '52', '53', '54', '55'].includes(firstTwo)) {
      return this.CARD_TYPES.MASTERCARD;
    }

    if (digits.length >= 4) {
      const firstFour = parseInt(digits.substring(0, 4), 10);
      if (firstFour >= 2221 && firstFour <= 2720) {
        return this.CARD_TYPES.MASTERCARD;
      }
    }

    // American Express: 34 or 37
    if (['34', '37'].includes(firstTwo)) {
      return this.CARD_TYPES.AMEX;
    }

    // Discover: 6011, 64, 65
    if (digits.length >= 4 && digits.substring(0, 4) === '6011') {
      return this.CARD_TYPES.DISCOVER;
    }

    if (['64', '65'].includes(firstTwo)) {
      return this.CARD_TYPES.DISCOVER;
    }

    // JCB: 3528-3589
    if (digits.length >= 4) {
      const firstFour = parseInt(digits.substring(0, 4), 10);
      if (firstFour >= 3528 && firstFour <= 3589) {
        return this.CARD_TYPES.JCB;
      }
    }

    // Diners Club: 36, 38, 300-305
    if (['36', '38'].includes(firstTwo)) {
      return this.CARD_TYPES.DINERS;
    }

    if (digits.length >= 3) {
      const firstThree = parseInt(digits.substring(0, 3), 10);
      if (firstThree >= 300 && firstThree <= 305) {
        return this.CARD_TYPES.DINERS;
      }
    }

    // UnionPay: 62
    if (firstTwo === '62') {
      return this.CARD_TYPES.UNIONPAY;
    }

    return this.CARD_TYPES.UNKNOWN;
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Normalize BIN pattern
   * @private
   */
  _normalizePattern(binPattern) {
    if (!binPattern) {
      throw new Error('BIN pattern must not be empty');
    }

    const pattern = binPattern.replace(/\s/g, '').toLowerCase();
    if (!/^[0-9x]+$/.test(pattern)) {
      throw new Error("BIN pattern may contain only digits and 'x'");
    }

    return pattern;
  }

  /**
   * Extract numeric prefix from pattern
   * @private
   */
  _extractPrefix(pattern) {
    const match = pattern.match(/^\d+/);
    if (!match) {
      throw new Error('BIN pattern must start with digits');
    }

    const prefix = match[0];
    if (prefix.length < this.BIN_MIN_LENGTH || prefix.length > this.BIN_MAX_LENGTH) {
      throw new Error(`BIN must be ${this.BIN_MIN_LENGTH}-${this.BIN_MAX_LENGTH} digits long before placeholders`);
    }

    return prefix;
  }

  /**
   * Determine target card length
   * @private
   */
  _determineLength(pattern, length) {
    let inferred;
    if (length === null) {
      inferred = pattern.includes('x')
        ? pattern.length
        : Math.max(pattern.length, this.CARD.DEFAULT_LENGTH);
    } else {
      inferred = length;
    }

    if (inferred < this.MIN_CARD_LENGTH || inferred > this.MAX_CARD_LENGTH) {
      throw new Error(`Card length must be between ${this.MIN_CARD_LENGTH} and ${this.MAX_CARD_LENGTH} digits`);
    }

    return inferred;
  }

  /**
   * Build digits array from pattern
   * @private
   */
  _buildDigitsArray(pattern, targetLength) {
    const digits = [];
    for (let i = 0; i < targetLength; i++) {
      if (i < pattern.length) {
        const char = pattern[i];
        digits.push(char === 'x' ? null : char);
      } else {
        digits.push(null);
      }
    }
    return digits;
  }

  /**
   * Fill random digits in array
   * @private
   */
  _fillRandomDigits(digits, lastIndex) {
    for (let i = 0; i < lastIndex; i++) {
      if (digits[i] === null) {
        digits[i] = Math.floor(Math.random() * 10).toString();
      }
    }
  }

  /**
   * Calculate and set check digit
   * @private
   */
  _calculateCheckDigit(digits, targetLength) {
    const lastIndex = targetLength - 1;
    const partial = digits.slice(0, lastIndex).join('');
    
    if (!/^\d+$/.test(partial)) {
      throw new Error('BIN pattern must resolve to digits before the check digit');
    }

    const checkDigit = this.luhnChecksum(partial).toString();
    const lastDigit = digits[lastIndex];

    if (lastDigit === null) {
      digits[lastIndex] = checkDigit;
    } else if (lastDigit !== checkDigit) {
      throw new Error('BIN pattern conflicts with required Luhn check digit');
    }

    return checkDigit;
  }

  /**
   * Generate specific expiry date
   * @private
   */
  _generateSpecificExpiry(month, year, currentYear, maxYear) {
    if (month === null || year === null) {
      throw new Error('Both month and year are required when specifying expiry');
    }
    
    if (month < 1 || month > 12) {
      throw new Error('Expiry month must be between 1 and 12');
    }

    let fullYear = year < 100 ? year + 2000 : year;
    if (fullYear < currentYear || fullYear > maxYear) {
      throw new Error('Expiry year must be within the allowed range');
    }

    return {
      month: month.toString().padStart(2, '0'),
      year: (fullYear % 100).toString().padStart(2, '0'),
    };
  }

  /**
   * Generate random expiry date
   * @private
   */
  _generateRandomExpiry(currentMonth, currentYear, yearsAhead) {
    const totalMonths = yearsAhead * 12 + 1;
    const offset = Math.floor(Math.random() * totalMonths);
    const expiryMonth = ((currentMonth - 1 + offset) % 12) + 1;
    const expiryYear = currentYear + Math.floor((currentMonth - 1 + offset) / 12);

    return {
      month: expiryMonth.toString().padStart(2, '0'),
      year: (expiryYear % 100).toString().padStart(2, '0'),
    };
  }
}

// Export for use in both Node and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CardGenerator;
}
