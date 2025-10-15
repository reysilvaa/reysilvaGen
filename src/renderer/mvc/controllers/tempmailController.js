/**
 * Tempmail Tab Controller (Refactored Version)
 * Handles temporary email operations using BaseController pattern
 * Clean, maintainable, and follows established patterns
 */

class TempmailController extends BaseController {
  constructor() {
    super('Tempmail', { logLevel: 'info', autoInit: false });
    
    // State management
    this.state = {
      currentEmail: null,
      status: 'idle', // idle, loading, generating, ready, failed
      inbox: [],
      emailHistory: [],
      autoRefresh: false
    };
    
    // Intervals
    this.autoRefreshInterval = null;
    this.syncInterval = null;
    
    // Service
    this.tempmailService = new TempmailService();
  }

  async onInit() {
    // Setup UI elements and event listeners
    this.setupElements();
    this.setupEventListeners();
    
    // Initialize real-time sync system
    this.setupRealTimeSync();
    
    // Auto scrape existing email when tab loads
    await this.handleAutoInitialize();
  }

  setupElements() {
    this.elements = this.getElements([
      'tempmail-email-display', 'check-inbox-btn', 'new-email-btn', 
      'delete-email-btn', 'copy-email-btn', 'auto-refresh-checkbox',
      'tempmail-inbox', 'inbox-count-badge', 'email-history-list', 
      'create-email-modal', 'close-create-modal', 'domain-input', 
      'domain-dropdown', 'username-input', 'create-email-btn', 'random-email-btn',
      'email-detail-modal', 'close-email-modal', 'email-detail-subject', 
      'email-detail-body'
    ]);
  }

  setupEventListeners() {
    // Main action buttons
    this.addEventListener(this.elements['new-email-btn'], 'click', () => this.handleShowCreateModal());
    this.addEventListener(this.elements['random-email-btn'], 'click', () => this.handleGenerateRandom());
    this.addEventListener(this.elements['check-inbox-btn'], 'click', () => this.handleCheckInbox(false));
    this.addEventListener(this.elements['delete-email-btn'], 'click', () => this.handleDeleteEmail());
    this.addEventListener(this.elements['copy-email-btn'], 'click', () => this.handleCopyEmail());

    // Modal handlers
    this.addEventListener(this.elements['close-create-modal'], 'click', () => this.handleHideCreateModal());
    this.addEventListener(this.elements['create-email-btn'], 'click', () => this.handleCreateCustom());
    this.addEventListener(this.elements['close-email-modal'], 'click', () => this.handleHideEmailModal());

    // Form interactions
    this.addEventListener(this.elements['domain-input'], 'click', (e) => this.handleToggleDomainDropdown(e));
    this.addEventListener(this.elements['username-input'], 'keypress', (e) => {
      if (e.key === 'Enter') this.handleCreateCustom();
    });

    // Auto refresh toggle
    this.addEventListener(this.elements['auto-refresh-checkbox'], 'change', (e) => this.handleToggleAutoRefresh(e));

    // Setup additional event handlers
    this.setupDomainOptions();
    this.setupModalBackdrops();
    this.setupDocumentClick();
  }

  setupDomainOptions() {
    document.querySelectorAll(".domain-option").forEach(option => {
      this.addEventListener(option, 'click', (e) => {
        e.stopPropagation();
        this.selectedDomain = e.currentTarget.getAttribute("data-domain");
        this.elements['domain-input'].value = this.selectedDomain;
        this.elements['domain-dropdown'].style.display = "none";
      });
    });
  }

  setupModalBackdrops() {
    const createBackdrop = this.elements['create-email-modal']?.querySelector(".modal-backdrop");
    const emailBackdrop = this.elements['email-detail-modal']?.querySelector(".modal-backdrop");
    
    if (createBackdrop) {
      this.addEventListener(createBackdrop, 'click', () => this.handleHideCreateModal());
    }
    if (emailBackdrop) {
      this.addEventListener(emailBackdrop, 'click', () => this.handleHideEmailModal());
    }
  }

