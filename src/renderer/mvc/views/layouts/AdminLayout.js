/**
 * Admin Panel Layout
 * Provides the admin layout structure for the application
 * @module mvc/views/layouts/AdminLayout
 */

class AdminLayout extends BaseView {
  constructor() {
    super('AdminLayout', { logLevel: 'info' });
    
    this.setTemplate(`
      <div id="admin-app" class="app" style="display: none;">
        <div id="admin-login-container">{{loginForm}}</div>
        <div class="admin-container app" id="admin-panel" style="display: none;">
          <div id="admin-sidebar-container">{{sidebar}}</div>
          <div class="main">
            <main class="main__content" id="admin-main-content">{{content}}</main>
          </div>
        </div>
        <div id="admin-modals-container">{{modals}}</div>
      </div>
    `);
  }

  /**
   * Render admin layout with components
   */
  render(data = {}) {
    const defaultData = {
      loginForm: '',
      sidebar: '',
      content: '',
      modals: ''
    };
    
    return super.render({ ...defaultData, ...data });
  }

  /**
   * Show the admin app
   */
  show() {
    const adminApp = document.getElementById('admin-app');
    if (adminApp) {
      adminApp.style.display = 'block';
      this.log('info', 'Admin layout shown');
    }
  }

  /**
   * Hide the admin app
   */
  hide() {
    const adminApp = document.getElementById('admin-app');
    if (adminApp) {
      adminApp.style.display = 'none';
      this.log('info', 'Admin layout hidden');
    }
  }

  /**
   * Show admin panel (after login)
   */
  showPanel() {
    const loginContainer = document.getElementById('admin-login-container');
    const adminPanel = document.getElementById('admin-panel');
    
    if (loginContainer) loginContainer.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    
    this.log('info', 'Admin panel shown');
  }

  /**
   * Show login form (before login)
   */
  showLogin() {
    const loginContainer = document.getElementById('admin-login-container');
    const adminPanel = document.getElementById('admin-panel');
    
    if (loginContainer) loginContainer.style.display = 'block';
    if (adminPanel) adminPanel.style.display = 'none';
    
    this.log('info', 'Admin login shown');
  }
}

// Export for use in both Node and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminLayout;
} else {
  window.AdminLayout = AdminLayout;
}
