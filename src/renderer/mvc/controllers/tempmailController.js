/**
 * Tempmail Tab Controller (Modular Version)
 * Handles temporary email operations using BaseController pattern
 */

class TempmailController extends BaseController {
  constructor() {
    super('Tempmail', { logLevel: 'info' });
    this.selectedDomain = "";
    this.autoRefreshInterval = null;
    this.emailHistory = [];
  }

  async onInit() {
    // Setup UI elements and event listeners
    this.setupElements();
    this.setupEventListeners();
    
    // Auto scrape existing email when tab loads
    await this.autoScrapeExistingEmail();
  }

  setupElements() {
    this.elements = this.getElements([
      'new-email-btn', 'random-email-btn', 'check-inbox-btn', 
      'delete-email-btn', 'copy-email-btn', 'auto-refresh-checkbox',
      'tempmail-email-display', 'tempmail-inbox', 'inbox-count-badge',
      'email-history-list', 'create-email-modal', 'close-create-modal',
      'domain-input', 'domain-dropdown', 'username-input', 'create-email-btn',
      'email-detail-modal', 'close-email-modal', 'email-detail-subject', 'email-detail-body'
    ]);
  }

  setupEventListeners() {
    // Main action buttons
    this.addEventListener(this.elements['new-email-btn'], 'click', () => this.showCreateModal());
    this.addEventListener(this.elements['random-email-btn'], 'click', () => this.generateRandomEmail());
    this.addEventListener(this.elements['check-inbox-btn'], 'click', () => this.checkInbox(false));
    this.addEventListener(this.elements['delete-email-btn'], 'click', () => this.deleteEmail());
    this.addEventListener(this.elements['copy-email-btn'], 'click', () => this.copyCurrentEmail());

    // Modal handlers
    this.addEventListener(this.elements['close-create-modal'], 'click', () => this.hideCreateModal());
    this.addEventListener(this.elements['create-email-btn'], 'click', () => this.createCustomEmail());
    this.addEventListener(this.elements['close-email-modal'], 'click', () => this.hideEmailModal());

    // Domain dropdown
    this.addEventListener(this.elements['domain-input'], 'click', (e) => this.toggleDomainDropdown(e));
    this.addEventListener(this.elements['username-input'], 'keypress', (e) => {
      if (e.key === 'Enter') this.createCustomEmail();
    });

    // Auto refresh
    this.addEventListener(this.elements['auto-refresh-checkbox'], 'change', (e) => this.toggleAutoRefresh(e));

    // Setup domain options and modal backdrop clicks
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
      this.addEventListener(createBackdrop, 'click', () => this.hideCreateModal());
    }
    if (emailBackdrop) {
      this.addEventListener(emailBackdrop, 'click', () => this.hideEmailModal());
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

  // Modal Management
  showCreateModal() {
    this.elements['create-email-modal'].style.display = "flex";
    this.elements['domain-input'].value = "";
    this.elements['username-input'].value = "";
    this.selectedDomain = "";
  }

  hideCreateModal() {
    this.elements['create-email-modal'].style.display = "none";
    this.elements['domain-dropdown'].style.display = "none";
  }

  hideEmailModal() {
    this.elements['email-detail-modal'].style.display = "none";
  }

  toggleDomainDropdown(e) {
    e.stopPropagation();
    const dropdown = this.elements['domain-dropdown'];
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
  }

  // Email Generation
  async generateRandomEmail() {
    await this.generateEmailWithUsername(null, null);
  }

  async createCustomEmail() {
    const username = this.elements['username-input'].value.trim();
    
    if (!this.selectedDomain) {
      return this.showError("Please select a domain");
    }
    if (!username) {
      return this.showError("Please enter a username");
    }

    this.hideCreateModal();
    await this.generateEmailWithUsername(username, this.selectedDomain);
  }

  async generateEmailWithUsername(username = null, domain = null) {
    await this.safeAsync(async () => {
      // Clear previous email
      await window.tempmailAPI.clear();
      
      this.setGeneratingState();
      this.stopAutoRefresh();
      
      let result;
      if (username && domain) {
        const customEmail = `${username}@${domain}`;
        result = await window.tempmailAPI.generateEmail(domain, customEmail);
      } else {
        result = await window.tempmailAPI.generateEmail(null, null);
      }
      
      if (result.success && result.email) {
        this.setEmailGenerated(result.email);
        this.addToHistory(result.email);
        this.showGenerationSuccess(result, username, domain);
      } else {
        this.setEmailFailed();
        this.showError(result.message || "Failed to generate email - please try again");
      }
    }, 'Failed to generate email');
  }

  async autoScrapeExistingEmail() {
    try {
      this.setLoadingState();
      this.log('info', 'Auto-scraping existing email on tab load...');
      
      const existingResult = await window.tempmailAPI.scrapeExisting();
      
      if (existingResult.success && existingResult.email) {
        this.log('success', 'Found existing email:', existingResult.email);
        this.setEmailGenerated(existingResult.email);
        this.addToHistory(existingResult.email);
        this.setEmptyInbox();
        
        // Auto check inbox after getting existing email
        setTimeout(() => this.checkInbox(true), 1000);
      } else {
        this.log('warn', 'No existing email found');
        this.setNoEmailState();
      }
    } catch (error) {
      this.log('error', 'Error auto-scraping existing email:', error);
      this.setNoEmailState();
    }
  }

  // Email Management
  async copyCurrentEmail() {
    const email = this.elements['tempmail-email-display'].textContent;
    if (email && email !== "Click 'Random' to generate email" && email !== "Generating...") {
      await this.copyToClipboard(email, 'Email');
    }
  }

  async deleteEmail() {
    const email = this.elements['tempmail-email-display'].textContent;
    if (!email || email === "Click 'Random' to generate email" || email === "Generating...") {
      return this.showError("No email to delete");
    }

    const confirmed = await window.dialog.confirm(
      `Delete email: ${email}?`,
      "Delete Email",
      true
    );

    if (!confirmed) return;

    await this.safeAsync(async () => {
      const result = await window.tempmailAPI.deleteEmail();
      
      if (result.success) {
        // Remove from history
        this.emailHistory = this.emailHistory.filter(e => e !== result.deletedEmail);
        this.renderHistory();

        // Reset UI
        this.setNoEmailState();
        this.showSuccess(result.message);
      } else {
        this.showError(result.message || "Failed to delete email");
      }
    }, 'Failed to delete email');
  }

  // Inbox Management
  async checkInbox(silent = false) {
    if (!silent) this.showLoading();
    
    try {
      const result = await window.tempmailAPI.checkInbox();
      
      if (result.success && result.emails && result.emails.length > 0) {
        this.renderInbox(result.emails);
        this.elements['inbox-count-badge'].textContent = result.emails.length.toString();
        
        if (!silent) this.showSuccess(`Found ${result.emails.length} email(s)!`);
      } else if (result.success) {
        this.setEmptyInbox();
        if (!silent) this.showSuccess("Inbox checked - no new emails");
      } else {
        if (!silent) this.showError(result.message || "Failed to check inbox");
      }
    } catch (error) {
      if (!silent) this.showError(`Error: ${error.message}`);
    } finally {
      if (!silent) this.hideLoading();
    }
  }

  toggleAutoRefresh(e) {
    if (e.target.checked) {
      this.autoRefreshInterval = setInterval(() => {
        if (!this.elements['check-inbox-btn'].disabled) {
          this.checkInbox(true);
        }
      }, 10000);
      this.showSuccess("Auto-refresh enabled (every 10s)");
    } else {
      this.stopAutoRefresh();
      this.showSuccess("Auto-refresh disabled");
    }
  }

  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
      this.elements['auto-refresh-checkbox'].checked = false;
    }
  }

  // UI State Management
  setLoadingState() {
    this.elements['tempmail-email-display'].textContent = "Loading existing email...";
    this.elements['copy-email-btn'].style.display = "none";
    this.elements['check-inbox-btn'].disabled = true;
    this.setLoadingInbox();
    this.elements['inbox-count-badge'].textContent = "0";
  }

  setGeneratingState() {
    this.elements['tempmail-email-display'].textContent = "Generating...";
    this.elements['copy-email-btn'].style.display = "none";
    this.elements['check-inbox-btn'].disabled = true;
    this.setGeneratingInbox();
    this.elements['inbox-count-badge'].textContent = "0";
  }

  setEmailGenerated(email) {
    this.elements['tempmail-email-display'].textContent = email;
    this.elements['copy-email-btn'].style.display = "flex";
    this.elements['check-inbox-btn'].disabled = false;
    this.elements['delete-email-btn'].disabled = false;
  }

  setEmailFailed() {
    this.elements['tempmail-email-display'].textContent = "Failed to generate email";
    this.elements['copy-email-btn'].style.display = "none";
    this.elements['check-inbox-btn'].disabled = true;
    this.elements['delete-email-btn'].disabled = true;
  }

  setNoEmailState() {
    this.elements['tempmail-email-display'].textContent = "Click 'Random' to generate email";
    this.elements['copy-email-btn'].style.display = "none";
    this.elements['check-inbox-btn'].disabled = true;
    this.elements['delete-email-btn'].disabled = true;
    this.setNoEmailInbox();
    this.elements['inbox-count-badge'].textContent = "0";
  }

  setLoadingInbox() {
    this.elements['tempmail-inbox'].innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>Loading existing email...</p></div>';
  }

  setGeneratingInbox() {
    this.elements['tempmail-inbox'].innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>Generating email...</p></div>';
  }

  setEmptyInbox() {
    this.elements['tempmail-inbox'].innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>Inbox is empty. Waiting for emails...</p></div>';
    this.elements['inbox-count-badge'].textContent = "0";
  }

  setNoEmailInbox() {
    this.elements['tempmail-inbox'].innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 60px 20px; color: var(--text-muted);"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px; opacity: 0.3;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><p style="font-size: 14px;">Click Random to generate an email</p></div>';
  }

  showGenerationSuccess(result, username, domain) {
    if (username && domain && result.email !== `${username}@${domain}`) {
      this.showSuccess(`Email created: ${result.email}`);
    } else if (result.isOffline && !username) {
      this.showSuccess("Email generated (offline mode)");
    } else {
      this.showSuccess("Email generated successfully!");
    }
  }

  // History Management
  addToHistory(email) {
    if (!this.emailHistory.includes(email)) {
      this.emailHistory.unshift(email);
      if (this.emailHistory.length > 10) {
        this.emailHistory = this.emailHistory.slice(0, 10);
      }
      this.renderHistory();
    }
  }

  renderHistory() {
    const historyElement = this.elements['email-history-list'];
    if (!historyElement) return;

    if (this.emailHistory.length === 0) {
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

    const currentEmail = this.elements['tempmail-email-display'].textContent;
    const html = this.emailHistory.map((email, index) => {
      const isLast = index === this.emailHistory.length - 1;
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

  async switchToEmail(email) {
    await this.safeAsync(async () => {
      const result = await window.tempmailAPI.switchToEmail(email);
      
      if (result.success && result.email) {
        this.setEmailGenerated(result.email);
        this.setEmptyInbox();
        this.showSuccess(`Switched to ${result.email}`);
        
        // Auto check inbox after switch
        setTimeout(() => this.checkInbox(true), 500);
      } else {
        this.showError(result.message || "Failed to switch email");
      }
    }, 'Failed to switch email');
  }

  // Inbox Rendering
  renderInbox(emails) {
    if (!emails.length) {
      this.setEmptyInbox();
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
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  async showEmailDetail(emailId) {
    const modal = this.elements['email-detail-modal'];
    const subjectEl = this.elements['email-detail-subject'];
    const bodyEl = this.elements['email-detail-body'];

    modal.style.display = "flex";
    bodyEl.innerHTML = '<p class="placeholder">Loading email...</p>';

    try {
      const result = await window.tempmailAPI.readEmail(emailId);
      
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

  onDestroy() {
    // Clean up auto refresh interval
    this.stopAutoRefresh();
  }
}

// Initialize controller
async function initTempmailTab() {
  try {
    const controller = new TempmailController();
    await controller.init();
    
    // Store reference for cleanup if needed
    window.tempmailController = controller;
  } catch (error) {
    console.error('❌ Failed to initialize Tempmail controller:', error);
    window.Utils?.showError('Failed to initialize temporary email functionality.');
  }
}

// Export for compatibility
window.TempmailInit = { init: initTempmailTab };
