const TempmailTab = {
  render() {
    return `
      <div class="tab-content" id="tempmail-tab">
        <div class="page-header">
          <h2 class="page__title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Temporary Email
          </h2>
          <p class="page__description">Generate disposable email addresses and manage multiple inboxes with real-time updates</p>
        </div>

        <div class="address-fetcher">
          <!-- Control Panel -->
          <div class="info-panel">
            <div class="control-section">
              <h3 class="section-title">Current Email</h3>
              
              <div class="email-display-card">
                <div class="email-display-content">
                  <div class="email-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div class="email-text" id="tempmail-email-display">
                    Loading...
                  </div>
                  <button id="copy-email-btn" class="btn btn--secondary btn--sm" style="display: none;" title="Copy email">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Email History -->
              <div class="form-group">
                <label>Email History <small>(Click to switch)</small></label>
                <div id="email-history-list" class="scrollable" style="max-height: 240px; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow-y: auto;">
                  <div class="placeholder-box">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <p>No emails generated yet</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="control-section">
              <h3 class="section-title">Generate Email</h3>
              
              <div class="action-buttons">
                <button class="btn btn--primary btn--lg" id="new-email-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  New Email
                </button>
                <button class="btn btn--secondary btn--lg" id="random-email-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                  Random Email
                </button>
              </div>

              <button class="btn btn--danger btn--lg" id="delete-email-btn" disabled title="Delete current email">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete Current Email
              </button>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="auto-refresh-checkbox" />
                  <span>Auto-refresh every 10 seconds</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Inbox Panel -->
          <div class="output-panel">
            <div class="output-header">
              <h3>Inbox</h3>
              <span id="inbox-count-badge" class="badge">0 emails</span>
              <button class="btn btn--secondary btn--sm" id="check-inbox-btn" disabled title="Refresh inbox">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
              </button>
            </div>
            
            <div id="tempmail-inbox" class="scrollable" style="height: 100%; overflow-y: auto;">
              <div class="placeholder-box">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <p>Generate an email to start receiving messages</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Create Email Modal -->
        <div id="create-email-modal" class="modal" style="display: none;">
          <div class="modal-backdrop"></div>
          <div class="modal-content">
            <div class="modal-header">
              <h3>Create New Email</h3>
              <button class="modal-close" id="close-create-modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="username-input">Username</label>
                <input 
                  type="text" 
                  id="username-input" 
                  placeholder="Enter username" 
                />
              </div>

              <div class="form-group">
                <label for="domain-input">Domain</label>
                <div class="select-wrapper">
                  <select id="domain-input">
                    <option value="">Select Domain</option>
                    <option value="oliq.me">oliq.me</option>
                    <option value="asmojo.tech">asmojo.tech</option>
                    <option value="gipo.me">gipo.me</option>
                  </select>
                </div>
              </div>

              <button id="create-email-btn" class="btn btn--primary btn--lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 11 12 14 22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Create Email
              </button>
            </div>
          </div>
        </div>

        <!-- Email Detail Modal -->
        <div id="email-detail-modal" class="modal" style="display: none;">
          <div class="modal-backdrop"></div>
          <div class="modal-content modal-content--large">
            <div class="modal-header">
              <h3 id="email-detail-subject">Email Subject</h3>
              <button class="modal-close" id="close-email-modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body" id="email-detail-body">
              <p class="placeholder">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },
};

window.TempmailTab = TempmailTab;

