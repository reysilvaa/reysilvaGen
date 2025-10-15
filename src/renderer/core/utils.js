/**
 * Shared Utilities
 * DRY principle - no duplication
 */

const Utils = {
  // ============= DOM Utilities - DRY principle =============
  
  /**
   * Generic element manipulation utility
   */
  updateElement(selector, updates = {}) {
    const element = typeof selector === 'string' ? document.getElementById(selector) || document.querySelector(selector) : selector;
    if (!element) return false;
    
    const { style, innerHTML, textContent, classList, attributes } = updates;
    
    if (style) Object.assign(element.style, style);
    if (innerHTML !== undefined) element.innerHTML = innerHTML;
    if (textContent !== undefined) element.textContent = textContent;
    if (classList) {
      if (classList.add) element.classList.add(...(Array.isArray(classList.add) ? classList.add : [classList.add]));
      if (classList.remove) element.classList.remove(...(Array.isArray(classList.remove) ? classList.remove : [classList.remove]));
      if (classList.toggle) element.classList.toggle(classList.toggle);
    }
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        if (value === null) element.removeAttribute(key);
        else element.setAttribute(key, value);
      });
    }
    
    return true;
  },

  /**
   * Create SVG icon element
   */
  createIcon(pathData, { width = 16, height = 16, className = '', style = {} } = {}) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    if (className) svg.className = className;
    Object.assign(svg.style, style);
    svg.innerHTML = pathData;
    return svg;
  },

  showLoading() {
    this.updateElement("loading-overlay", { classList: { add: "show" } });
  },

  hideLoading() {
    this.updateElement("loading-overlay", { classList: { remove: "show" } });
  },

  // Unified notification system - DRY principle
  showNotification(message, type = 'info') {
    const config = {
      success: { className: 'success-message', icon: '<polyline points="20 6 9 17 4 12"/>', timeout: 3000 },
      error: { className: 'error-message', icon: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>', timeout: 4000 },
      info: { className: 'info-message', icon: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>', timeout: 3500 }
    };

    const { className, icon, timeout } = config[type] || config.info;
    
    const div = document.createElement("div");
    div.className = className;
    
    const iconElement = this.createIcon(icon, { width: 18, height: 18, style: { verticalAlign: 'middle' } });
    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    
    div.appendChild(document.createElement('span')).appendChild(iconElement);
    div.appendChild(textSpan);
    
    this.updateElement(div, {
      style: { 
        position: 'fixed', top: '20px', right: '20px', zIndex: '10001', 
        animation: 'slideIn 0.3s ease' 
      }
    });
    
    document.body.appendChild(div);
    setTimeout(() => div.remove(), timeout);
  },

  showSuccess(message) {
    this.showNotification(message, 'success');
  },

  showError(message) {
    this.showNotification(message, 'error');
  },

  showInfo(message) {
    this.showNotification(message, 'info');
  },

  /**
   * Update button state with icon and text
   */
  updateButton(button, { icon, text, disabled = false, onclick, className = '' } = {}) {
    if (!button) return false;
    
    button.disabled = disabled;
    if (className) button.className = className;
    if (onclick) button.onclick = onclick;
    
    if (icon || text) {
      button.innerHTML = '';
      if (icon) {
        const iconEl = this.createIcon(icon.path, { 
          width: 16, height: 16, 
          className: icon.className || '',
          style: icon.style || {}
        });
        button.appendChild(iconEl);
      }
      if (text) {
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        button.appendChild(textSpan);
      }
    }
    
    return true;
  },

  /**
   * Batch update multiple elements
   */
  updateElements(updates) {
    const results = {};
    Object.entries(updates).forEach(([selector, updateConfig]) => {
      results[selector] = this.updateElement(selector, updateConfig);
    });
    return results;
  },

  // ============= Error Handling Utilities - DRY principle =============
  
  /**
   * Unified error handler with consistent logging and user feedback
   */
  handleError(error, context = '', options = {}) {
    const { 
      showNotification = true, 
      logLevel = 'error',
      userMessage = null,
      throwError = false 
    } = options;
    
    const errorMsg = error?.message || 'Unknown error occurred';
    const fullMessage = context ? `${context}: ${errorMsg}` : errorMsg;
    
    // Log error with context
    console[logLevel](`❌ ${fullMessage}`, error);
    
    // Show user-friendly notification
    if (showNotification) {
      const displayMessage = userMessage || this.getUserFriendlyError(errorMsg);
      this.showError(displayMessage);
    }
    
    // Optionally re-throw for upstream handling
    if (throwError) {
      throw error;
    }
    
    return { success: false, error: errorMsg, message: fullMessage };
  },

  /**
   * Convert technical errors to user-friendly messages
   */
  getUserFriendlyError(error) {
    const errorStr = typeof error === 'string' ? error : error?.message || 'Unknown error';
    
    if (errorStr.includes('network') || errorStr.includes('fetch')) return 'Network connection error';
    if (errorStr.includes('timeout')) return 'Operation timed out';
    if (errorStr.includes('permission')) return 'Permission denied';
    if (errorStr.includes('not found')) return 'Resource not found';
    if (errorStr.includes('invalid')) return 'Invalid input provided';
    
    return 'An unexpected error occurred';
  },

  /**
   * Async operation wrapper with error handling
   */
  async safeAsync(operation, context = '', options = {}) {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error, context, options);
    }
  },

  /**
   * Promise wrapper with timeout and error handling
   */
  async withTimeout(promise, timeoutMs = 5000, context = '') {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });
    
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error, context);
    }
  },

  formatCards(cards, format) {
    switch (format) {
      case "plain":
        return cards.map((c) => c.number).join("\n");
      case "pipe":
        return cards
          .map((c) => `${c.number}|${c.exp_month}|${c.exp_year}|${c.cvv}`)
          .join("\n");
      case "csv":
        return (
          "card_number,exp_month,exp_year,cvv\n" +
          cards
            .map((c) => `${c.number},${c.exp_month},${c.exp_year},${c.cvv}`)
            .join("\n")
        );
      case "json":
        return JSON.stringify(cards, null, 2);
      default:
        return cards.map((c) => c.number).join("\n");
    }
  },
};

window.Utils = Utils;
window.RendererUtils = Utils; // Compatibility alias
