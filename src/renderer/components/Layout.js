/**
 * Layout Components - Unified Architecture
 * All layout components using single BaseComponent pattern
 * @module components/Layout
 */

class MainLayout extends BaseComponent {
  constructor() {
    super('MainLayout', { logLevel: 'info' });
    
    this.setTemplate(`
      <div class="app" id="main-app">
        <div class="sidebar" id="sidebar-container">{{sidebar}}</div>
        <div class="main">
          <div class="main__content" id="main-content">{{content}}</div>
          <div id="footer-container">{{footer}}</div>
        </div>
      </div>
    `);
  }

  show() {
    document.getElementById('main-app')?.classList.remove('hidden');
    this.log('info', 'Main layout shown');
  }

  hide() {
    document.getElementById('main-app')?.classList.add('hidden');
    this.log('info', 'Main layout hidden');
  }
}

class AdminLayout extends BaseComponent {
  constructor() {
    super('AdminLayout', { logLevel: 'info' });
    
    this.setTemplate(`
      <div class="app" id="admin-app">
        <div id="admin-login">{{loginForm}}</div>
        <div class="admin-panel hidden" id="admin-panel">
          <div class="sidebar" id="admin-sidebar">{{sidebar}}</div>
          <div class="main">
            <div class="main__content" id="admin-content">{{content}}</div>
          </div>
        </div>
        <div id="admin-modals">{{modals}}</div>
      </div>
    `);
  }

  showLogin() {
    document.getElementById('admin-login')?.classList.remove('hidden');
    document.getElementById('admin-panel')?.classList.add('hidden');
    this.log('info', 'Admin login shown');
  }

  showPanel() {
    document.getElementById('admin-login')?.classList.add('hidden');
    document.getElementById('admin-panel')?.classList.remove('hidden');
    this.log('info', 'Admin panel shown');
  }
}

class Sidebar extends BaseComponent {
  constructor(type = 'main') {
    super('Sidebar', { logLevel: 'info' });
    
    this.type = type;
    this.setTemplate(this.getTemplate());
    this.setupEvents();
  }

  getTemplate() {
    if (this.type === 'admin') {
      return `
        <div class="sidebar__header">
          <div class="sidebar__logo">
            <div class="sidebar__logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2" />
              </svg>
            </div>
            <div class="sidebar__logo-text">
              <h1>ADMIN PANEL</h1>
              <p>BIN Configuration</p>
            </div>
          </div>
        </div>
        <nav class="nav">
          <button class="nav__item nav__item--active" data-section="bins">
            <span class="nav__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </span>
            BIN Management
          </button>
          <button class="nav__item" data-section="settings">
            <span class="nav__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2" />
              </svg>
            </span>
            Settings
          </button>
        </nav>
        <div class="sidebar__footer">
          <button class="btn btn--secondary btn--sm btn--full" id="back-to-main">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Main
          </button>
          <button class="btn btn--danger btn--sm btn--full" id="logout" style="margin-top: var(--space-2);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      `;
    }

    return `
      <div class="sidebar__header">
        <div class="sidebar__logo">
          <div class="sidebar__logo-icon">
            <img src="../../assets/icon.ico" alt="App Icon" width="28" height="28" />
          </div>
          <div class="sidebar__logo-text">
            <h1>ReysilvaGEN</h1>
            <p>Data Generator</p>
          </div>
        </div>
      </div>
      <nav class="nav">
        <button class="nav__item nav__item--active" data-tab="cards">
          <span class="nav__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 3v18"/>
            </svg>
          </span>
          Generate Cards
        </button>
        <button class="nav__item" data-tab="address">
          <span class="nav__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7v10c0 5 10 5 10 5s10 0 10-5V7L12 2z"/>
            </svg>
          </span>
          Generate Address
        </button>
        <button class="nav__item" data-tab="combined">
          <span class="nav__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12h8M12 8v8"/>
            </svg>
          </span>
          Combined Mode
        </button>
        <button class="nav__item" data-tab="cursor-reset">
          <span class="nav__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </span>
          Cursor Reset
        </button>
        <button class="nav__item" data-tab="tempmail">
          <span class="nav__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </span>
          Temp Mail
        </button>
      </nav>
      <div class="sidebar__footer">
        <button class="btn btn--primary btn--sm btn--full" id="check-updates">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Check Updates
        </button>
        <div id="update-status" class="hidden"></div>
        <div style="font-size: var(--text-xs); color: var(--color-text-muted); text-align: center; margin-top: var(--space-3);">
          <div style="font-weight: var(--weight-semibold);" id="app-version"></div>
          <div>Developed by Reysilva</div>
        </div>
      </div>
    `;
  }

  setupEvents() {
    this.on('click .nav__item', this.handleNavClick);
    this.on('click #check-updates', this.handleUpdateCheck);
    this.on('click #back-to-main', this.handleBackToMain);
    this.on('click #logout', this.handleLogout);
  }

  handleNavClick(event) {
    const item = event.currentTarget;
    const tab = item.getAttribute('data-tab');
    const section = item.getAttribute('data-section');
    
    // Remove active from all items
    this.element.querySelectorAll('.nav__item').forEach(nav => {
      nav.classList.remove('nav__item--active');
    });
    
    // Add active to clicked item
    item.classList.add('nav__item--active');
    
    // Emit navigation event
    if (tab) {
      this.emit('navigate', { tab });
    } else if (section) {
      this.emit('navigate', { section });
    }
    
    this.log('info', `Navigation to ${tab || section}`);
  }

  handleUpdateCheck(event) {
    event.preventDefault();
    this.emit('check-updates');
    this.log('info', 'Update check requested');
  }

  handleBackToMain() {
    this.emit('back-to-main');
  }

  handleLogout() {
    this.emit('logout');
  }

  updateVersion(version) {
    const versionEl = this.element?.querySelector('#app-version');
    if (versionEl) {
      versionEl.textContent = `v${version}`;
    }
  }

  updateStatus(message, show = true) {
    const statusEl = this.element?.querySelector('#update-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.classList.toggle('hidden', !show);
    }
  }
}

class Footer extends BaseComponent {
  constructor() {
    super('Footer');
    
    this.setTemplate(`
      <footer class="footer">
        <div class="footer__warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Do not use for real transactions. All data is for development and QA purposes only.
        </div>
      </footer>
    `);
  }
}

// Register components
BaseComponent.register('MainLayout', MainLayout);
BaseComponent.register('AdminLayout', AdminLayout);
BaseComponent.register('Sidebar', Sidebar);
BaseComponent.register('Footer', Footer);

// Export for both Node and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MainLayout, AdminLayout, Sidebar, Footer };
} else {
  window.Layout = { MainLayout, AdminLayout, Sidebar, Footer };
}