  setupDocumentClick() {
    document.addEventListener("click", (e) => {
      const dropdown = this.elements['domain-dropdown'];
      const input = this.elements['domain-input'];
      
      if (dropdown && dropdown.style.display === "block") {
        if (!dropdown.contains(e.target) && e.target !== input) {
          dropdown.style.display = "none";
        }
      }
    });
  }

  // ==================== EVENT HANDLERS ====================

  async handleAutoInitialize() {
    try {
      // Only initialize once when first loaded
      if (window.tempmailInitialized) {
        this.log('info', 'Tempmail already initialized, syncing current state...');
        await this.syncCurrentEmail();
        return;
      }
      
      this.updateState({ status: 'loading' });
      this.log('info', 'Initializing and checking for existing email...');
      
      const result = await this.tempmailService.initialize();
      
      if (result.success && result.email) {
        this.log('success', `Found existing email: ${result.email}`);
        this.updateState({ 
          currentEmail: result.email, 
          status: 'ready' 
        });
        this.addToHistory(result.email);
        
        // Mark as initialized
        window.tempmailInitialized = true;
        
        // Auto check inbox after getting existing email
        setTimeout(() => this.handleCheckInbox(true), 1000);
      } else {
        this.log('warn', 'No existing email found during initialization');
        this.updateState({ status: 'idle' });
        window.tempmailInitialized = true;
      }
    } catch (error) {
      this.log('error', 'Error during initialization:', error);
      this.updateState({ status: 'failed' });
      window.tempmailInitialized = true;
    }
  }

  async handleGenerateRandom() {
    await this.safeAsync(async () => {
      this.updateState({ status: 'generating' });
      this.stopAutoRefresh();
      
      const result = await this.tempmailService.generateRandom();
      
      if (result.success && result.email) {
        this.updateState({ 
          currentEmail: result.email, 
          status: 'ready',
          inbox: [] 
        });
        this.addToHistory(result.email);
        this.showSuccess("Random email generated successfully!");
        
        // Auto check inbox after generation
        setTimeout(() => this.handleCheckInbox(true), 1000);
      } else {
        this.updateState({ status: 'failed' });
        this.handleServiceError(result);
      }
    }, 'Failed to generate random email');
  }

  async handleCreateCustom() {
    const username = this.elements['username-input'].value.trim();
    
    if (!this.selectedDomain) {
      return this.showError("Please select a domain");
    }
    if (!username) {
      return this.showError("Please enter a username");
    }

    this.handleHideCreateModal();
    await this.generateCustomEmail(username, this.selectedDomain);
  }

  async generateCustomEmail(username, domain) {
    await this.safeAsync(async () => {
      this.updateState({ status: 'generating' });
      this.stopAutoRefresh();
      
      const result = await this.tempmailService.generateCustom(username, domain);
      
      if (result.success && result.email) {
        this.updateState({ 
          currentEmail: result.email, 
          status: 'ready',
          inbox: [] 
        });
        this.addToHistory(result.email);
        this.showGenerationSuccess(result, username, domain);
        
        // Auto check inbox after generation
        setTimeout(() => this.handleCheckInbox(true), 1000);
      } else {
        this.updateState({ status: 'failed' });
        this.handleServiceError(result);
      }
    }, 'Failed to generate custom email');
  }

  async handleCheckInbox(silent = false) {
    if (!silent) this.showLoading();
    
    try {
      const result = await this.tempmailService.getInbox();
      
      if (result.success && result.emails && result.emails.length > 0) {
        this.updateState({ inbox: result.emails });
        this.renderInbox(result.emails);
        this.elements['inbox-count-badge'].textContent = result.emails.length.toString();
        
        if (!silent) this.showSuccess(`Found ${result.emails.length} email(s)!`);
      } else if (result.success) {
        this.updateState({ inbox: [] });
        this.renderEmptyInbox();
        if (!silent) this.showSuccess("Inbox checked - no new emails");
    } else {
        this.handleInboxError(result, silent);
      }
    } catch (error) {
      this.log('error', 'Inbox check error:', error);
      this.handleInboxError({ message: error.message }, silent);
    } finally {
      if (!silent) this.hideLoading();
    }
  }

