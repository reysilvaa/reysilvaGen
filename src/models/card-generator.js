/**
 * Card Generator - JavaScript implementation
 * Ported from Python to JavaScript for Electron app
 * Developed by Reysilva
 */

class CardGenerator {
  constructor() {
    this.MIN_CARD_LENGTH = 13;
    this.MAX_CARD_LENGTH = 19;
    this.BIN_MIN_LENGTH = 6;
    this.BIN_MAX_LENGTH = 9;
  }

  /**
   * Calculate Luhn checksum for a card number
   */
  luhnChecksum(cardNumber) {
    if (!/^\d+$/.test(cardNumber)) {
      throw new Error("Card number must contain only digits");
    }

    let total = 0;
    const digits = cardNumber.split("").reverse();

    for (let i = 0; i < digits.length; i++) {
      let digit = parseInt(digits[i]);
      if ((i + 2) % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      total += digit;
    }

    return (10 - (total % 10)) % 10;
  }

  /**
   * Validate a complete card number using Luhn algorithm
   */
  validateLuhn(cardNumber) {
    if (!cardNumber || !/^\d+$/.test(cardNumber)) {
      return false;
    }

    const checkDigit = parseInt(cardNumber.slice(-1));
    const partial = cardNumber.slice(0, -1);

    try {
      const expected = this.luhnChecksum(partial);
      return checkDigit === expected;
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate a card number from BIN pattern
   */
  generateFromBin(binPattern, length = null) {
    const pattern = this._normalizePattern(binPattern);
    const prefix = this._extractPrefix(pattern);
    const targetLength = this._determineLength(pattern, length);

    if (targetLength <= prefix.length) {
      throw new Error("Card length must be greater than the BIN prefix length");
    }
    if (pattern.length > targetLength) {
      throw new Error(
        "Card length cannot be shorter than the BIN pattern length"
      );
    }

    // Build digits array
    const digits = [];
    for (let i = 0; i < targetLength; i++) {
      if (i < pattern.length) {
        const char = pattern[i];
        digits.push(char === "x" ? null : char);
      } else {
        digits.push(null);
      }
    }

    // Fill random digits except last one
    const lastIndex = targetLength - 1;
    for (let i = 0; i < lastIndex; i++) {
      if (digits[i] === null) {
        digits[i] = Math.floor(Math.random() * 10).toString();
      }
    }

    // Calculate check digit
    const partial = digits.slice(0, lastIndex).join("");
    if (!/^\d+$/.test(partial)) {
      throw new Error(
        "BIN pattern must resolve to digits before the check digit"
      );
    }

    const checkDigit = this.luhnChecksum(partial).toString();
    const lastDigit = digits[lastIndex];

    if (lastDigit === null) {
      digits[lastIndex] = checkDigit;
    } else if (lastDigit !== checkDigit) {
      throw new Error("BIN pattern conflicts with required Luhn check digit");
    }

    const cardNumber = digits.join("");
    if (!this.validateLuhn(cardNumber)) {
      throw new Error("Generated card number failed Luhn validation");
    }

    return cardNumber;
  }

  /**
   * Generate CVV
   */
  generateCVV(cardType = "visa", lengthOverride = null) {
    let targetLength;

    if (lengthOverride !== null) {
      if (lengthOverride !== 3 && lengthOverride !== 4) {
        throw new Error("CVV length override must be 3 or 4 digits");
      }
      targetLength = lengthOverride;
    } else {
      // Normalize card type to lowercase for comparison
      const normalizedType = cardType.toLowerCase();
      
      // American Express uses 4-digit CVV
      if (normalizedType === "amex" || normalizedType === "american express") {
        targetLength = 4;
      } else {
        targetLength = 3;
      }
    }

    let cvv = "";
    for (let i = 0; i < targetLength; i++) {
      cvv += Math.floor(Math.random() * 10);
    }
    return cvv;
  }

  /**
   * Generate expiry date
   */
  generateExpiry(yearsAhead = 5, month = null, year = null) {
    if (yearsAhead < 0) {
      throw new Error("years_ahead must be non-negative");
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
    const currentYear = now.getFullYear();
    const maxYear = currentYear + yearsAhead;

    if (month !== null || year !== null) {
      if (month === null || year === null) {
        throw new Error(
          "Both month and year are required when specifying expiry"
        );
      }
      if (month < 1 || month > 12) {
        throw new Error("Expiry month must be between 1 and 12");
      }

      let fullYear = year < 100 ? year + 2000 : year;
      if (fullYear < currentYear || fullYear > maxYear) {
        throw new Error("Expiry year must be within the allowed range");
      }

      return {
        month: month.toString().padStart(2, "0"),
        year: (fullYear % 100).toString().padStart(2, "0"),
      };
    }

    // Random expiry within range
    const totalMonths = yearsAhead * 12 + 1;
    const offset = Math.floor(Math.random() * totalMonths);
    const expiryMonth = ((currentMonth - 1 + offset) % 12) + 1;
    const expiryYear =
      currentYear + Math.floor((currentMonth - 1 + offset) / 12);

    return {
      month: expiryMonth.toString().padStart(2, "0"),
      year: (expiryYear % 100).toString().padStart(2, "0"),
    };
  }

  /**
   * Generate bulk cards
   */
  generateBulk(binPattern, count, options = {}) {
    const {
      length = null,
      cvvLength = null,
      yearsAhead = 5,
      expiryMonth = null,
      expiryYear = null,
      cardType = null, // Allow card type override from database
    } = options;

    if (count <= 0) {
      throw new Error("Count must be a positive integer");
    }

    // Use provided cardType or detect from BIN pattern
    const detectedCardType = cardType || this.detectCardType(binPattern);
    const uniqueNumbers = new Set();
    const cards = [];
    const maxAttempts = Math.max(count * 10, 1000);
    let attempts = 0;

    // Fixed expiry if specified
    let fixedExpiry = null;
    if (expiryMonth !== null || expiryYear !== null) {
      fixedExpiry = this.generateExpiry(yearsAhead, expiryMonth, expiryYear);
    }

    while (cards.length < count) {
      attempts++;
      if (attempts > maxAttempts) {
        throw new Error("Exceeded attempts while generating unique cards");
      }

      const number = this.generateFromBin(binPattern, length);
      if (uniqueNumbers.has(number)) {
        continue;
      }
      uniqueNumbers.add(number);

      const cvv = this.generateCVV(detectedCardType, cvvLength);
      const expiry = fixedExpiry || this.generateExpiry(yearsAhead);

      cards.push({
        number: number,
        cvv: cvv,
        exp_month: expiry.month,
        exp_year: expiry.year,
        card_type: detectedCardType, // Include card type in result
      });
    }

    return cards;
  }

  /**
   * Detect card type from BIN pattern
   */
  detectCardType(binPattern) {
    const digits = binPattern.replace(/[^0-9]/g, "");
    if (!digits) return "unknown";

    // Visa: starts with 4
    if (digits.startsWith("4")) {
      return "visa";
    }

    const firstTwo = digits.substring(0, 2);
    
    // Mastercard: 51-55 or 2221-2720
    if (["51", "52", "53", "54", "55"].includes(firstTwo)) {
      return "mastercard";
    }

    if (digits.length >= 4) {
      const firstFour = parseInt(digits.substring(0, 4));
      if (firstFour >= 2221 && firstFour <= 2720) {
        return "mastercard";
      }
    }

    // American Express: 34 or 37
    if (["34", "37"].includes(firstTwo)) {
      return "amex";
    }

    // Discover: 6011, 64, 65
    if (digits.length >= 4 && digits.substring(0, 4) === "6011") {
      return "discover";
    }

    if (["64", "65"].includes(firstTwo)) {
      return "discover";
    }

    // JCB: 3528-3589
    if (digits.length >= 4) {
      const firstFour = parseInt(digits.substring(0, 4));
      if (firstFour >= 3528 && firstFour <= 3589) {
        return "jcb";
      }
    }

    // Diners Club: 36, 38, 300-305
    if (["36", "38"].includes(firstTwo)) {
      return "diners";
    }

    if (digits.length >= 3) {
      const firstThree = parseInt(digits.substring(0, 3));
      if (firstThree >= 300 && firstThree <= 305) {
        return "diners";
      }
    }

    // UnionPay: 62
    if (firstTwo === "62") {
      return "unionpay";
    }

    return "unknown";
  }

  // Private helper methods
  _normalizePattern(binPattern) {
    if (!binPattern) {
      throw new Error("BIN pattern must not be empty");
    }

    const pattern = binPattern.replace(/\s/g, "").toLowerCase();
    if (!/^[0-9x]+$/.test(pattern)) {
      throw new Error("BIN pattern may contain only digits and 'x'");
    }

    return pattern;
  }

  _extractPrefix(pattern) {
    const match = pattern.match(/^\d+/);
    if (!match) {
      throw new Error("BIN pattern must start with digits");
    }

    const prefix = match[0];
    if (
      prefix.length < this.BIN_MIN_LENGTH ||
      prefix.length > this.BIN_MAX_LENGTH
    ) {
      throw new Error("BIN must be 6-9 digits long before placeholders");
    }

    return prefix;
  }

  _determineLength(pattern, length) {
    let inferred;
    if (length === null) {
      inferred = pattern.includes("x")
        ? pattern.length
        : Math.max(pattern.length, 16);
    } else {
      inferred = length;
    }

    if (inferred < this.MIN_CARD_LENGTH || inferred > this.MAX_CARD_LENGTH) {
      throw new Error("Card length must be between 13 and 19 digits");
    }

    return inferred;
  }
}

// Export for use in renderer
if (typeof module !== "undefined" && module.exports) {
  module.exports = CardGenerator;
}
