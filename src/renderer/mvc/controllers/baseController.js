/**
 * Enhanced Base Controller Class
 * Provides common functionality and standardized patterns for all MVC controllers
 * Integrates all mixins: Modal, Content, UI Utils, and Validation
 * @module mvc/controllers/BaseController
 */

class BaseController {
  constructor(name, options = {}) {
    this.name = name;
    this.utils = window.Utils;
    this.dialog = window.dialog;
    this.isInitialized = false;
    this.isDestroyed = false;
    this.eventListeners = [];
    this.options = {
      autoInit: true,
      logLevel: 'info',
      ...options
    };
    
    // Initialize integrated mixins
    this.initializeIntegratedMixins();
    
    // Bind methods
    this.init = this.init.bind(this);
    this.destroy = this.destroy.bind(this);
    this.log = this.log.bind(this);
    
    if (this.options.autoInit) {
      this.init();
    }
  }

  /**
   * Initialize all integrated mixin functionality
   * @private
   */
  initializeIntegratedMixins() {
    // Modal management
    this.modals = new Map();
    
    // Content management 
    this.contentAreas = new Map();
    
    // UI state tracking
    this.elementStates = new Map();
    
    // Validation rules
    this.validationRules = new Map();
    
    // Constants cache
    this.constants = null;
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
   * Initialize constants from main process (cached)
   */
  async initializeConstants() {
    if (this.constants) {
      return this.constants;
    }

    if (!window.appConstants || !window.appConstants.getConstants) {
      throw new Error('IPC not available - appConstants not exposed');
    }

    const response = await window.appConstants.getConstants();
    
    if (response && response.success) {
      this.constants = {
        CARD: response.CARD,
        CARD_TYPES: response.CARD_TYPES,
        RETRY: response.RETRY,
        TIMING: response.TIMING,
        WEB: response.WEB,
        VALIDATION: response.VALIDATION,
        SESSION: response.SESSION,
        CRYPTO: response.CRYPTO
      };
      return this.constants;
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

  // ==================== MODAL MANAGEMENT (Integrated from ModalMixin) ====================

  /**
   * Register a modal for management
   * @param {string} modalId - Modal element ID
   * @param {Object} options - Modal options
   */
  registerModal(modalId, options = {}) {
    const modal = this.getElement(modalId);
    if (!modal) {
      this.log('warn', `Modal not found: ${modalId}`);
      return;
    }

    const config = {
      modal,
      closeOnBackdrop: options.closeOnBackdrop !== false,
      closeOnEscape: options.closeOnEscape !== false,
      onShow: options.onShow || null,
      onHide: options.onHide || null,
      resetForm: options.resetForm || false,
      formElements: options.formElements || []
    };

    this.modals.set(modalId, config);

    // Setup backdrop click
    if (config.closeOnBackdrop) {
      const backdrop = modal.querySelector('.modal-backdrop');
      if (backdrop) {
        this.addEventListener(backdrop, 'click', () => this.hideModal(modalId));
      }
    }

    // Setup escape key
    if (config.closeOnEscape) {
      this.addEventListener(document, 'keydown', (e) => {
        if (e.key === 'Escape' && this.isModalVisible(modalId)) {
          this.hideModal(modalId);
        }
      });
    }
  }

  /**
   * Show modal with consistent behavior
   * @param {string} modalId - Modal ID
   */
  showModal(modalId) {
    const config = this.modals.get(modalId);
    if (!config) {
      this.log('error', `Modal not registered: ${modalId}`);
      return;
    }

    this.utils.updateElement(config.modal, {
      classList: { add: 'modal-visible', remove: 'modal-hidden' }
    });
    
    // Reset form if configured
    if (config.resetForm && config.formElements.length > 0) {
      this.resetModalForm(config.formElements);
    }

    // Call onShow callback
    if (config.onShow) {
      config.onShow();
    }

    this.log('debug', `Modal shown: ${modalId}`);
  }

  /**
   * Hide modal with consistent behavior
   * @param {string} modalId - Modal ID
   */
  hideModal(modalId) {
    const config = this.modals.get(modalId);
    if (!config) {
      this.log('error', `Modal not registered: ${modalId}`);
      return;
    }

    this.utils.updateElement(config.modal, {
      classList: { add: 'modal-hidden', remove: 'modal-visible' }
    });

    // Call onHide callback
    if (config.onHide) {
      config.onHide();
    }

    this.log('debug', `Modal hidden: ${modalId}`);
  }

  /**
   * Check if modal is visible
   * @param {string} modalId - Modal ID
   * @returns {boolean}
   */
  isModalVisible(modalId) {
    const config = this.modals.get(modalId);
    return config ? config.modal.classList.contains('modal-visible') : false;
  }

  /**
   * Reset modal form elements
   * @param {Array} formElements - Array of element IDs to reset
   */
  resetModalForm(formElements) {
    formElements.forEach(elementId => {
      const element = this.getElement(elementId);
      if (element) {
        if (element.type === 'checkbox' || element.type === 'radio') {
          element.checked = false;
        } else {
          element.value = '';
        }
      }
    });
  }

  // ==================== CONTENT MANAGEMENT (Integrated from ContentMixin) ====================

  /**
   * Register a content area for management
   * @param {string} areaId - Content area ID
   * @param {Object} config - Content configuration
   */
  registerContentArea(areaId, config = {}) {
    const area = this.getElement(areaId);
    if (!area) {
      this.log('warn', `Content area not found: ${areaId}`);
      return;
    }

    const contentConfig = {
      area,
      type: config.type || 'text',
      emptyMessage: config.emptyMessage || 'No content available',
      extractors: config.extractors || {},
      validators: config.validators || [],
      placeholderTemplate: config.placeholderTemplate || null
    };

    this.contentAreas.set(areaId, contentConfig);
  }

  /**
   * Extract content from registered area with format support
   * @param {string} areaId - Content area ID  
   * @param {string} format - Format to extract
   * @returns {Object} Extraction result
   */
  extractContent(areaId, format = 'text') {
    const config = this.contentAreas.get(areaId);
    if (!config) {
      return { success: false, message: `Content area not registered: ${areaId}` };
    }

    try {
      let content = '';
      let count = 0;

      switch (config.type) {
        case 'cards':
          const cardItems = config.area.querySelectorAll('.card-item');
          count = cardItems.length;
          if (count === 0) return { success: false, message: 'No cards to extract' };

          cardItems.forEach((item, index) => {
            const number = item.dataset.number;
            const expiry = item.dataset.expiry;
            const cvv = item.dataset.cvv;

            switch (format) {
              case 'pipe':
                content += `${number}|${expiry.replace('/', '|')}|${cvv}\n`;
                break;
              case 'csv':
                if (index === 0) content += 'Card Number,Expiry,CVV\n';
                content += `${number},${expiry},${cvv}\n`;
                break;
              case 'json':
                if (index === 0) content = '[\n';
                content += `  {"number": "${number}", "expMonth": "${expiry.split('/')[0]}", "expYear": "${expiry.split('/')[1]}", "cvv": "${cvv}"}`;
                content += index < count - 1 ? ',\n' : '\n';
                if (index === count - 1) content += ']';
                break;
              case 'text':
              default:
                content += `${number}\n`;
                break;
            }
          });
          break;

        case 'data':
          const pre = config.area.querySelector('pre');
          content = pre ? pre.textContent : config.area.textContent;
          count = content ? content.split('\n').filter(line => line.trim()).length : 0;
          break;

        case 'html':
          content = config.area.innerHTML;
          count = 1;
          break;

        case 'text':
        default:
          content = config.area.textContent || config.area.value;
          count = content ? 1 : 0;
          break;
      }

      // Run validators
      for (const validator of config.validators) {
        const validation = validator(content, count);
        if (!validation.valid) {
          return { success: false, message: validation.message };
        }
      }

      return { success: true, content, count, format };
    } catch (error) {
      this.log('error', 'Content extraction failed:', error);
      return { success: false, message: `Extraction failed: ${error.message}` };
    }
  }

  /**
   * Copy content from registered area
   * @param {string} areaId - Content area ID
   * @param {string} format - Format to copy
   * @param {string} label - Label for success message
   * @returns {Promise<boolean>} Success status
   */
  async copyContentFromArea(areaId, format = 'text', label = 'Content') {
    const extraction = this.extractContent(areaId, format);
    
    if (!extraction.success) {
      this.showError(extraction.message);
      return false;
    }

    if (!extraction.content.trim()) {
      this.showError(`No ${label.toLowerCase()} to copy`);
      return false;
    }

    await this.copyToClipboard(extraction.content, label);
    return true;
  }

  /**
   * Save content from registered area
   * @param {string} areaId - Content area ID
   * @param {string} format - Format to save
   * @param {string} filename - Base filename
   * @returns {boolean} Success status
   */
  saveContentFromArea(areaId, format = 'text', filename = 'export') {
    const extraction = this.extractContent(areaId, format);
    
    if (!extraction.success) {
      this.showError(extraction.message);
      return false;
    }

    if (!extraction.content.trim()) {
      this.showError('No content to save');
      return false;
    }

    const extensions = { json: 'json', csv: 'csv', pipe: 'txt', text: 'txt' };
    const ext = extensions[format] || 'txt';
    const fullFilename = `${filename}-${Date.now()}.${ext}`;

    this.downloadFile(extraction.content, fullFilename);
    this.showSuccess('Content saved successfully!');
    return true;
  }

  /**
   * Clear content area with optional placeholder
   * @param {string} areaId - Content area ID
   * @param {string} placeholder - Optional placeholder content
   */
  clearContentArea(areaId, placeholder = null) {
    const config = this.contentAreas.get(areaId);
    if (!config) {
      this.log('warn', `Content area not registered: ${areaId}`);
      return;
    }

    const placeholderContent = placeholder || 
      config.placeholderTemplate || 
      `<p class="placeholder">${config.emptyMessage}</p>`;

    this.utils.updateElement(config.area, {
      innerHTML: placeholderContent,
      classList: { remove: 'text-format' }
    });

    this.log('debug', `Content area cleared: ${areaId}`);
  }

  /**
   * Download file utility
   * @param {string} content - File content
   * @param {string} filename - Filename with extension
   */
  downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ==================== UI UTILITIES (Integrated from UIUtilsMixin) ====================

  /**
   * Set element state with consistent styling
   * @param {string} elementId - Element ID
   * @param {string} state - State name
   * @param {Object} config - State configuration
   */
  setElementState(elementId, state, config = {}) {
    const element = this.getElement(elementId);
    if (!element) return;

    // Remove previous state classes
    const previousState = this.elementStates.get(elementId);
    if (previousState) {
      element.classList.remove(`state-${previousState}`);
    }

    // Add new state class
    element.classList.add(`state-${state}`);
    this.elementStates.set(elementId, state);

    // Apply configuration using Utils
    const updates = {};
    if (config.text !== undefined) updates.textContent = config.text;
    if (config.disabled !== undefined) element.disabled = config.disabled;
    if (config.classes) updates.classList = { add: config.classes };

    this.utils.updateElement(element, updates);
  }

  /**
   * Add log entry to output element
   * @param {string} outputElementId - Output element ID
   * @param {string} message - Log message
   * @param {string} type - Log type
   */
  addLogEntry(outputElementId, message, type = 'info') {
    const outputElement = this.getElement(outputElementId);
    if (!outputElement) {
      this.log('warn', `Output element not found: ${outputElementId}`);
      return;
    }

    const icons = {
      info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
      success: '<polyline points="20 6 9 17 4 12"/>',
      error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
      warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
    };

    const iconSvg = this.utils.createIcon(icons[type] || icons.info, { width: 14, height: 14 });
    
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.setAttribute('data-log-type', type);
    div.appendChild(iconSvg);
    div.appendChild(document.createTextNode(message));
    
    outputElement.appendChild(div);
    outputElement.scrollTop = outputElement.scrollHeight;
  }

  /**
   * Delayed action utility
   * @param {Function} action - Action to execute
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Timeout ID
   */
  delayedAction(action, delay = 1000) {
    return setTimeout(action, delay);
  }

  // ==================== VALIDATION (Integrated from ValidationMixin) ====================

  /**
   * Register validation rules for form fields
   * @param {string} formId - Form ID
   * @param {Object} rules - Validation rules
   */
  registerValidationRules(formId, rules) {
    this.validationRules.set(formId, rules);
  }

  /**
   * Quick validation helpers (static methods)
   */
  static quickValidate = {
    required: (value, fieldName = 'Field') => ({
      valid: value && value.trim().length > 0,
      message: `${fieldName} is required`
    }),

    selection: (value, fieldName = 'Selection', defaultValue = '') => ({
      valid: value && value.trim().length > 0 && value !== defaultValue,
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
    },

    hasContent: (content, itemType = 'items') => ({
      valid: content && content.trim().length > 0,
      message: `No ${itemType} to copy`
    }),

    minItems: (count, minimum = 1, itemType = 'items') => ({
      valid: count >= minimum,
      message: `At least ${minimum} ${itemType} required`
    })
  };

  /**
   * Validate with quick helpers and show error if invalid
   * @param {Function} validator - Validation function
   * @param {...any} args - Arguments for validator
   * @returns {boolean} Validation success
   */
  validateAndShow(validator, ...args) {
    const result = validator(...args);
    if (!result.valid) {
      this.showError(result.message);
      return false;
    }
    return true;
  }
}

// Export for use in other controllers
window.BaseController = BaseController;

// Also export as module if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseController;
}