  async handleDeleteEmail() {
    const email = this.state.currentEmail;
    if (!email) {
      return this.showError("No email to delete");
    }

    const confirmed = await window.dialog.confirm(
      `Delete email: ${email}?`,
      "Delete Email",
      true
    );

    if (!confirmed) return;

    await this.safeAsync(async () => {
      const result = await this.tempmailService.deleteEmail();
      
      if (result.success) {
        // Remove from history
        this.state.emailHistory = this.state.emailHistory.filter(e => e !== result.deletedEmail);
        
        if (result.autoGenerated && result.newEmail) {
          // Website auto-generated new email
          this.log('success', `Website auto-generated new email: ${result.newEmail}`);
          this.updateState({ 
            currentEmail: result.newEmail,
            status: 'ready',
            inbox: []
          });
          this.addToHistory(result.newEmail);
          this.showSuccess(`${result.message}. Website auto-generated: ${result.newEmail}`);
          
          // Auto check inbox for new email
          setTimeout(() => this.handleCheckInbox(true), 1000);
        } else {
          // No new email generated
          this.log('warn', 'No new email auto-generated after delete');
          this.updateState({ 
            currentEmail: null,
            status: 'idle',
            inbox: []
          });
          this.showSuccess(`${result.message}. Click 'Random' or 'New' to generate a new email.`);
        }
        
        this.renderHistory();
      } else {
        this.showError(result.message || "Failed to delete email");
      }
    }, 'Failed to delete email');
  }

  async handleCopyEmail() {
    const email = this.state.currentEmail;
    if (email) {
      await this.copyToClipboard(email, 'Email');
    }
  }

  handleShowCreateModal() {
    this.elements['create-email-modal'].style.display = "flex";
    this.elements['domain-input'].value = "";
    this.elements['username-input'].value = "";
    this.selectedDomain = "";
  }

  handleHideCreateModal() {
    this.elements['create-email-modal'].style.display = "none";
    this.elements['domain-dropdown'].style.display = "none";
  }

  handleHideEmailModal() {
    this.elements['email-detail-modal'].style.display = "none";
  }

  handleToggleDomainDropdown(e) {
    e.stopPropagation();
    const dropdown = this.elements['domain-dropdown'];
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
  }

  handleToggleAutoRefresh(e) {
    if (e.target.checked) {
      this.autoRefreshInterval = setInterval(() => {
        if (!this.elements['check-inbox-btn'].disabled) {
          this.handleCheckInbox(true);
        }
      }, 10000);
      this.showSuccess("Auto-refresh enabled (every 10s)");
    } else {
      this.stopAutoRefresh();
      this.showSuccess("Auto-refresh disabled");
    }
  }

