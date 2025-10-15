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
    
    // Prevent multiple modal opens
    this.currentlyOpeningEmail = null;
    
    // Prevent double sync on tab activation
    this.isCurrentlySyncing = false;
  }

  async onInit() {
    // Setup UI elements and event listeners
    this.setupElements();
    this.setupEventListeners();
    
    // Initialize real-time sync system
    this.setupRealTimeSync();
    
    // Check for existing email when tab loads
    await this.loadExistingEmail();
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
    this.addEvent(this.elements['new-email-btn'], 'click', () => this.handleShowCreateModal());
    this.addEvent(this.elements['random-email-btn'], 'click', () => this.handleGenerateRandom());
    this.addEvent(this.elements['check-inbox-btn'], 'click', () => this.handleCheckInbox(false));
    this.addEvent(this.elements['delete-email-btn'], 'click', () => this.handleDeleteEmail());
    this.addEvent(this.elements['copy-email-btn'], 'click', () => this.handleCopyEmail());

    // Modal handlers
    this.addEvent(this.elements['close-create-modal'], 'click', () => this.handleHideCreateModal());
    this.addEvent(this.elements['create-email-btn'], 'click', () => this.handleCreateCustom());
    this.addEvent(this.elements['close-email-modal'], 'click', () => this.handleHideEmailModal());

    // Form interactions
    this.addEvent(this.elements['domain-input'], 'click', (e) => this.handleToggleDomainDropdown(e));
    this.addEvent(this.elements['username-input'], 'keypress', (e) => {
      if (e.key === 'Enter') this.handleCreateCustom();
    });

    // Auto refresh toggle
    this.addEvent(this.elements['auto-refresh-checkbox'], 'change', (e) => this.handleToggleAutoRefresh(e));

    // Setup additional event handlers
    this.setupDomainOptions();
    this.setupModalBackdrops();
    this.setupDocumentClick();
  }

  setupDomainOptions() {
    document.querySelectorAll(".domain-option").forEach(option => {
      this.addEvent(option, 'click', (e) => {
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
      this.addEvent(createBackdrop, 'click', () => this.handleHideCreateModal());
    }
    if (emailBackdrop) {
      this.addEvent(emailBackdrop, 'click', () => this.handleHideEmailModal());
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

  async loadExistingEmail() {
    try {
      this.updateState({ status: 'loading' });
      this.log('info', 'Checking for existing email...');
      
      const result = await this.tempmailService.initialize();
      
      if (result.success && result.email) {
        this.log('success', `Found existing email: ${result.email}`);
        this.updateState({ 
          currentEmail: result.email, 
          status: 'ready' 
        });
        await this.syncEmailHistory();
        
        // Auto check inbox after getting existing email
        setTimeout(() => this.handleCheckInbox(true), 1000);
      } else {
        this.log('info', 'No existing email found');
        this.updateState({ status: 'idle' });
      }
    } catch (error) {
      this.log('error', 'Error loading existing email:', error);
      this.updateState({ status: 'idle' });
    }
  }

  async handleGenerateRandom() {
    await this.run(async () => {
      this.updateState({ status: 'generating' });
      this.stopAutoRefresh();
      
      const result = await this.tempmailService.generateRandom();
      
      if (result.success && result.email) {
        this.updateState({ 
          currentEmail: result.email, 
          status: 'ready',
          inbox: [] 
        });
        await this.syncEmailHistory();
        this.notify('success', "Random email generated successfully!");
        
        // Auto check inbox after generation
        setTimeout(() => this.handleCheckInbox(true), 1000);
      } else {
        this.updateState({ status: 'failed' });
        this.handleServiceError(result);
      }
    }, 'Generating random email...');
  }

  async handleCreateCustom() {
    const username = this.elements['username-input'].value.trim();
    
    if (!this.selectedDomain) {
      return this.notify('error', "Please select a domain");
    }
    if (!username) {
      return this.notify('error', "Please enter a username");
    }

    this.handleHideCreateModal();
    await this.generateCustomEmail(username, this.selectedDomain);
  }

  async generateCustomEmail(username, domain) {
    await this.run(async () => {
      this.updateState({ status: 'generating' });
      this.stopAutoRefresh();
      
      const result = await this.tempmailService.generateCustom(username, domain);
      
      if (result.success && result.email) {
        this.updateState({ 
          currentEmail: result.email, 
          status: 'ready',
          inbox: [] 
        });
        await this.syncEmailHistory();
        this.showGenerationSuccess(result, username, domain);
        
        // Auto check inbox after generation
        setTimeout(() => this.handleCheckInbox(true), 1000);
      } else {
        this.updateState({ status: 'failed' });
        this.handleServiceError(result);
      }
    }, 'Generating custom email...');
  }

  async handleCheckInbox(silent = false) {
    if (!silent) this.showLoading('Checking inbox...');
    
    try {
      const result = await this.tempmailService.getInbox();
      
      if (result.success && result.emails && result.emails.length > 0) {
        const emails = result.emails;
        this.updateState({ inbox: emails });
        this.renderInbox(emails);
        this.elements['inbox-count-badge'].textContent = emails.length.toString();
        
        if (!silent) this.notify('success', `Found ${emails.length} email(s)!`);
        this.log('info', `📬 Loaded ${emails.length} emails successfully`);
      } else if (result.success) {
        this.updateState({ inbox: [] });
        this.renderEmptyInbox();
        if (!silent) this.notify('success', "Inbox checked - no new emails");
        this.log('info', '📭 Inbox is empty');
    } else {
        this.log('error', 'Inbox check failed:', result);
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
      return this.notify('error', "No email to delete");
    }

    const confirmed = await window.dialog.confirm(
      `Delete email: ${email}?`,
      "Delete Email",
      true
    );

    if (!confirmed) return;

    await this.run(async () => {
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
          await this.syncEmailHistory();
          this.notify('success', `${result.message}. Website auto-generated: ${result.newEmail}`);
          
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
          this.notify('success', `${result.message}. Click 'Random' or 'New' to generate a new email.`);
        }
        
        this.renderHistory();
      } else {
        this.notify('error', result.message || "Failed to delete email");
      }
    }, 'Deleting email...');
  }

  async handleCopyEmail() {
    const email = this.state.currentEmail;
    if (email) {
      await this.copyText(email);
      this.notify('success', 'Email copied to clipboard!');
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
    const modal = this.elements['email-detail-modal'];
    if (modal) {
      modal.classList.remove('email-detail-modal--active');
      modal.style.display = 'none';
    }
    this.currentlyOpeningEmail = null;
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
      this.notify('success', "Auto-refresh enabled (every 10s)");
    } else {
      this.stopAutoRefresh();
      this.notify('success', "Auto-refresh disabled");
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
    const emailItems = this.elements['tempmail-inbox'].querySelectorAll(".email-item");
    
    emailItems.forEach((item, index) => {
      const emailId = item.dataset.id;
      
      if (emailId && emailId.trim() !== '') {
        // Remove any existing click handlers to prevent multiple events
        item.replaceWith(item.cloneNode(true));
        const freshItem = this.elements['tempmail-inbox'].querySelectorAll(".email-item")[index];
        
        this.addEvent(freshItem, 'click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.log('info', `📧 Opening email: ${emailId}`);
          this.showEmailDetail(emailId);
        });
        
        // Hover effects are now handled by CSS classes
      }
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
      <div class="email-item ${read ? 'email-item--read' : 'email-item--unread'} ${hasOTP ? 'email-item--otp' : ''}" data-id="${id}">
        <div class="email-item__header">
          <div class="email-item__subject-row">
            <div class="email-item__subject">
              ${hasOTP ? `
                <span class="otp-badge">
                  <svg class="otp-badge__icon" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  OTP
                </span>
              ` : ''}
              <span>${displaySubject}</span>
            </div>
            <div class="email-item__from">From: ${displayFrom}</div>
          </div>
          <div class="email-item__time">
            <svg class="email-item__time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            ${displayTime}
          </div>
        </div>
        
        <div class="email-item__preview">${displayPreview}</div>
        
        ${hasOTP ? `
          <div class="email-item__otp-section">
            <div class="email-item__otp-info">
              <div class="email-item__otp-label">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                CODE
              </div>
              <div class="email-item__otp-code">${otp}</div>
            </div>
            <button class="email-item__otp-copy" onclick="event.stopPropagation(); navigator.clipboard.writeText('${otp}'); window.tempmailController?.notify('success', 'OTP copied!');">
              <svg class="email-item__otp-copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
    this.elements['tempmail-inbox'].innerHTML = `
      <div class="email-placeholder">
        <svg class="email-placeholder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <p class="email-placeholder__text">Inbox is empty. Waiting for emails...</p>
      </div>
    `;
    this.elements['inbox-count-badge'].textContent = "0";
  }

  renderHistory() {
    const historyElement = this.elements['email-history-list'];
    if (!historyElement) return;

    if (this.state.emailHistory.length === 0) {
      historyElement.innerHTML = `
        <div class="email-placeholder">
          <svg class="email-placeholder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <p class="email-placeholder__text">No emails generated yet</p>
        </div>
      `;
      return;
    }

    const currentEmail = this.state.currentEmail;
    const html = this.state.emailHistory.map((email) => {
      const isCurrent = email === currentEmail;
      
      return `
        <a class="email-history-item ${isCurrent ? 'email-history-item--current' : ''}" data-email="${email}">
          <svg class="email-history-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span class="email-history-item__text">${email}</span>
          ${isCurrent ? '<svg class="email-history-item__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        </a>
      `;
    }).join('');

    historyElement.innerHTML = html;

    // Add click handlers for history items
    historyElement.querySelectorAll(".email-history-item").forEach(item => {
      this.addEvent(item, 'click', async (e) => {
        const email = e.currentTarget.getAttribute("data-email");
        await this.switchToEmail(email);
      });
    });
  }

  // ==================== UTILITIES ====================

  async syncEmailHistory() {
    try {
      const result = await window.tempmailAPI.show({ action: 'available' });
      
      if (result.success && result.emails) {
        this.state.emailHistory = [...result.emails];
        
        // Limit to 10 most recent
        if (this.state.emailHistory.length > 10) {
          this.state.emailHistory = this.state.emailHistory.slice(0, 10);
        }
        
        this.renderHistory();
      }
    } catch (error) {
      this.log('debug', 'History sync failed:', error.message);
    }
  }

  async switchToEmail(email) {
    await this.run(async () => {
      this.updateState({ status: 'loading' });
      
      const result = await this.tempmailService.switchToEmail(email);
      
      if (result.success && result.email) {
        this.updateState({ 
          currentEmail: result.email,
          status: 'ready',
          inbox: []
        });
        
        // Sync history from Chrome
        await this.syncEmailHistory();
        
        this.notify('success', `Switched to ${result.email}`);
        
        // Auto check inbox after switch
        setTimeout(() => this.handleCheckInbox(true), 500);
      } else {
        this.updateState({ status: 'ready' }); // Reset loading state
        this.notify('error', result.message || "Failed to switch email");
      }
    }, 'Switching email...');
  }

  async showEmailDetail(emailId) {
    // Prevent multiple simultaneous requests for the same email
    if (this.currentlyOpeningEmail === emailId) {
      this.log('warn', `Already opening email ${emailId}, skipping...`);
      return;
    }
    
    this.currentlyOpeningEmail = emailId;
    this.log('info', `📖 Opening email detail: ${emailId}`);
    
    const modal = this.elements['email-detail-modal'];
    const subjectEl = this.elements['email-detail-subject'];
    const bodyEl = this.elements['email-detail-body'];

    if (!modal || !subjectEl || !bodyEl) {
      this.log('error', 'Email detail modal elements not found');
      this.notify('error', 'Email modal not available');
      this.currentlyOpeningEmail = null;
      return;
    }

    modal.style.display = 'flex';
    modal.classList.add('email-detail-modal--active');
    bodyEl.innerHTML = '<p class="placeholder">Loading email...</p>';

    try {
      const result = await this.tempmailService.readEmail(emailId);
      
      if (result.success && result.email) {
        const email = result.email;
        subjectEl.textContent = email.subject || "(No Subject)";
        
        let bodyHtml = `
          <div class="email-detail__meta">
            <div class="email-detail__meta-item">
              <span class="email-detail__meta-label">From:</span>
              <span class="email-detail__meta-value">${email.from || email.sender || "Unknown"}</span>
            </div>
            <div class="email-detail__meta-item">
              <span class="email-detail__meta-label">Date:</span>
              <span class="email-detail__meta-value">${email.date || email.time || "Unknown"}</span>
            </div>
            ${email.to ? `
              <div class="email-detail__meta-item">
                <span class="email-detail__meta-label">To:</span>
                <span class="email-detail__meta-value">${email.to}</span>
              </div>
            ` : ''}
            ${email.otp ? `
              <div class="email-detail__otp-section">
                <div class="email-detail__otp-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                OTP CODE
              </div>
                <div class="email-detail__otp-code">${email.otp}</div>
                <button class="email-detail__otp-copy" onclick="navigator.clipboard.writeText('${email.otp}').then(() => alert('OTP copied to clipboard!'))">
                  📋 Copy OTP
                </button>
          </div>
            ` : ''}
          </div>
          <div class="email-detail__content">
            ${email.body || email.html || email.text || "No content available"}
          </div>
        `;
        
        bodyEl.innerHTML = bodyHtml;
        this.log('success', `✅ Email ${emailId} loaded successfully`);
      } else {
        bodyEl.innerHTML = '<p class="text-danger">Failed to load email content</p>';
      }
    } catch (error) {
      this.log('error', 'Error loading email detail:', error);
      bodyEl.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    } finally {
      this.currentlyOpeningEmail = null;
    }
  }

  // ==================== REAL-TIME SYNC ====================

  setupRealTimeSync() {
    // 1. Tab visibility change - sync when user comes back to tab
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.state.currentEmail) {
        setTimeout(() => this.syncCurrentEmail(), 500);
      }
    });

    // 2. Window focus - sync when user focuses window
    window.addEventListener('focus', () => {
      if (this.state.currentEmail) {
        setTimeout(() => this.syncCurrentEmail(), 300);
      }
    });

    this.startPeriodicSync();
  }

  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.state.currentEmail && !document.hidden) {
        this.syncCurrentEmail();
      }
    }, 10000); // Sync every 10 seconds (less frequent)

    this.log('info', 'Periodic sync started (every 10 seconds)');
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
          this.log('info', `🔄 Email changed in Chrome: ${result.email}`);
          this.updateState({ 
            currentEmail: result.email,
            status: 'ready'
          });
          await this.syncEmailHistory();
          
          // Show notification only for significant changes
          this.notify('info', `Email synced: ${result.email}`);
        }
      }
    } catch (error) {
      // Silently fail to avoid spam
      this.log('debug', 'Sync failed:', error.message);
    }
  }

  // ==================== ERROR HANDLING ====================

  handleServiceError(result) {
    const message = result.message || "Service error occurred";
    
    if (message.includes('ERR_ABORTED')) {
      this.notify('error', 'Unable to connect to tempmail service. Please try again later.');
    } else if (message.includes('timeout')) {
      this.notify('error', 'Connection timeout. Please try again.');
    } else {
      this.notify('error', message);
    }
  }

  handleInboxError(result, silent) {
    const message = result.message || "Failed to check inbox";
    
    if (message.includes('ERR_ABORTED') || 
        message.includes('No email generated yet') ||
        message.includes('Navigating frame was detached') ||
        message.includes('Failed to recover browser session')) {
      this.renderEmptyInbox();
      if (!silent) {
        this.notify('info', 'Browser connection issue - inbox will refresh automatically');
      }
    } else if (message.includes('timeout')) {
      this.renderEmptyInbox();
      if (!silent) {
        this.notify('error', 'Connection timeout');
      }
    } else {
      if (!silent) {
        this.notify('error', message);
      }
    }
  }

  showGenerationSuccess(result, username, domain) {
    if (username && domain && result.email !== `${username}@${domain}`) {
      this.notify('success', `Email created: ${result.email}`);
    } else {
      this.notify('success', "Email generated successfully!");
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

  // ==================== ROUTE ACTIVATION ====================

  /**
   * Called when route enters - sync email if available
   */
  async onRouteEnter() {
    // Only sync if we have an email and haven't synced recently
    if (this.state.currentEmail && !this.isCurrentlySyncing) {
      this.isCurrentlySyncing = true;
      
      setTimeout(async () => {
        try {
          await this.syncCurrentEmail();
        } finally {
          this.isCurrentlySyncing = false;
        }
      }, 500);
    }
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
  // Prevent multiple initialization - return existing if available
  if (window.tempmailController && !window.tempmailController.isDestroyed) {
    console.log('ℹ️ Tempmail controller already initialized, returning existing...');
    return window.tempmailController;
  }

  try {
    // Cleanup existing controller if any
    if (window.tempmailController) {
      window.tempmailController.destroy();
    }

    console.log('🎮 Creating new Tempmail controller...');
    const controller = new TempmailController();
    await controller.init();
    
    // Store reference for cleanup if needed
    window.tempmailController = controller;
    console.log('✅ Tempmail controller initialized');
    return controller;
  } catch (error) {
    console.error('❌ Failed to initialize Tempmail controller:', error);
    console.error('❌ Failed to initialize temporary email functionality.');
    return null;
  }
}

// Export for compatibility
window.TempmailInit = { init: initTempmailTab };