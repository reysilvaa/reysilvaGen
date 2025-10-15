/**
 * Base Controller Class
 * Provides common functionality and standardized patterns for all MVC controllers
 * @module mvc/controllers/BaseController
 */

class BaseController {
  constructor(name, options = {}) {
    this.name = name;
    this.utils = window.Utils;
    this.isInitialized = false;
    this.isDestroyed = false;
    this.eventListeners = [];
    this.options = {
      autoInit: true,
      logLevel: 'info',
      ...options
    };
    
    // Bind methods
    this.init = this.init.bind(this);
    this.destroy = this.destroy.bind(this);
    this.log = this.log.bind(this);
    
    if (this.options.autoInit) {
      this.init();
    }
  }

  /**
   * Initialize the controller
   * Override this method in child classes
   */
  async init() {
    if (this.isInitialized) {
      this.log('warn', 'Controller already initialized');
      return;
    }

    try {
      this.log('info', `Initializing ${this.name} controller...`);
      
      // Call child class initialization
      await this.onInit();
      
      this.isInitialized = true;
      this.log('success', `${this.name} controller initialized successfully`);
    } catch (error) {
      this.log('error', `Failed to initialize ${this.name} controller:`, error);
      throw error;
    }
  }

  /**
   * Override this method in child classes for initialization logic
   */
  async onInit() {
    // To be implemented by child classes
  }

  /**
   * Destroy the controller and clean up resources
   */
  destroy() {
    this.log('info', `Destroying ${this.name} controller...`);
    
    // Remove all event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element?.removeEventListener(event, handler);
    });
    this.eventListeners = [];
    
    // Call child class cleanup
    this.onDestroy();
    
    this.isInitialized = false;
    this.isDestroyed = true;
    this.log('info', `${this.name} controller destroyed`);
  }

  /**
   * Override this method in child classes for cleanup logic
   */
  onDestroy() {
    // To be implemented by child classes
  }

  /**
   * Add event listener with automatic cleanup tracking
   */
  addEventListener(element, event, handler, options = {}) {
    if (!element) {
      this.log('warn', `Element not found for event: ${event}`);
      return;
    }

    const wrappedHandler = async (...args) => {
      try {
        await handler(...args);
      } catch (error) {
        this.log('error', `Error in ${event} handler:`, error);
        this.utils.showError(`Error: ${error.message}`);
      }
    };

    element.addEventListener(event, wrappedHandler, options);
    this.eventListeners.push({ element, event, handler: wrappedHandler });
    
    this.log('debug', `Added ${event} listener to element`);
  }

  /**
   * Get DOM element by ID with error handling
   */
  getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      this.log('warn', `Element not found: ${id}`);
    }
    return element;
  }

  /**
   * Get multiple DOM elements by IDs
   */
  getElements(ids) {
    const elements = {};
    ids.forEach(id => {
      elements[id] = this.getElement(id);
    });
    return elements;
  }

  /**
   * Show loading state
   */
  showLoading(message = 'Loading...') {
    this.utils.showLoading(message);
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.utils.hideLoading();
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.utils.showSuccess(message);
  }

  /**
   * Show error message
   */
  showError(message) {
    this.utils.showError(message);
  }

  /**
   * Show info message
   */
  showInfo(message) {
    this.utils.showInfo(message);
  }

  /**
   * Standardized logging
   */
  log(level, message, ...args) {
    const prefix = `[${this.name}Controller]`;
    const logMethod = console[level] || console.log;
    
    switch (level) {
      case 'error':
        logMethod(`❌ ${prefix}`, message, ...args);
        break;
      case 'warn':
        logMethod(`⚠️ ${prefix}`, message, ...args);
        break;
      case 'success':
        logMethod(`✅ ${prefix}`, message, ...args);
        break;
      case 'info':
        logMethod(`ℹ️ ${prefix}`, message, ...args);
        break;
      case 'debug':
        if (this.options.logLevel === 'debug') {
          logMethod(`🔍 ${prefix}`, message, ...args);
        }
        break;
      default:
        logMethod(`${prefix}`, message, ...args);
    }
  }

  /**
   * Async delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Safe async operation with error handling
   */
  async safeAsync(operation, errorMessage = 'Operation failed') {
    try {
      this.showLoading();
      await this.delay(100); // Small delay for UX
      
      const result = await operation();
      
      this.hideLoading();
      return result;
    } catch (error) {
      this.hideLoading();
      this.log('error', errorMessage, error);
      this.showError(`${errorMessage}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize constants from main process (for controllers that need them)
   */
  async initializeConstants() {
    if (!window.appConstants || !window.appConstants.getConstants) {
      throw new Error('IPC not available - appConstants not exposed');
    }

    const response = await window.appConstants.getConstants();
    
    if (response && response.success) {
      return {
        CARD: response.CARD,
        CARD_TYPES: response.CARD_TYPES,
        RETRY: response.RETRY,
        TIMING: response.TIMING,
        // Add other constants as needed
      };
    } else {
      throw new Error(`Failed to get constants: ${JSON.stringify(response)}`);
    }
  }

  /**
   * Copy text to clipboard with feedback
   */
  async copyToClipboard(text, label = 'Text') {
    try {
      await navigator.clipboard.writeText(text);
      this.showSuccess(`${label} copied to clipboard!`);
    } catch (error) {
      this.log('error', 'Failed to copy to clipboard:', error);
      this.showError('Failed to copy to clipboard');
    }
  }
}

// Export for use in other controllers
window.BaseController = BaseController;

// Also export as module if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseController;
}