  // ==================== STATE MANAGEMENT ====================

  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.updateUI();
  }

  updateUI() {
    const { currentEmail, status, inbox } = this.state;
    
    // Update email display
    const stateConfig = {
      idle: {
        display: "Click 'Random' to generate email",
        copyVisible: false,
        buttonsEnabled: false
      },
      loading: {
        display: "Loading existing email...",
        copyVisible: false,
        buttonsEnabled: true
      },
      generating: {
        display: "Generating...",
        copyVisible: false,
        buttonsEnabled: true
      },
      ready: {
        display: currentEmail,
        copyVisible: true,
        buttonsEnabled: false
      },
      failed: {
        display: "Failed to generate email",
        copyVisible: false,
        buttonsEnabled: true
      }
    };

    const config = stateConfig[status] || stateConfig.idle;
    
    this.elements['tempmail-email-display'].textContent = config.display;
    this.elements['copy-email-btn'].style.display = config.copyVisible ? "flex" : "none";
    this.elements['check-inbox-btn'].disabled = config.buttonsEnabled;
    this.elements['delete-email-btn'].disabled = config.buttonsEnabled;
    
    // Update inbox count
    this.elements['inbox-count-badge'].textContent = inbox.length.toString();
  }

  // ==================== RENDERING ====================

  renderInbox(emails) {
    if (!emails.length) {
      this.renderEmptyInbox();
      return;
    }

    const emailsHTML = emails.map(email => this.renderEmailItem(email)).join('');
    this.elements['tempmail-inbox'].innerHTML = emailsHTML;

    // Add click handlers for email items
    this.elements['tempmail-inbox'].querySelectorAll(".email-item").forEach(item => {
      this.addEventListener(item, 'click', () => this.showEmailDetail(item.dataset.id));
    });
  }

  renderEmailItem(email) {
    const { id, from, sender, subject, time, date, preview, snippet, read, otp } = email;
    const displayFrom = from || sender || "Unknown";
    const displaySubject = subject || "(No Subject)";
    const displayTime = time || date || "Just now";
    const displayPreview = preview || snippet || "No preview available";
    const hasOTP = !!otp;
    
    return `
      <div class="email-item ${read ? 'read' : 'unread'}" data-id="${id}" 
           style="padding: 16px; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s; ${hasOTP ? 'border-left: 3px solid #667eea; background: rgba(102, 126, 234, 0.03);' : ''}"
           onmouseover="this.style.background='var(--bg-secondary)'" 
           onmouseout="this.style.background='${hasOTP ? 'rgba(102, 126, 234, 0.03)' : 'transparent'}'">
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              ${hasOTP ? `
                <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; display: flex; align-items: center; gap: 3px;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  OTP
                </span>
              ` : ''}
              <span>${displaySubject}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">From: ${displayFrom}</div>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-left: 12px; display: flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            ${displayTime}
          </div>
        </div>
        
        <div style="font-size: 13px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${hasOTP ? 'margin-bottom: 10px;' : ''}">${displayPreview}</div>
        
        ${hasOTP ? `
          <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 6px;">
            <div style="flex: 1;">
              <div style="font-size: 9px; color: var(--text-muted); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 3px;">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                CODE
              </div>
              <div style="font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: #667eea; letter-spacing: 2px; user-select: all;">${otp}</div>
            </div>
            <button onclick="event.stopPropagation(); navigator.clipboard.writeText('${otp}'); window.Utils.showSuccess('OTP copied!');" 
                    style="padding: 8px 12px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; transition: all 0.2s;"
                    onmouseover="this.style.background='#5a67d8'; this.style.transform='scale(1.02)'"
                    onmouseout="this.style.background='#667eea'; this.style.transform='scale(1)'">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderEmptyInbox() {
    this.elements['tempmail-inbox'].innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>Inbox is empty. Waiting for emails...</p></div>';
    this.elements['inbox-count-badge'].textContent = "0";
  }

  renderHistory() {
    const historyElement = this.elements['email-history-list'];
    if (!historyElement) return;

    if (this.state.emailHistory.length === 0) {
      historyElement.innerHTML = `
        <div style="padding: 30px 20px; text-align: center; color: var(--text-muted); font-size: 13px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; opacity: 0.3; display: block;">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          No emails generated yet
        </div>
      `;
      return;
    }

    const currentEmail = this.state.currentEmail;
    const html = this.state.emailHistory.map((email, index) => {
      const isLast = index === this.state.emailHistory.length - 1;
      const isCurrent = email === currentEmail;
      
      return `
        <a class="email-history-item" data-email="${email}" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; color: var(--text-primary); cursor: pointer; transition: var(--transition-fast); font-size: 13px; ${!isLast ? 'border-bottom: 1px solid var(--border);' : ''} font-family: var(--font-mono); font-weight: 500; ${isCurrent ? 'background: var(--bg-hover); border-left: 3px solid var(--accent);' : ''}" onmouseover="if(!this.style.borderLeft.includes('3px')) this.style.background='var(--bg-hover)'" onmouseout="if(!this.style.borderLeft.includes('3px')) this.style.background='transparent'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isCurrent ? 'var(--accent)' : 'var(--text-secondary)'}" stroke-width="2" style="flex-shrink: 0;">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${email}</span>
          ${isCurrent ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="3" style="flex-shrink: 0;"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        </a>
      `;
    }).join('');

    historyElement.innerHTML = html;

    // Add click handlers for history items
    historyElement.querySelectorAll(".email-history-item").forEach(item => {
      this.addEventListener(item, 'click', async (e) => {
        const email = e.currentTarget.getAttribute("data-email");
        await this.switchToEmail(email);
      });
    });
  }

  // ==================== UTILITIES ====================

  addToHistory(email) {
    if (!this.state.emailHistory.includes(email)) {
      this.state.emailHistory.unshift(email);
      if (this.state.emailHistory.length > 10) {
        this.state.emailHistory = this.state.emailHistory.slice(0, 10);
      }
      this.renderHistory();
    }
  }

  async switchToEmail(email) {
    await this.safeAsync(async () => {
      const result = await this.tempmailService.switchToEmail(email);
      
      if (result.success && result.email) {
        this.updateState({ 
          currentEmail: result.email,
          status: 'ready',
          inbox: []
        });
        this.showSuccess(`Switched to ${result.email}`);
        
        // Auto check inbox after switch
        setTimeout(() => this.handleCheckInbox(true), 500);
      } else {
        this.showError(result.message || "Failed to switch email");
      }
    }, 'Failed to switch email');
  }

  async showEmailDetail(emailId) {
    const modal = this.elements['email-detail-modal'];
    const subjectEl = this.elements['email-detail-subject'];
    const bodyEl = this.elements['email-detail-body'];

    modal.style.display = "flex";
    bodyEl.innerHTML = '<p class="placeholder">Loading email...</p>';

    try {
      const result = await this.tempmailService.readEmail(emailId);
      
      if (result.success && result.email) {
        const email = result.email;
        subjectEl.textContent = email.subject || "(No Subject)";
        
        let bodyHtml = `
          <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
            <div style="margin-bottom: 8px;"><strong>From:</strong> ${email.from || email.sender || "Unknown"}</div>
            <div style="margin-bottom: 8px;"><strong>Date:</strong> ${email.date || email.time || "Unknown"}</div>
            ${email.to ? `<div style="margin-bottom: 8px;"><strong>To:</strong> ${email.to}</div>` : ''}
            ${email.otp ? `<div style="margin-top: 12px; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center;">
              <div style="color: rgba(255,255,255,0.9); font-size: 12px; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                OTP CODE
              </div>
              <div style="font-size: 28px; font-weight: 700; color: white; font-family: var(--font-mono); letter-spacing: 4px; user-select: all;">${email.otp}</div>
            </div>` : ''}
          </div>
          <div style="line-height: 1.6; color: var(--text-primary); max-height: 400px; overflow-y: auto;">
            ${email.body || email.html || email.text || "No content available"}
          </div>
        `;
        
        bodyEl.innerHTML = bodyHtml;
      } else {
        bodyEl.innerHTML = '<p style="color: var(--danger);">Failed to load email content</p>';
      }
    } catch (error) {
      bodyEl.innerHTML = `<p style="color: var(--danger);">Error: ${error.message}</p>`;
    }
  }

  // ==================== REAL-TIME SYNC ====================

  setupRealTimeSync() {
    // 1. Tab visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && window.tempmailInitialized) {
        setTimeout(() => this.syncCurrentEmail(), 500);
      }
    });

    // 2. Window focus
    window.addEventListener('focus', () => {
      if (window.tempmailInitialized) {
        setTimeout(() => this.syncCurrentEmail(), 300);
      }
    });

    // 3. Mouse enter on tempmail tab
    const tempmailTab = document.querySelector('[data-tab="tempmail"]');
    if (tempmailTab) {
      this.addEventListener(tempmailTab, 'mouseenter', () => {
        if (window.tempmailInitialized) {
          this.syncCurrentEmail();
        }
      });
    }

    // 4. Start periodic sync
    this.startPeriodicSync();
  }

  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (window.tempmailInitialized && !document.hidden) {
        this.syncCurrentEmail();
      }
    }, 5000); // Sync every 5 seconds

    this.log('info', 'Periodic sync started (every 5 seconds)');
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.log('info', 'Periodic sync stopped');
    }
  }

  async syncCurrentEmail() {
    try {
      const result = await this.tempmailService.getCurrentEmail();
      
      if (result.success && result.email) {
        const currentDisplayed = this.state.currentEmail;
        
        // Only update if email actually changed
        if (currentDisplayed !== result.email) {
          this.log('info', `🔄 Syncing: Chrome has ${result.email}, Electron shows ${currentDisplayed}`);
          this.updateState({ 
            currentEmail: result.email,
            status: 'ready'
          });
          this.addToHistory(result.email);
          
          // Show subtle notification
          this.showInfo(`Synced: ${result.email}`);
          
          // Auto check inbox for synced email
          setTimeout(() => this.handleCheckInbox(true), 1000);
        }
      }
    } catch (error) {
      // Silently fail to avoid spam
      this.log('debug', 'Sync failed (silent):', error.message);
    }
  }

  // ==================== ERROR HANDLING ====================

  handleServiceError(result) {
    const message = result.message || "Service error occurred";
    
    if (message.includes('ERR_ABORTED')) {
      this.showError('Unable to connect to tempmail service. Please try again later.');
    } else if (message.includes('timeout')) {
      this.showError('Connection timeout. Please try again.');
    } else {
      this.showError(message);
    }
  }

  handleInboxError(result, silent) {
    const message = result.message || "Failed to check inbox";
    
    if (message.includes('ERR_ABORTED') || message.includes('No email generated yet')) {
      this.renderEmptyInbox();
      if (!silent) {
        this.showInfo('Unable to check inbox - service temporarily unavailable');
      }
    } else if (message.includes('timeout')) {
      this.renderEmptyInbox();
      if (!silent) {
        this.showError('Connection timeout while checking inbox');
      }
    } else {
      if (!silent) {
        this.showError(message);
      }
    }
  }

  showGenerationSuccess(result, username, domain) {
    if (username && domain && result.email !== `${username}@${domain}`) {
      this.showSuccess(`Email created: ${result.email}`);
    } else {
      this.showSuccess("Email generated successfully!");
    }
  }

  // ==================== CLEANUP ====================

  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
      this.elements['auto-refresh-checkbox'].checked = false;
    }
  }

  onDestroy() {
    // Clean up intervals
    this.stopAutoRefresh();
    this.stopPeriodicSync();
    
    this.log('info', 'Tempmail controller cleaned up');
  }
}

