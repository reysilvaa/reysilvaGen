/**
 * Tempmail Tab Initialization
 */

function initTempmailTab() {
  const newEmailBtn = document.getElementById("new-email-btn");
  const randomEmailBtn = document.getElementById("random-email-btn");
  const checkInboxBtn = document.getElementById("check-inbox-btn");
  const deleteEmailBtn = document.getElementById("delete-email-btn");
  const copyEmailBtn = document.getElementById("copy-email-btn");
  const autoRefreshCheckbox = document.getElementById("auto-refresh-checkbox");
  const emailDisplay = document.getElementById("tempmail-email-display");
  const inboxDiv = document.getElementById("tempmail-inbox");
  const inboxBadge = document.getElementById("inbox-count-badge");
  const emailHistoryList = document.getElementById("email-history-list");

  // Modal elements
  const createModal = document.getElementById("create-email-modal");
  const closeCreateModal = document.getElementById("close-create-modal");
  const domainInput = document.getElementById("domain-input");
  const domainDropdown = document.getElementById("domain-dropdown");
  const usernameInput = document.getElementById("username-input");
  const createEmailBtn = document.getElementById("create-email-btn");

  let selectedDomain = "";
  let autoRefreshInterval = null;
  let emailHistory = [];
  const utils = window.Utils;

  // Auto scrape existing email when tab loads
  autoScrapeExistingEmail();

  // Modal handlers
  newEmailBtn?.addEventListener("click", () => {
    createModal.style.display = "flex";
    domainInput.value = "";
    usernameInput.value = "";
    selectedDomain = "";
  });

  closeCreateModal?.addEventListener("click", () => {
    createModal.style.display = "none";
  });

  createModal?.querySelector(".modal-backdrop")?.addEventListener("click", () => {
    createModal.style.display = "none";
  });

  // Domain dropdown
  domainInput?.addEventListener("click", (e) => {
    e.stopPropagation();
    domainDropdown.style.display = domainDropdown.style.display === "none" ? "block" : "none";
  });

  document.querySelectorAll(".domain-option").forEach(option => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedDomain = e.currentTarget.getAttribute("data-domain");
      domainInput.value = selectedDomain;
      domainDropdown.style.display = "none";
    });
  });

  document.addEventListener("click", (e) => {
    if (domainDropdown && domainDropdown.style.display === "block") {
      if (!domainDropdown.contains(e.target) && e.target !== domainInput) {
        domainDropdown.style.display = "none";
      }
    }
  });

  // Create email handler
  const createEmailHandler = async () => {
    const username = usernameInput.value.trim();
    
    if (!selectedDomain) {
      utils.showError("Please select a domain");
      return;
    }

    if (!username) {
      utils.showError("Please enter a username");
      return;
    }

    createModal.style.display = "none";
    domainDropdown.style.display = "none";
    await generateEmailWithUsername(username, selectedDomain);
  };

  createEmailBtn?.addEventListener("click", createEmailHandler);

  usernameInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      createEmailHandler();
    }
  });

  randomEmailBtn?.addEventListener("click", async () => {
    await generateEmailWithUsername(null, null);
  });

  // Auto scrape existing email when tab loads
  async function autoScrapeExistingEmail() {
    try {
      emailDisplay.textContent = "Loading existing email...";
      copyEmailBtn.style.display = "none";
      checkInboxBtn.disabled = true;
      inboxDiv.innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>Loading existing email...</p></div>';
      inboxBadge.textContent = "0";
      
      console.log('🔍 Auto-scraping existing email on tab load...');
      const existingResult = await window.tempmailAPI.scrapeExisting();
      
      if (existingResult.success && existingResult.email) {
        console.log('✅ Found existing email:', existingResult.email);
        
        emailDisplay.textContent = existingResult.email;
        copyEmailBtn.style.display = "flex";
        checkInboxBtn.disabled = false;
        deleteEmailBtn.disabled = false;
        
        addToHistory(existingResult.email);
        
        inboxDiv.innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>Inbox is empty. Waiting for emails...</p></div>';
        
        // Auto check inbox after getting existing email
        setTimeout(() => checkInbox(true), 1000);
      } else {
        console.log('⚠️ No existing email found');
        emailDisplay.textContent = "Click 'Random' to generate email";
        inboxDiv.innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 60px 20px; color: var(--text-muted);"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px; opacity: 0.3;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><p style="font-size: 14px;">Click Random to generate an email</p></div>';
      }
    } catch (error) {
      console.error('❌ Error auto-scraping existing email:', error);
      emailDisplay.textContent = "Click 'Random' to generate email";
      inboxDiv.innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 60px 20px; color: var(--text-muted);"><p>Click Random to generate an email</p></div>';
    }
  }

  // Generate email function
  async function generateEmailWithUsername(username = null, domain = null) {
    utils.showLoading();
    
    try {
      await window.tempmailAPI.clear();
      
      emailDisplay.textContent = "Generating...";
      copyEmailBtn.style.display = "none";
      checkInboxBtn.disabled = true;
      inboxDiv.innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>Generating email...</p></div>';
      inboxBadge.textContent = "0";
      
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        document.getElementById("auto-refresh-checkbox").checked = false;
      }
      
      let result;
      if (username && domain) {
        const customEmail = `${username}@${domain}`;
        result = await window.tempmailAPI.generateEmail(domain, customEmail);
      } else {
        result = await window.tempmailAPI.generateEmail(null, null);
      }
      
      if (result.success && result.email) {
        emailDisplay.textContent = result.email;
        copyEmailBtn.style.display = "flex";
        checkInboxBtn.disabled = false;
        deleteEmailBtn.disabled = false;
        
        addToHistory(result.email);
        
        inboxDiv.innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>Inbox is empty. Waiting for emails...</p></div>';
        
        if (username && domain && result.email !== `${username}@${domain}`) {
          utils.showSuccess(`Email created: ${result.email}`);
        } else if (result.isOffline && !username) {
          utils.showSuccess("Email generated (offline mode)");
        } else {
          utils.showSuccess("Email generated successfully!");
        }
      } else {
        emailDisplay.textContent = "Failed to generate email";
        copyEmailBtn.style.display = "none";
        checkInboxBtn.disabled = true;
        deleteEmailBtn.disabled = true;
        utils.showError(result.message || "Failed to generate email - please try again");
      }
    } catch (error) {
      utils.showError(`Error: ${error.message}`);
    } finally {
      utils.hideLoading();
    }
  }

  // History functions
  function addToHistory(email) {
    if (!emailHistory.includes(email)) {
      emailHistory.unshift(email);
      if (emailHistory.length > 10) {
        emailHistory = emailHistory.slice(0, 10);
      }
      renderHistory();
    }
  }

  function renderHistory() {
    if (emailHistory.length === 0) {
      emailHistoryList.innerHTML = `
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

    let html = "";
    const currentEmail = emailDisplay.textContent;
    emailHistory.forEach((email, index) => {
      const isLast = index === emailHistory.length - 1;
      const isCurrent = email === currentEmail;
      html += `
        <a class="email-history-item" data-email="${email}" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; color: var(--text-primary); cursor: pointer; transition: var(--transition-fast); font-size: 13px; ${!isLast ? 'border-bottom: 1px solid var(--border);' : ''} font-family: var(--font-mono); font-weight: 500; ${isCurrent ? 'background: var(--bg-hover); border-left: 3px solid var(--accent);' : ''}" onmouseover="if(!this.style.borderLeft.includes('3px')) this.style.background='var(--bg-hover)'" onmouseout="if(!this.style.borderLeft.includes('3px')) this.style.background='transparent'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isCurrent ? 'var(--accent)' : 'var(--text-secondary)'}" stroke-width="2" style="flex-shrink: 0;">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${email}</span>
          ${isCurrent ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="3" style="flex-shrink: 0;"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        </a>
      `;
    });

    emailHistoryList.innerHTML = html;

    document.querySelectorAll(".email-history-item").forEach(item => {
      item.addEventListener("click", async (e) => {
        const email = e.currentTarget.getAttribute("data-email");
        await switchToEmail(email);
      });
    });
  }

  async function switchToEmail(email) {
    utils.showLoading();
    try {
      // 🚀 FAST SWITCH - langsung ke URL /switch/email
      const result = await window.tempmailAPI.switchToEmail(email);
      
      if (result.success && result.email) {
        emailDisplay.textContent = result.email;
        copyEmailBtn.style.display = "flex";
        checkInboxBtn.disabled = false;
        deleteEmailBtn.disabled = false;
        
        inboxDiv.innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>Inbox is empty. Waiting for emails...</p></div>';
        inboxBadge.textContent = "0";
        
        utils.showSuccess(`Switched to ${result.email}`);
        
        // Auto check inbox setelah switch
        setTimeout(() => checkInbox(true), 500);
      } else {
        utils.showError(result.message || "Failed to switch email");
      }
    } catch (error) {
      utils.showError(`Error: ${error.message}`);
    } finally {
      utils.hideLoading();
    }
  }

  // Inbox functions
  async function checkInbox(silent = false) {
    if (!silent) utils.showLoading();
    
    try {
      const result = await window.tempmailAPI.checkInbox();
      
      if (result.success && result.emails && result.emails.length > 0) {
        renderInbox(result.emails);
        inboxBadge.textContent = result.emails.length.toString();
        
        if (!silent) utils.showSuccess(`Found ${result.emails.length} email(s)!`);
      } else if (result.success) {
        inboxDiv.innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>Inbox is empty. Waiting for emails...</p></div>';
        inboxBadge.textContent = "0";
        if (!silent) utils.showSuccess("Inbox checked - no new emails");
      } else {
        if (!silent) utils.showError(result.message || "Failed to check inbox");
      }
    } catch (error) {
      if (!silent) utils.showError(`Error: ${error.message}`);
    } finally {
      if (!silent) utils.hideLoading();
    }
  }

  checkInboxBtn?.addEventListener("click", () => checkInbox(false));

  copyEmailBtn?.addEventListener("click", async () => {
    const email = emailDisplay.textContent;
    if (email && email !== "Click 'Generate' to get started" && email !== "Generating...") {
      await navigator.clipboard.writeText(email);
      utils.showSuccess("Email copied to clipboard!");
    }
  });

  deleteEmailBtn?.addEventListener("click", async () => {
    const email = emailDisplay.textContent;
    if (!email || email === "Click 'Generate' to get started" || email === "Generating...") {
      return utils.showError("No email to delete");
    }

    const confirmed = await window.dialog.confirm(
      `Delete email: ${email}?`,
      "Delete Email",
      true
    );

    if (!confirmed) return;

    utils.showLoading();
    try {
      const result = await window.tempmailAPI.deleteEmail();
      
      if (result.success) {
        // Remove from history
        emailHistory = emailHistory.filter(e => e !== result.deletedEmail);
        localStorage.setItem('tempmailHistory', JSON.stringify(emailHistory));
        renderHistory();

        // Reset UI
        emailDisplay.textContent = "Click 'Generate' to get started";
        copyEmailBtn.style.display = "none";
        checkInboxBtn.disabled = true;
        deleteEmailBtn.disabled = true;
        inboxDiv.innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>No emails generated yet</p></div>';
        inboxBadge.textContent = "0";

        utils.showSuccess(result.message);
      } else {
        utils.showError(result.message || "Failed to delete email");
      }
    } catch (error) {
      utils.showError(`Error: ${error.message}`);
    } finally {
      utils.hideLoading();
    }
  });


  autoRefreshCheckbox?.addEventListener("change", (e) => {
    if (e.target.checked) {
      autoRefreshInterval = setInterval(() => {
        if (!checkInboxBtn.disabled) {
          checkInbox(true);
        }
      }, 10000);
      utils.showSuccess("Auto-refresh enabled (every 10s)");
    } else {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
      }
      utils.showSuccess("Auto-refresh disabled");
    }
  });

  function renderInbox(emails) {
    if (!emails.length) {
      inboxDiv.innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>No emails found</p></div>';
      return;
    }

    const emailsHTML = emails.map(email => {
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
    }).join('');

    inboxDiv.innerHTML = emailsHTML;

    // Add click handlers
    document.querySelectorAll(".email-item").forEach(item => {
      item.addEventListener("click", () => showEmailDetail(item.dataset.id));
    });
  }

  async function showEmailDetail(emailId) {
    const modal = document.getElementById("email-detail-modal");
    const subjectEl = document.getElementById("email-detail-subject");
    const bodyEl = document.getElementById("email-detail-body");

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

  document.getElementById("close-email-modal")?.addEventListener("click", () => {
    document.getElementById("email-detail-modal").style.display = "none";
  });

  document.querySelector("#email-detail-modal .modal-backdrop")?.addEventListener("click", () => {
    document.getElementById("email-detail-modal").style.display = "none";
  });
}

window.TempmailInit = { init: initTempmailTab };

