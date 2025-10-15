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
          <p>Generate disposable email addresses and manage multiple inboxes</p>
        </div>

        <div class="tempmail-container">
          <!-- Control Panel -->
          <div class="tempmail-control-panel">
            <div class="control-section">
              <h3 class="section-title">Current Email</h3>
              
              <div style="background: var(--bg-tertiary); border: 1px solid var(--border-light); border-radius: var(--radius-lg); padding: 18px; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%); pointer-events: none;"></div>
                <div style="display: flex; align-items: center; gap: 12px; position: relative;">
                  <div style="flex-shrink: 0; width: 44px; height: 44px; background: var(--accent); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div style="flex: 1; min-width: 0;">
                    <div id="tempmail-email-display" style="font-size: 15px; font-weight: 600; color: var(--text-primary); font-family: var(--font-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      Loading...
                    </div>
                  </div>
                  <button id="copy-email-btn" style="display: none; flex-shrink: 0; width: 38px; height: 38px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); color: var(--accent);" onmouseover="this.style.background='var(--bg-hover)'; this.style.borderColor='var(--border-light)';" onmouseout="this.style.background='var(--bg-secondary)'; this.style.borderColor='var(--border)';" title="Copy email">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Email History -->
              <div style="margin-top: 20px;">
                <h4 style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Email History
                  <span style="font-size: 11px; font-weight: 400; color: var(--text-muted); margin-left: auto;">(Click to switch)</span>
                </h4>
                <div id="email-history-list" style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); max-height: 240px; overflow-y: auto;">
                  <div style="padding: 30px 20px; text-align: center; color: var(--text-muted); font-size: 13px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; opacity: 0.3; display: block;">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    No emails generated yet
                  </div>
                </div>
              </div>
            </div>

            <div class="control-section">
              <h3 class="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"/>
                </svg>
                Generate Email
              </h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
                <button class="btn btn--primary btn--lg" id="new-email-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  New
                </button>
                <button class="btn btn--secondary btn--lg" id="random-email-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                  Random
                </button>
              </div>

              <h3 class="section-title" style="margin-top: 20px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete Email
              </h3>

              <button class="btn btn--danger btn--lg" id="delete-email-btn" disabled title="Delete current email" style="width: 100%;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete Current Email
              </button>

              <div class="auto-refresh-option" style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                <label class="checkbox-label" style="margin: 0; cursor: pointer;">
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
            <div class="output-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md);">
              <div style="display: flex; align-items: center; gap: 12px;">
                <h3 style="margin: 0;">Inbox</h3>
                <span id="inbox-count-badge" class="badge" style="background: var(--primary); color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">0</span>
              </div>
              <button class="btn-refresh-icon" id="check-inbox-btn" disabled title="Refresh inbox">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
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

        <!-- Create Email Modal -->
        <div id="create-email-modal" class="modal" style="display: none;">
          <div class="modal-backdrop"></div>
          <div class="modal-content" style="max-width: 520px; width: 90%;">
            <div class="modal-header" style="padding: 24px 28px; border-bottom: 1px solid var(--border);">
              <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 10px;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Create New Email
              </h3>
              <button class="modal-close" id="close-create-modal" style="position: absolute; right: 20px; top: 20px; width: 36px; height: 36px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; transition: var(--transition-base); color: var(--text-secondary);" onmouseover="this.style.background='var(--bg-hover)'; this.style.color='var(--text-primary)';" onmouseout="this.style.background='transparent'; this.style.color='var(--text-secondary)';">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body" style="padding: 28px;">
              <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500; color: var(--text-secondary);">Username</label>
                <input 
                  type="text" 
                  id="username-input" 
                  placeholder="Enter username" 
                  class="form-input"
                  style="display: block; width: 100%; padding: 14px 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-primary); font-size: 15px; transition: var(--transition-base);"
                  onfocus="this.style.background='rgba(255, 255, 255, 0.08)'; this.style.borderColor='var(--border-light)';"
                  onblur="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.borderColor='var(--border)';"
                />
              </div>

              <div class="form-group" style="margin-bottom: 28px;">
                <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500; color: var(--text-secondary);">Domain</label>
                <div id="domain-dropdown-wrapper" style="position: relative;">
                  <input 
                    type="text" 
                    id="domain-input" 
                    readonly 
                    placeholder="Select Domain" 
                    class="form-input"
                    style="display: block; width: 100%; padding: 14px 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-primary); cursor: pointer; font-size: 15px; transition: var(--transition-base); padding-right: 40px;"
                    onfocus="this.style.background='rgba(255, 255, 255, 0.08)'; this.style.borderColor='var(--border-light)';"
                    onblur="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.borderColor='var(--border)';"
                  />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-muted);">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  <div id="domain-dropdown" style="display: none; position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 100; overflow: hidden;">
                    <a data-domain="oliq.me" class="domain-option" style="display: block; padding: 12px 16px; color: var(--text-primary); cursor: pointer; transition: var(--transition-fast); font-size: 14px; border-bottom: 1px solid var(--border);">oliq.me</a>
                    <a data-domain="asmojo.tech" class="domain-option" style="display: block; padding: 12px 16px; color: var(--text-primary); cursor: pointer; transition: var(--transition-fast); font-size: 14px; border-bottom: 1px solid var(--border);">asmojo.tech</a>
                    <a data-domain="gipo.me" class="domain-option" style="display: block; padding: 12px 16px; color: var(--text-primary); cursor: pointer; transition: var(--transition-fast); font-size: 14px;">gipo.me</a>
                  </div>
                </div>
              </div>

              <button id="create-email-btn" class="btn btn--primary btn--lg" style="width: 100%;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
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