// ==================== SERVICE LAYER ====================

class TempmailService {
  async initialize() {
    return await window.tempmailAPI.execute({ action: 'initialize' });
  }

  async generateRandom() {
    return await window.tempmailAPI.create({ type: 'random' });
  }

  async generateCustom(username, domain) {
    return await window.tempmailAPI.create({ 
      type: 'custom', 
      username: username, 
      domain: domain 
    });
  }

  async getInbox() {
    return await window.tempmailAPI.execute({ action: 'inbox' });
  }

  async deleteEmail() {
    return await window.tempmailAPI.delete();
  }

  async getCurrentEmail() {
    return await window.tempmailAPI.show({ action: 'current' });
  }

  async switchToEmail(email) {
    return await window.tempmailAPI.execute({ action: 'switch', email: email });
  }

  async readEmail(emailId) {
    return await window.tempmailAPI.execute({ action: 'read', emailId: emailId });
  }
}

// Initialize controller (singleton pattern to prevent duplicates)
async function initTempmailTab() {
  try {
    // Prevent multiple initialization
    if (window.tempmailController && !window.tempmailController.isDestroyed) {
      console.log('ℹ️ Tempmail controller already initialized, skipping...');
      return;
    }

    // Cleanup existing controller if any
    if (window.tempmailController) {
      window.tempmailController.destroy();
    }

    const controller = new TempmailController();
    await controller.init();
    
    // Store reference for cleanup if needed
    window.tempmailController = controller;
    console.log('✅ Tempmail controller initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Tempmail controller:', error);
    window.Utils?.showError('Failed to initialize temporary email functionality.');
  }
}

// Export for compatibility
window.TempmailInit = { init: initTempmailTab };