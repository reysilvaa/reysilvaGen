/**
 * Sidebar Component View
 * Navigation sidebar for the main application
 * @module mvc/views/components/sidebar
 */

class SidebarView extends BaseView {
  constructor() {
    super('Sidebar', { logLevel: 'info' });
    
    this.setTemplate(`
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo-section">
            <span class="logo-icon">
              <img src="../../assets/icon.ico" alt="App Icon" width="28" height="28" style="display: block;" />
            </span>
            <div class="logo-text">
              <h1>ReysilvaGEN</h1>
              <p>Data Generator</p>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <button class="nav-item active" data-tab="cards">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 3v18"/>
              </svg>
            </span>
            Generate Cards
          </button>
          <button class="nav-item" data-tab="address">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7v10c0 5 10 5 10 5s10 0 10-5V7L12 2z"/>
              </svg>
            </span>
            Generate Address
          </button>
          <button class="nav-item" data-tab="combined">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8M12 8v8"/>
              </svg>
            </span>
            Combined Mode
          </button>
          <button class="nav-item" data-tab="cursor-reset">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </span>
            Cursor Reset
          </button>
          <button class="nav-item" data-tab="tempmail">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            Temp Mail
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="btn btn-primary btn-small" id="check-update-btn" style="width: 100%; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="update-icon">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            <span>Check for Updates</span>
          </button>
          <div id="update-status" style="font-size: 12px; text-align: center; margin-bottom: 10px; display: none; padding: 8px 12px; border-radius: var(--radius-md); background: var(--bg-secondary); border: 1px solid var(--border);">
            <!-- Update status will be displayed here -->
          </div>
          <div style="font-size: 11px; color: var(--text-muted); text-align: center; line-height: 1.4;">
            <div style="font-weight: 600; color: var(--text-secondary);" id="app-version"></div>
            <div style="margin-top: 2px;">Developed by Reysilva</div>
          </div>
          <div style="margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--warning); font-size: 10px; font-weight: 500;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Development Only</span>
          </div>
        </div>
      </aside>
    `);
    
    // Set up navigation events
    this.on('click .nav-item', this.handleNavClick);
    this.on('click #check-update-btn', this.handleUpdateCheck);
  }

  /**
   * Handle navigation item click
   */
  handleNavClick(event) {
    const navItem = event.currentTarget;
    const tab = navItem.getAttribute('data-tab');
    
    if (tab) {
      // Remove active class from all nav items
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Add active class to clicked item
      navItem.classList.add('active');
      
      // Trigger tab change event
      if (window.AppInit && window.AppInit.switchTab) {
        window.AppInit.switchTab(tab);
      }
      
      this.log('info', `Navigation to ${tab} tab`);
    }
  }

  /**
   * Handle update check button click
   */
  handleUpdateCheck(event) {
    event.preventDefault();
    
    if (window.electron && window.electron.checkForUpdates) {
      window.electron.checkForUpdates();
      this.log('info', 'Update check requested');
    } else {
      this.log('warn', 'Update check not available');
    }
  }

  /**
   * Update app version display
   */
  updateVersion(version) {
    this.setData({ appVersion: version });
  }

  /**
   * Update update status display
   */
  updateStatus(status, message) {
    const statusElement = document.getElementById('update-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.style.display = status ? 'block' : 'none';
    }
  }
}

// Export for use in both Node and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SidebarView;
} else {
  window.SidebarView = SidebarView;
  // Backward compatibility
  window.Sidebar = {
    render: () => new SidebarView().render()
  };
}
