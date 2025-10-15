/**
 * Loading Overlay Component
 * Provides loading states for all application processes
 * @module mvc/views/components/LoadingOverlay
 */

class LoadingOverlay extends BaseView {
  constructor() {
    super('LoadingOverlay', { logLevel: 'info' });
    
    this.setTemplate(`
      <div class="loading-overlay" id="loading-overlay">
        <div class="loading-overlay__backdrop"></div>
        <div class="loading-overlay__content">
          <div class="loading-overlay__spinner">
            <div class="spinner"></div>
          </div>
          <div class="loading-overlay__text" id="loading-text">{{message}}</div>
          <div class="loading-overlay__progress" id="loading-progress" style="display: none;">
            <div class="progress-bar">
              <div class="progress-bar__fill" id="progress-fill"></div>
            </div>
            <div class="progress-text" id="progress-text">0%</div>
          </div>
        </div>
      </div>
    `);
    
    this.isVisible = false;
    this.currentMessage = 'Loading...';
  }

  /**
   * Show loading overlay
   */
  show(message = 'Loading...', showProgress = false) {
    this.currentMessage = message;
    this.isVisible = true;
    
    const overlay = document.getElementById('loading-overlay');
    const textEl = document.getElementById('loading-text');
    const progressEl = document.getElementById('loading-progress');
    
    if (overlay) {
      overlay.classList.add('loading-overlay--active');
      if (textEl) textEl.textContent = message;
      if (progressEl) {
        progressEl.style.display = showProgress ? 'block' : 'none';
      }
      
      // Add to body if not already there
      if (!overlay.parentNode) {
        document.body.appendChild(overlay);
      }
      
      this.log('info', `Loading overlay shown: ${message}`);
    }
  }

  /**
   * Hide loading overlay
   */
  hide() {
    this.isVisible = false;
    
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('loading-overlay--active');
      this.log('info', 'Loading overlay hidden');
    }
  }

  /**
   * Update loading message
   */
  updateMessage(message) {
    this.currentMessage = message;
    const textEl = document.getElementById('loading-text');
    if (textEl) {
      textEl.textContent = message;
    }
  }

  /**
   * Update progress
   */
  updateProgress(percentage, message = null) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill) {
      progressFill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${Math.round(percentage)}%`;
    }
    
    if (message) {
      this.updateMessage(message);
    }
  }

  /**
   * Show loading with auto-hide after delay
   */
  showTemporary(message = 'Loading...', duration = 2000) {
    this.show(message);
    setTimeout(() => {
      this.hide();
    }, duration);
  }

  /**
   * Show loading for async operation
   */
  async showForOperation(operation, message = 'Processing...') {
    this.show(message);
    try {
      const result = await operation();
      this.hide();
      return result;
    } catch (error) {
      this.hide();
      throw error;
    }
  }
}

// Simple static methods for global usage
const LoadingManager = {
  overlay: null,
  
  init() {
    if (!this.overlay) {
      this.overlay = new LoadingOverlay();
      // Render and inject into DOM
      const overlayHTML = this.overlay.render({ message: 'Loading...' });
      document.body.insertAdjacentHTML('beforeend', overlayHTML);
    }
  },
  
  show(message = 'Loading...', showProgress = false) {
    this.init();
    this.overlay.show(message, showProgress);
  },
  
  hide() {
    if (this.overlay) {
      this.overlay.hide();
    }
  },
  
  updateMessage(message) {
    if (this.overlay) {
      this.overlay.updateMessage(message);
    }
  },
  
  updateProgress(percentage, message = null) {
    if (this.overlay) {
      this.overlay.updateProgress(percentage, message);
    }
  },
  
  showTemporary(message = 'Loading...', duration = 2000) {
    this.init();
    this.overlay.showTemporary(message, duration);
  },
  
  async showForOperation(operation, message = 'Processing...') {
    this.init();
    return await this.overlay.showForOperation(operation, message);
  }
};

// Export for use in both Node and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LoadingOverlay, LoadingManager };
} else {
  window.LoadingOverlay = LoadingOverlay;
  window.LoadingManager = LoadingManager;
  
  // Backward compatibility
  window.LoadingOverlay = {
    render: () => new LoadingOverlay().render({ message: 'Loading...' })
  };
}
