const TempmailTab = {
  render() {
    return `
      <div class="tab-content" id="tempmail-tab">
        <div class="page-header">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Temporary Email
          </h2>
          <p>Generate disposable email addresses with automatic OTP detection</p>
        </div>

        <div class="tempmail-container">
          <!-- Control Panel -->
          <div class="tempmail-control-panel">
            <div class="control-section">
              <h3 class="section-title">Email Address</h3>
              
              <div class="form-group" style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500; color: var(--text-secondary);">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  Email Domain
                </label>
                <select id="email-domain-select" class="domain-select">
                  <option value="oliq.me">@oliq.me</option>
                  <option value="asmojo.tech">@asmojo.tech</option>
                  <option value="gipo.me">@gipo.me</option>
                </select>
              </div>
              
              <div class="email-display-card">
                <div class="email-display-content">
                  <div class="email-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div id="tempmail-email-display" class="email-text">
                    Click 'Generate Email' below
                  </div>
                  <button class="btn-icon" id="copy-email-btn" style="display: none;" title="Copy email">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="control-section">
              <h3 class="section-title">Actions</h3>
              
              <div class="action-buttons">
                <button class="btn btn-primary btn-large" id="generate-email-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                  Generate Email
                </button>
                <button class="btn btn-success btn-large" id="check-inbox-btn" disabled>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  Check Inbox
                </button>
              </div>

              <div class="auto-refresh-option">
                <label class="checkbox-label">
                  <input type="checkbox" id="auto-refresh-checkbox" class="checkbox-input" />
                  <span class="checkbox-text">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                    Auto-refresh every 10 seconds
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- Inbox Panel -->
          <div class="output-panel">
            <div class="output-header">
              <h3>Inbox</h3>
              <span id="inbox-count-badge" class="badge" style="background: var(--primary); color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">0</span>
            </div>
            
            <!-- OTP Display (if found) -->
            <div id="otp-display" class="otp-card" style="display: none;">
              <div class="otp-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Verification Code</span>
              </div>
              <div id="otp-code" class="otp-code">------</div>
              <button class="btn-copy-otp" id="copy-otp-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span>Copy Code</span>
              </button>
            </div>
            
            <div id="tempmail-inbox" class="tempmail-inbox">
              <div class="placeholder-box" style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px; opacity: 0.3;">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <p style="font-size: 14px;">Generate an email to start receiving messages</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Email Detail Modal -->
        <div id="email-detail-modal" class="modal" style="display: none;">
          <div class="modal-backdrop"></div>
          <div class="modal-content" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
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

