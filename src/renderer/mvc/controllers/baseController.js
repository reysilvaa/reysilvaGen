/**
 * Simple Base Controller Class
 * Provides basic functionality for all controllers
 * @module mvc/controllers/BaseController
 */

class BaseController {
  // Global constants cache
  static constants = null;
  static loadingConstants = false;

  constructor(name, options = {}) {
    this.name = name;
    this.utils = window.Utils;
    this.dialog = window.dialog;
    this.isInitialized = false;
    this.isDestroyed = false;
    this.eventListeners = [];
    this.constants = null;
    
    if (options.autoInit !== false) {
      this.init();
    }
  }

  // ==================== BASIC LIFECYCLE ====================

  async init() {
    if (this.isInitialized) {
      this.log('warn', 'Controller already initialized');
      return;
    }

    try {
      this.log('info', `Initializing ${this.name} controller...`);
      await this.onInit();
      this.isInitialized = true;
      this.log('success', `${this.name} controller initialized successfully`);
    } catch (error) {
      this.log('error', `Failed to initialize ${this.name} controller:`, error);
      throw error;
    }
  }

  async onInit() {
    // Override in child classes
  }

  destroy() {
    this.log('info', `Destroying ${this.name} controller...`);
    
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element?.removeEventListener(event, handler);
    });
    this.eventListeners = [];
    
    this.onDestroy();
    this.isInitialized = false;
    this.isDestroyed = true;
  }

  onDestroy() {
    // Override in child classes
  }

  async onRouteEnter() {
    // Override in child classes for route activation
  }

  // ==================== ELEMENT HELPERS ====================

  getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      this.log('warn', `Element not found: ${id}`);
    }
    return element;
  }

  getElements(ids) {
    const elements = {};
    ids.forEach(id => {
      elements[id] = this.getElement(id);
    });
    return elements;
  }

  addEvent(element, event, handler) {
    if (!element) {
      this.log('warn', `Element not found for event: ${event}`);
      return;
    }

    const wrappedHandler = async (...args) => {
      try {
        await handler(...args);
      } catch (error) {
        this.log('error', `Error in ${event} handler:`, error);
        this.notify('error', `Error: ${error.message}`);
      }
    };

    element.addEventListener(event, wrappedHandler);
    this.eventListeners.push({ element, event, handler: wrappedHandler });
  }

  // ==================== CONSTANTS ====================

  async loadConstants() {
    // Use global cache
    if (BaseController.constants) {
      this.constants = BaseController.constants;
      return this.constants;
    }

    // Wait if already loading
    if (BaseController.loadingConstants) {
      while (BaseController.loadingConstants) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      this.constants = BaseController.constants;
      return this.constants;
    }

    BaseController.loadingConstants = true;

    try {
      if (!window.appConstants?.getConstants) {
        throw new Error('IPC not available - appConstants not exposed');
      }

      const response = await window.appConstants.getConstants();
      
      if (response?.success) {
        const constants = {
          CARD: response.CARD,
          CARD_TYPES: response.CARD_TYPES,
          RETRY: response.RETRY,
          TIMING: response.TIMING,
          WEB: response.WEB,
          VALIDATION: response.VALIDATION,
          SESSION: response.SESSION,
          CRYPTO: response.CRYPTO
        };
        
        BaseController.constants = constants;
        this.constants = constants;
        return this.constants;
      } else {
        throw new Error(`Failed to get constants: ${JSON.stringify(response)}`);
      }
    } finally {
      BaseController.loadingConstants = false;
    }
  }

  // ==================== UI HELPERS ====================

  showLoading(message = 'Loading...', showProgress = false) {
    if (window.LoadingManager) {
      window.LoadingManager.show(message, showProgress);
    } else if (this.utils) {
    this.utils.showLoading(message);
    }
  }

  hideLoading() {
    if (window.LoadingManager) {
      window.LoadingManager.hide();
    } else if (this.utils) {
    this.utils.hideLoading();
    }
  }

  updateLoadingMessage(message) {
    if (window.LoadingManager) {
      window.LoadingManager.updateMessage(message);
    }
  }

  updateLoadingProgress(percentage, message = null) {
    if (window.LoadingManager) {
      window.LoadingManager.updateProgress(percentage, message);
    }
  }

  async run(operation, message = 'Processing...') {
    try {
      this.showLoading(message);
      
      const result = await operation();
      
      this.hideLoading();
      return result;
    } catch (error) {
      this.hideLoading();
      this.log('error', `Operation failed: ${message}`, error);
      this.notify('error', `${message} failed: ${error.message}`);
      throw error;
    }
  }

  showSuccess(message) {
    this.utils.showSuccess(message);
  }

  showError(message) {
    this.utils.showError(message);
  }

  showInfo(message) {
    this.utils.showInfo(message);
  }

  async copyText(text, label = 'Text') {
    try {
      await navigator.clipboard.writeText(text);
      this.showSuccess(`${label} copied to clipboard!`);
    } catch (error) {
      this.log('error', 'Failed to copy to clipboard:', error);
      this.showError('Failed to copy to clipboard');
    }
  }

  // ==================== ASYNC HELPERS ====================

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  // ==================== VALIDATION ====================

  static validate = {
    required: (value, fieldName = 'Field') => ({
      valid: value && value.trim().length > 0,
      message: `${fieldName} is required`
    }),

    selection: (value, fieldName = 'Selection') => ({
      valid: value && value.trim().length > 0,
      message: `Please select a ${fieldName.toLowerCase()}`
    }),

    numberRange: (value, min = 1, max = 100, fieldName = 'Number') => {
      const num = parseInt(value);
      if (isNaN(num)) {
        return { valid: false, message: `${fieldName} must be a valid number` };
      }
      if (num < min || num > max) {
        return { valid: false, message: `${fieldName} must be between ${min} and ${max}` };
      }
      return { valid: true, message: '' };
    },

    email: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        valid: emailRegex.test(value),
        message: 'Please enter a valid email address'
      };
    }
  };

  checkAndShow(validator, ...args) {
    const result = validator(...args);
    if (!result.valid) {
      this.showError(result.message);
      return false;
    }
    return true;
  }

  // ==================== CONTENT HELPERS ====================

  copyContent(areaId, format = 'text', label = 'Content') {
    const area = this.getElement(areaId);
    if (!area) {
      this.showError('Content area not found');
      return false;
    }

    let content = '';
    
    if (format === 'cards') {
      const cards = area.querySelectorAll('.card-item');
      if (cards.length === 0) {
        this.showError('No cards to copy');
        return false;
      }
      
      cards.forEach(card => {
        const number = card.dataset.number;
        const expiry = card.dataset.expiry;
        const cvv = card.dataset.cvv;
        content += `${number}|${expiry.replace('/', '|')}|${cvv}\n`;
      });
    } else {
      content = area.textContent || area.value || '';
    }

    if (!content.trim()) {
      this.showError(`No ${label.toLowerCase()} to copy`);
      return false;
    }

    this.copyText(content, label);
    return true;
  }

  clearContent(areaId, placeholder = '') {
    const area = this.getElement(areaId);
    if (area) {
      area.innerHTML = placeholder || '<p class="placeholder">No content available</p>';
    }
  }

  async copyContent(elementId, format, contentType) {
    const element = this.getElement(elementId);
    if (!element) {
      this.notify('error', `Element ${elementId} not found`);
      return;
    }

    let textToCopy = '';
    
    if (format === 'card') {
      // For card format, extract text content
      textToCopy = element.textContent || element.innerText || '';
    } else {
      // For other formats, get pre content
      const preElement = element.querySelector('pre');
      textToCopy = preElement ? preElement.textContent : element.textContent;
    }

    if (!textToCopy.trim()) {
      this.notify('error', `No ${contentType.toLowerCase()} to copy`);
      return;
    }

    try {
      await this.copyText(textToCopy);
      this.notify('success', `${contentType} copied to clipboard!`);
    } catch (error) {
      this.notify('error', `Failed to copy ${contentType.toLowerCase()}`);
    }
  }

  downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  addLogEntry(outputElementId, message, type = 'info') {
    const outputElement = this.getElement(outputElementId);
    if (!outputElement) {
      this.log('warn', `Output element not found: ${outputElementId}`);
      return;
    }

    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };

    const div = document.createElement('div');
    div.className = 'log-entry';
    div.setAttribute('data-log-type', type);
    div.textContent = `${icons[type] || icons.info} ${message}`;
    
    outputElement.appendChild(div);
    outputElement.scrollTop = outputElement.scrollHeight;
  }

  // ==================== NOTIFICATIONS ====================

  notify(type, message) {
    // Use Utils for notifications if available
    if (this.utils) {
      switch (type) {
        case 'success':
          this.utils.showSuccess(message);
          break;
        case 'error':
          this.utils.showError(message);
          break;
        case 'info':
          this.utils.showInfo(message);
          break;
        case 'warning':
          this.utils.showWarning(message);
          break;
        default:
          this.utils.showInfo(message);
      }
    } else {
      // Fallback to console
      this.log(type, message);
    }
  }

  // ==================== LOGGING ====================

  log(level, message, ...args) {
    const prefix = `[${this.name}Controller]`;
    const logMethod = console[level] || console.log;
    
    const icons = {
      error: '❌',
      warn: '⚠️',
      success: '✅',
      info: 'ℹ️',
      debug: '🔍'
    };

    const icon = icons[level] || '';
    logMethod(`${icon} ${prefix}`, message, ...args);
  }
}

// Export
window.BaseController = BaseController;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseController;
}