const Sidebar = {
  render() {
    return `
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
          <button class="btn btn-primary btn-small" id="check-update-btn" style="width: 100%; margin-bottom: 12px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Check for Updates
          </button>
          <div id="update-status" style="font-size: 11px; color: var(--text-muted); text-align: center; margin-bottom: 8px; display: none;">
            <!-- Update status will be displayed here -->
          </div>
          <div style="font-size: 11px; color: var(--text-muted); text-align: center">
            v2.0.2 | Developed by Reysilva
          </div>
          <div style="margin-top: 8px; color: var(--danger); text-align: center; font-size: 10px;">
            ⚠️ Development Only
          </div>
        </div>
      </aside>
    `;
  },
};

window.Sidebar = Sidebar;
