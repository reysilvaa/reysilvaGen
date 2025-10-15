/**
 * Main Application Layout
 * Provides the main layout structure for the application
 * @module mvc/views/layouts/MainLayout
 */

class MainLayout extends BaseView {
  constructor() {
    super('MainLayout', { logLevel: 'info' });
    
    this.setTemplate(`
      <div id="main-app" class="app" style="display: none;">
        <div id="sidebar-container">{{sidebar}}</div>
        <div class="main">
          <main class="main__content" id="main-content-container">{{content}}</main>
          <div id="footer-container">{{footer}}</div>
        </div>
      </div>
    `);
  }

  /**
   * Render main layout with components
   */
  render(data = {}) {
    const defaultData = {
      sidebar: '',
      content: '',
      footer: ''
    };
    
    return super.render({ ...defaultData, ...data });
  }

  /**
   * Show the main app
   */
  show() {
    const mainApp = document.getElementById('main-app');
    if (mainApp) {
      mainApp.style.display = 'flex';
      this.log('info', 'Main layout shown');
    }
  }

  /**
   * Hide the main app
   */
  hide() {
    const mainApp = document.getElementById('main-app');
    if (mainApp) {
      mainApp.style.display = 'none';
      this.log('info', 'Main layout hidden');
    }
  }
}

// Export for use in both Node and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MainLayout;
} else {
  window.MainLayout = MainLayout;
}
