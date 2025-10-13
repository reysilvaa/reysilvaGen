/**
 * Base View Class
 * Provides common functionality for all view components in the MVC architecture.
 * @module mvc/views/BaseView
 */

class BaseView {
  constructor(name, options = {}) {
    this.name = name;
    this.options = {
      templateEngine: 'string', // 'string' or 'dom'
      autoRender: false,
      logLevel: 'info',
      ...options
    };
    this.template = '';
    this.data = {};
    this.events = {};
    this.logPrefix = `[${this.name}View]`;
    
    // Initialize view
    this.init();
  }

  /**
   * Initialize view - to be overridden by subclasses
   */
  init() {
    this.log('info', 'View initialized');
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
   * Set template string
   */
  setTemplate(template) {
    this.template = template;
    this.log('debug', 'Template set');
    return this;
  }

  /**
   * Set view data
   */
  setData(data) {
    this.data = { ...this.data, ...data };
    this.log('debug', 'Data updated:', Object.keys(data));
    return this;
  }

  /**
   * Get view data
   */
  getData() {
    return { ...this.data };
  }

  /**
   * Render view with data
   */
  render(additionalData = {}) {
    const renderData = { ...this.data, ...additionalData };
    
    try {
      if (this.options.templateEngine === 'dom') {
        return this.renderDOM(renderData);
      } else {
        return this.renderString(renderData);
      }
    } catch (error) {
      this.log('error', 'Render failed:', error);
      return this.renderError(error);
    }
  }

  /**
   * Render as string template
   */
  renderString(data) {
    let rendered = this.template;
    
    // Simple template interpolation
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      rendered = rendered.replace(regex, data[key] || '');
    });
    
    this.log('debug', 'String template rendered');
    return rendered;
  }

  /**
   * Render as DOM elements
   */
  renderDOM(data) {
    // To be implemented by subclasses if needed
    this.log('warn', 'DOM rendering not implemented');
    return this.renderString(data);
  }

  /**
   * Render error state
   */
  renderError(error) {
    return `
      <div class="view-error">
        <h3>View Error: ${this.name}</h3>
        <p>${error.message}</p>
      </div>
    `;
  }

  /**
   * Bind events to rendered elements
   */
  bindEvents(container) {
    if (!container) {
      this.log('warn', 'No container provided for event binding');
      return;
    }

    Object.keys(this.events).forEach(selector => {
      const [eventType, ...selectorParts] = selector.split(' ');
      const actualSelector = selectorParts.join(' ');
      const handler = this.events[selector];

      if (actualSelector) {
        const elements = container.querySelectorAll(actualSelector);
        elements.forEach(element => {
          element.addEventListener(eventType, handler.bind(this));
        });
      } else {
        container.addEventListener(eventType, handler.bind(this));
      }
    });

    this.log('debug', 'Events bound:', Object.keys(this.events).length);
  }

  /**
   * Add event handler
   */
  on(selector, handler) {
    this.events[selector] = handler;
    return this;
  }

  /**
   * Remove all event handlers
   */
  off() {
    this.events = {};
    return this;
  }

  /**
   * Update view with new data and re-render
   */
  update(data, container = null) {
    this.setData(data);
    const rendered = this.render();
    
    if (container) {
      container.innerHTML = rendered;
      this.bindEvents(container);
    }
    
    return rendered;
  }

  /**
   * Destroy view and cleanup
   */
  destroy() {
    this.off();
    this.data = {};
    this.template = '';
    this.log('info', 'View destroyed');
  }

  /**
   * Create view instance from configuration
   */
  static create(name, config = {}) {
    const view = new BaseView(name, config.options);
    
    if (config.template) {
      view.setTemplate(config.template);
    }
    
    if (config.data) {
      view.setData(config.data);
    }
    
    if (config.events) {
      Object.keys(config.events).forEach(selector => {
        view.on(selector, config.events[selector]);
      });
    }
    
    return view;
  }
}

// Export for use in both Node and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseView;
} else {
  window.BaseView = BaseView;
}
