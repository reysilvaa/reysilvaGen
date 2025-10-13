/**
 * Base Model Class
 * Provides common functionality for all data models in the MVC architecture.
 * @module mvc/models/BaseModel
 */

class BaseModel {
  constructor(name, options = {}) {
    this.name = name;
    this.options = { 
      validateOnSet: true, 
      logLevel: 'info',
      ...options 
    };
    this.data = {};
    this.errors = [];
    this.logPrefix = `[${this.name}Model]`;
    
    // Initialize model
    this.init();
  }

  /**
   * Initialize model - to be overridden by subclasses
   */
  init() {
    this.log('info', 'Model initialized');
  }

  /**
   * Logging utility
   */
  log(level, ...args) {
    if (this.options.logLevel === 'none') return;
    
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.options.logLevel] || 2;
    const messageLevel = levels[level] || 2;
    
    if (messageLevel <= currentLevel) {
      const symbol = { error: '❌', warn: '⚠️', info: 'ℹ️', debug: '🔍' }[level] || 'ℹ️';
      console[level === 'error' ? 'error' : 'log'](`${symbol} ${this.logPrefix}`, ...args);
    }
  }

  /**
   * Set data with optional validation
   */
  set(key, value) {
    if (this.options.validateOnSet && this.validate) {
      const validation = this.validate(key, value);
      if (!validation.isValid) {
        this.errors.push({ key, value, error: validation.error });
        this.log('warn', `Validation failed for ${key}:`, validation.error);
        return false;
      }
    }
    
    this.data[key] = value;
    this.log('debug', `Set ${key}:`, value);
    return true;
  }

  /**
   * Get data
   */
  get(key) {
    return this.data[key];
  }

  /**
   * Get all data
   */
  getData() {
    return { ...this.data };
  }

  /**
   * Clear all data
   */
  clear() {
    this.data = {};
    this.errors = [];
    this.log('info', 'Data cleared');
  }

  /**
   * Check if model has errors
   */
  hasErrors() {
    return this.errors.length > 0;
  }

  /**
   * Get all errors
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Clear errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      name: this.name,
      data: this.getData(),
      errors: this.getErrors(),
      hasErrors: this.hasErrors()
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json, ModelClass = BaseModel) {
    const model = new ModelClass(json.name);
    model.data = json.data || {};
    model.errors = json.errors || [];
    return model;
  }
}

// Export for use in both Node and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseModel;
} else {
  window.BaseModel = BaseModel;
}
