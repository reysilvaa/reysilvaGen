/**
 * Application Initialization
 * Simple, Clean, DRY
 */

(function () {
  "use strict";

  // Generators
  const generator = new CardGenerator();
  const nameGenerator = new NameGenerator();
  const csvLoader = new CSVLoader();
  const addressGenerator = new AddressGenerator(csvLoader);
  let csvLoaded = false;
  let availableBins = [];
  const utils = window.Utils;

  // ============= CSV Loading =============
  async function loadCSV() {
    try {
      await csvLoader.load("../assets/address/us-US.csv");
      csvLoaded = true;
      console.log(`✅ CSV loaded: ${csvLoader.getCount()} addresses`);
    } catch (error) {
      console.error("❌ CSV load failed:", error);
    }
  }

  // ============= BIN Management =============
  async function loadBins() {
    try {
      const result = await window.electron.getActiveBins();
      if (result.success) {
        availableBins = result.bins;
        populateBinSelects();
        console.log(`✅ Loaded ${availableBins.length} BINs`);
      }
    } catch (error) {
      console.error("❌ BIN load failed:", error);
    }
  }

  function populateBinSelects() {
    const binSelect = document.getElementById("bin-select");
    const combinedBinSelect = document.getElementById("combined-bin-select");

    if (!binSelect || !combinedBinSelect) return;

    if (availableBins.length === 0) {
      const msg =
        '<option value="">No BINs configured - Contact admin</option>';
      binSelect.innerHTML = msg;
      combinedBinSelect.innerHTML = msg;
      return;
    }

    const binsByType = {};
    availableBins.forEach((bin) => {
      const type = bin.card_type || "Other";
      if (!binsByType[type]) binsByType[type] = [];
      binsByType[type].push(bin);
    });

    let html = "";
    Object.keys(binsByType)
      .sort()
      .forEach((type) => {
        html += `<optgroup label="${type}">`;
        binsByType[type].forEach((bin) => {
          html += `<option value="${bin.bin_pattern}">${type}</option>`;
        });
        html += `</optgroup>`;
      });

    binSelect.innerHTML = html;
    combinedBinSelect.innerHTML = html;
  }

  // ============= Cards Tab =============
  function initCardsTab() {
    const generateBtn = document.getElementById("generate-btn");
    const saveBtn = document.getElementById("save-btn");
    const copyBtn = document.getElementById("copy-btn");
    const clearBtn = document.getElementById("clear-btn");

    generateBtn?.addEventListener("click", async () => {
      const binPattern = document.getElementById("bin-select").value.trim();
      if (!binPattern) return utils.showError("Please select a BIN pattern");

      const count = parseInt(document.getElementById("card-count").value);
      const length =
        document.getElementById("card-length").value === "auto"
          ? null
          : parseInt(document.getElementById("card-length").value);
      const cvvLength =
        document.getElementById("cvv-length").value === "auto"
          ? null
          : parseInt(document.getElementById("cvv-length").value);
      const yearsAhead = parseInt(document.getElementById("years-ahead").value);

      utils.showLoading();
      await new Promise((r) => setTimeout(r, 300));

      const cards = generator.generateBulk(binPattern, count, {
        length,
        cvvLength,
        yearsAhead,
      });

      const format = document.getElementById("output-format").value;
      const outputDiv = document.getElementById("cards-output");
      let html = "";

      if (format === "card") {
        // Card Visual Format
        cards.forEach((card, index) => {
          const expiry = `${card.exp_month}/${card.exp_year}`;
          const cardType = generator.detectCardType(binPattern).toLowerCase();
          const cardClass = `card-${cardType}`;
          const formattedNumber = card.number.match(/.{1,4}/g).join(" ");

          html += `
            <div class="card-item ${cardClass}" data-number="${
            card.number
          }" data-expiry="${expiry}" data-cvv="${card.cvv}">
              <div class="card-inner">
                <div class="card-item-header">
                  <span class="card-item-number">CARD #${index + 1}</span>
                  <span class="card-logo">${generator
                    .detectCardType(binPattern)
                    .toUpperCase()}</span>
                </div>
                
                <div class="card-chip"></div>
                
                <div class="card-number-display" onclick="copyToClipboard('${
                  card.number
                }', 'Card Number')" title="Click to copy">
                  <div class="card-number-label">Card Number</div>
                  <div class="card-number-value">${formattedNumber}</div>
                </div>
                
                <div class="card-details">
                  <div class="card-name-display" onclick="copyToClipboard('CARD HOLDER', 'Name')" title="Click to copy">
                    <div class="card-detail-label">Name</div>
                    <div class="card-name-value">CARD HOLDER</div>
                  </div>
                  
                  <div class="card-detail-item" onclick="copyToClipboard('${expiry}', 'Valid Thru')" title="Click to copy">
                    <div class="card-detail-label">Valid</div>
                    <div class="card-detail-value">${expiry}</div>
                  </div>
                  
                  <div class="card-detail-item" onclick="copyToClipboard('${
                    card.cvv
                  }', 'CVV')" title="Click to copy">
                    <div class="card-detail-label">CVV</div>
                    <div class="card-detail-value">${card.cvv}</div>
                  </div>
                </div>
              </div>
            </div>
          `;
        });
        outputDiv.className = "cards-display";
      } else {
        // Text Formats
        cards.forEach((card, index) => {
          const expiry = `${card.exp_month}/${card.exp_year}`;

          if (format === "pipe") {
            html += `${card.number}|${expiry.replace("/", "|")}|${card.cvv}\n`;
          } else if (format === "csv") {
            if (index === 0) html += "Card Number,Expiry,CVV\n";
            html += `${card.number},${expiry},${card.cvv}\n`;
          } else if (format === "json") {
            if (index === 0) html = "[\n";
            html += `  {"number": "${card.number}", "expMonth": "${card.exp_month}", "expYear": "${card.exp_year}", "cvv": "${card.cvv}"}`;
            html += index < cards.length - 1 ? ",\n" : "\n";
            if (index === cards.length - 1) html += "]";
          } else {
            // plain
            html += `${card.number}\n`;
          }
        });
        outputDiv.className = "cards-display text-format";
        html = `<pre style="margin: 0; color: var(--text-primary); font-family: var(--font-mono); font-size: 14px; line-height: 1.6;">${html}</pre>`;
      }

      outputDiv.innerHTML = html;
      document.getElementById("cards-generated").textContent = `${count} cards`;

      utils.hideLoading();
      utils.showSuccess(
        `Generated ${count} ${generator
          .detectCardType(binPattern)
          .toUpperCase()} cards!`
      );
    });

    saveBtn?.addEventListener("click", () => {
      const outputDiv = document.getElementById("cards-output");
      const format = document.getElementById("output-format").value;
      let content = "";

      if (format === "card") {
        // Extract from card visual format
        const cardItems = outputDiv.querySelectorAll(".card-item");
        if (cardItems.length === 0) return utils.showError("No cards to save");

        cardItems.forEach((item, index) => {
          const number = item.dataset.number;
          const expiry = item.dataset.expiry;
          const cvv = item.dataset.cvv;

          // Default to pipe format for card visual
          content += `${number}|${expiry.replace("/", "|")}|${cvv}\n`;
        });

        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ReysilvaGen-cards-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        utils.showSuccess("Cards saved successfully!");
      } else {
        // Text format - directly save
        const pre = outputDiv.querySelector("pre");
        if (!pre || !pre.textContent.trim())
          return utils.showError("No cards to save");

        content = pre.textContent;
        const ext =
          format === "json" ? "json" : format === "csv" ? "csv" : "txt";
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ReysilvaGen-cards-${Date.now()}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        utils.showSuccess("Cards saved successfully!");
      }
    });

    copyBtn?.addEventListener("click", async () => {
      const outputDiv = document.getElementById("cards-output");
      const format = document.getElementById("output-format").value;
      let content = "";

      if (format === "card") {
        // Extract from card visual format
        const cardItems = outputDiv.querySelectorAll(".card-item");
        if (cardItems.length === 0) return utils.showError("No cards to copy");

        cardItems.forEach((item) => {
          const number = item.dataset.number;
          const expiry = item.dataset.expiry;
          const cvv = item.dataset.cvv;

          // Default to pipe format for card visual
          content += `${number}|${expiry.replace("/", "|")}|${cvv}\n`;
        });
      } else {
        // Text format - directly copy
        const pre = outputDiv.querySelector("pre");
        if (!pre || !pre.textContent.trim())
          return utils.showError("No cards to copy");

        content = pre.textContent;
      }

      await navigator.clipboard.writeText(content);
      utils.showSuccess("Cards copied to clipboard!");
    });

    clearBtn?.addEventListener("click", () => {
      document.getElementById("cards-output").innerHTML =
        '<p class="placeholder">Click "Generate Cards" to create card numbers</p>';
      document.getElementById("cards-generated").textContent = "0 cards";
      document.getElementById("cards-output").className = "cards-display";
    });

    // Listen to format changes to re-render if cards exist
    const formatSelect = document.getElementById("output-format");
    formatSelect?.addEventListener("change", () => {
      const outputDiv = document.getElementById("cards-output");

      // Check if there are cards to re-render
      const hasCards =
        outputDiv.querySelector(".card-item") || outputDiv.querySelector("pre");

      if (hasCards) {
        // Trigger re-generate by clicking generate button
        const generateBtn = document.getElementById("generate-btn");
        if (generateBtn) generateBtn.click();
      }
    });
  }

  // ============= Address Tab =============
  function initAddressTab() {
    const fetchBtn = document.getElementById("fetch-address-btn");

    fetchBtn?.addEventListener("click", async () => {
      utils.showLoading();
      await new Promise((r) => setTimeout(r, 300));

      const includeName = document.getElementById(
        "include-name-checkbox"
      ).checked;
      const address = addressGenerator.generate({ includeName, nameGenerator });

      const fields = [];
      if (address.Name) fields.push({ label: "Name", value: address.Name });
      if (address.Email) fields.push({ label: "Email", value: address.Email });
      if (address.Phone) fields.push({ label: "Phone", value: address.Phone });
      fields.push({ label: "Street", value: address.Street });
      fields.push({ label: "City", value: address.City });
      fields.push({
        label: "State/Province",
        value: address["State/province/area"],
      });
      fields.push({ label: "ZIP Code", value: address["Zip code"] });

      let html = "";
      fields.forEach((f) => {
        html += `
          <div class="address-field clickable-field" onclick="copyToClipboard('${f.value.replace(
            /'/g,
            "\\'"
          )}', '${f.label}')" title="Click to copy ${f.label}">
            <strong>${f.label}</strong>
            <span>${f.value}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.5; margin-left: 8px;">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </div>
        `;
      });

      document.getElementById("address-output").innerHTML = html;
      utils.hideLoading();
      utils.showSuccess(
        csvLoaded
          ? `Address from real data! (${csvLoader.getCount()} available)`
          : "Address generated!"
      );
    });
  }

  window.copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      Utils.showSuccess(`${label} copied!`);
    } catch (error) {
      Utils.showError(`Failed to copy ${label}`);
    }
  };

  // ============= Combined Tab =============
  function initCombinedTab() {
    const generateBtn = document.getElementById("generate-combined-btn");

    generateBtn?.addEventListener("click", async () => {
      const binPattern = document
        .getElementById("combined-bin-select")
        .value.trim();
      if (!binPattern) return utils.showError("Please select a BIN pattern");

      const count = parseInt(document.getElementById("combined-count").value);

      utils.showLoading();
      await new Promise((r) => setTimeout(r, 400));

      const cards = generator.generateBulk(binPattern, count, {
        length: null,
        yearsAhead: 5,
      });
      const address = addressGenerator.generate({
        includeName: true,
        nameGenerator,
      });

      let output =
        "=".repeat(60) + "\n  GENERATED TEST CARDS\n" + "=".repeat(60) + "\n\n";
      output += utils.formatCards(cards, "pipe") + "\n\n";
      output +=
        "=".repeat(60) +
        "\n  PERSON & ADDRESS INFORMATION\n" +
        "=".repeat(60) +
        "\n\n";

      if (address.Name) output += `Name: ${address.Name}\n`;
      if (address.Email) output += `Email: ${address.Email}\n`;
      if (address.Phone) output += `Phone: ${address.Phone}\n\n`;
      output += `Street: ${address.Street}\n`;
      output += `City: ${address.City}\n`;
      output += `State: ${address["State/province/area"]}\n`;
      output += `ZIP Code: ${address["Zip code"]}\n\n`;
      output +=
        "=".repeat(60) +
        "\nWARNING: For testing only. Real transactions are illegal.";

      document.getElementById("combined-output").value = output;
      utils.hideLoading();
      utils.showSuccess(`Generated ${count} cards with address!`);
    });
  }

  // ============= Tempmail Tab =============
  let autoRefreshInterval = null;

  function initTempmailTab() {
    const generateBtn = document.getElementById("generate-email-btn");
    const checkInboxBtn = document.getElementById("check-inbox-btn");
    const copyEmailBtn = document.getElementById("copy-email-btn");
    const autoRefreshCheckbox = document.getElementById("auto-refresh-checkbox");
    const domainSelect = document.getElementById("email-domain-select");
    const emailDisplay = document.getElementById("tempmail-email-display");
    const inboxDiv = document.getElementById("tempmail-inbox");
    const inboxBadge = document.getElementById("inbox-count-badge");

    // Generate Email
    generateBtn?.addEventListener("click", async () => {
      utils.showLoading();
      
      try {
        // Clear window lama terlebih dahulu
        await window.tempmailAPI.clear();
        
        // Clear UI
        emailDisplay.textContent = "Generating...";
        copyEmailBtn.style.display = "none";
        checkInboxBtn.disabled = true;
        inboxDiv.innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>Generating email...</p></div>';
        inboxBadge.textContent = "0";
        hideOTP();
        
        // Stop auto-refresh if running
        if (autoRefreshInterval) {
          clearInterval(autoRefreshInterval);
          autoRefreshInterval = null;
          document.getElementById("auto-refresh-checkbox").checked = false;
        }
        
        // Generate email baru dengan domain yang dipilih
        const selectedDomain = domainSelect?.value || 'oliq.me';
        const result = await window.tempmailAPI.generateEmail(selectedDomain);
        
        if (result.success || result.email) {
          emailDisplay.textContent = result.email;
          copyEmailBtn.style.display = "block";
          checkInboxBtn.disabled = false;
          
          // Update inbox placeholder
          inboxDiv.innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>Inbox is empty. Waiting for emails...</p></div>';
          
          if (result.isOffline) {
            utils.showError(result.message);
          } else {
            utils.showSuccess("✅ New email generated!");
          }
        } else {
          utils.showError(result.message || "Failed to generate email");
        }
      } catch (error) {
        utils.showError(`Error: ${error.message}`);
      } finally {
        utils.hideLoading();
      }
    });

    // Check Inbox
    async function checkInbox(silent = false) {
      if (!silent) utils.showLoading();
      
      try {
        const result = await window.tempmailAPI.checkInbox();
        
        if (result.success && result.emails && result.emails.length > 0) {
          renderInbox(result.emails);
          inboxBadge.textContent = result.emails.length.toString();
          
          // Check for OTP in any email
          const emailWithOTP = result.emails.find(email => email.otp);
          if (emailWithOTP) {
            showOTP(emailWithOTP.otp);
          }
          
          if (!silent) utils.showSuccess(`Found ${result.emails.length} email(s)!`);
        } else if (result.success) {
          inboxDiv.innerHTML = '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>Inbox is empty. Waiting for emails...</p></div>';
          inboxBadge.textContent = "0";
          hideOTP();
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

    // Copy Email
    copyEmailBtn?.addEventListener("click", async () => {
      const email = emailDisplay.textContent;
      if (email && email !== "Click 'Generate' to get started" && email !== "Generating...") {
        await navigator.clipboard.writeText(email);
        utils.showSuccess("Email copied to clipboard!");
      }
    });

    // Show OTP
    function showOTP(otp) {
      const otpDisplay = document.getElementById("otp-display");
      const otpCode = document.getElementById("otp-code");
      if (otpDisplay && otpCode) {
        otpCode.textContent = otp;
        otpDisplay.style.display = "block";
      }
    }

    // Hide OTP
    function hideOTP() {
      const otpDisplay = document.getElementById("otp-display");
      if (otpDisplay) {
        otpDisplay.style.display = "none";
      }
    }

    // Copy OTP
    document.getElementById("copy-otp-btn")?.addEventListener("click", async () => {
      const otpCode = document.getElementById("otp-code")?.textContent;
      if (otpCode && otpCode !== "------") {
        await navigator.clipboard.writeText(otpCode);
        utils.showSuccess("OTP copied to clipboard!");
      }
    });

    // Auto Refresh
    autoRefreshCheckbox?.addEventListener("change", (e) => {
      if (e.target.checked) {
        autoRefreshInterval = setInterval(() => {
          if (!checkInboxBtn.disabled) {
            checkInbox(true);
          }
        }, 10000); // 10 seconds
        utils.showSuccess("Auto-refresh enabled (every 10s)");
      } else {
        if (autoRefreshInterval) {
          clearInterval(autoRefreshInterval);
          autoRefreshInterval = null;
        }
        utils.showSuccess("Auto-refresh disabled");
      }
    });

    // Render Inbox
    function renderInbox(emails) {
      let html = "";
      
      emails.forEach((email, index) => {
        const from = email.from || email.sender || "Unknown";
        const subject = email.subject || "(No Subject)";
        const time = email.time || email.date || "Just now";
        const preview = email.preview || email.snippet || "No preview available";
        const isRead = email.read || false;
        const hasOTP = email.otp ? true : false;

        html += `
          <div class="email-item ${isRead ? 'read' : 'unread'}" data-id="${email.id || index}" style="padding: 16px; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s; ${hasOTP ? 'border-left: 3px solid #667eea;' : ''}" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='${hasOTP ? 'rgba(102, 126, 234, 0.05)' : 'transparent'}'">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px; ${!isRead ? 'color: var(--primary);' : ''}">
                  ${hasOTP ? '<span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; margin-right: 6px; font-weight: 700;">🔐 OTP</span>' : ''}
                  ${subject}
                </div>
                <div style="font-size: 12px; color: var(--text-muted);">From: ${from}</div>
              </div>
              <div style="font-size: 11px; color: var(--text-muted); white-space: nowrap; margin-left: 12px;">${time}</div>
            </div>
            <div style="font-size: 13px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${preview}</div>
            ${hasOTP ? `<div style="margin-top: 8px; padding: 8px; background: rgba(102, 126, 234, 0.1); border-radius: 6px; font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: #667eea; text-align: center; letter-spacing: 2px;">${email.otp}</div>` : ''}
          </div>
        `;
      });

      inboxDiv.innerHTML = html || '<div class="placeholder-box" style="text-align: center; padding: 40px 20px; color: var(--text-muted);"><p>No emails found</p></div>';

      // Add click handlers to email items
      document.querySelectorAll(".email-item").forEach((item) => {
        item.addEventListener("click", async () => {
          const emailId = item.dataset.id;
          await showEmailDetail(emailId);
        });
      });
    }

    // Show Email Detail
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
                <div style="color: rgba(255,255,255,0.9); font-size: 12px; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">🔐 OTP CODE</div>
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

    // Close Modal
    document.getElementById("close-email-modal")?.addEventListener("click", () => {
      document.getElementById("email-detail-modal").style.display = "none";
    });

    // Close modal on backdrop click
    document.querySelector("#email-detail-modal .modal-backdrop")?.addEventListener("click", () => {
      document.getElementById("email-detail-modal").style.display = "none";
    });

  }

  // ============= Cursor Reset Tab =============
  function initCursorTab() {
    const resetBtn = document.getElementById("reset-machine-id-btn");
    const closeBtn = document.getElementById("close-cursor-btn");
    const statusBtn = document.getElementById("check-cursor-status-btn");
    const output = document.getElementById("cursor-reset-output");
    const idsDiv = document.getElementById("cursor-reset-ids");

    const addLog = (msg, type = "info") => {
      const colors = {
        info: "#4a9eff",
        success: "#4ade80",
        error: "#f87171",
        warning: "#ffc107",
      };
      const div = document.createElement("div");
      div.style.color = colors[type];
      div.textContent = msg;
      output.appendChild(div);
      output.scrollTop = output.scrollHeight;
    };

    resetBtn?.addEventListener("click", async () => {
      output.innerHTML = "";
      idsDiv.style.display = "none";
      utils.showLoading();
      addLog("🔄 Memulai reset Machine ID...", "info");

      try {
        const result = await window.cursorResetAPI.resetMachineId();
        if (result.success) {
          result.logs?.forEach((log) => addLog(log.message, log.type));
          if (result.newIds) {
            document.getElementById("new-device-id").textContent =
              result.newIds.devDeviceId || "-";
            document.getElementById("new-machine-id").textContent =
              result.newIds.machineId || "-";
            document.getElementById("new-sqm-id").textContent =
              result.newIds.sqmId || "-";
            idsDiv.style.display = "block";
          }
          addLog("✅ Machine ID berhasil direset!", "success");
          utils.showSuccess("Machine ID reset berhasil!");
        } else {
          addLog(`❌ Error: ${result.message}`, "error");
          utils.showError(result.message);
        }
      } catch (error) {
        addLog(`❌ ${error.message}`, "error");
        utils.showError(error.message);
      } finally {
        utils.hideLoading();
      }
    });

    closeBtn?.addEventListener("click", async () => {
      output.innerHTML = "";
      utils.showLoading();
      addLog("❌ Menutup Cursor...", "info");
      try {
        const result = await window.cursorResetAPI.closeCursor();
        addLog(
          result.success ? "✅ Cursor ditutup!" : `⚠️ ${result.message}`,
          result.success ? "success" : "warning"
        );
        if (result.success) utils.showSuccess("Cursor ditutup!");
      } catch (error) {
        addLog(`❌ ${error.message}`, "error");
        utils.showError(error.message);
      } finally {
        utils.hideLoading();
      }
    });

    statusBtn?.addEventListener("click", async () => {
      output.innerHTML = "";
      utils.showLoading();
      addLog("📊 Memeriksa status...", "info");
      try {
        const result = await window.cursorResetAPI.checkCursorStatus();
        addLog(
          result.isRunning ? "✅ Cursor berjalan" : "ℹ️ Cursor tidak berjalan",
          result.isRunning ? "success" : "info"
        );
      } catch (error) {
        addLog(`❌ ${error.message}`, "error");
        utils.showError(error.message);
      } finally {
        utils.hideLoading();
      }
    });
  }

  // ============= Navigation =============
  function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".tab-content");

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const tabName = item.getAttribute("data-tab");
        navItems.forEach((nav) => nav.classList.remove("active"));
        tabContents.forEach((content) => content.classList.remove("active"));
        item.classList.add("active");
        document.getElementById(`${tabName}-tab`)?.classList.add("active");
      });
    });

    // Admin shortcut
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        window.goToAdmin();
      }
    });
  }

  // ============= Main Init =============
  async function init() {
    console.log("🚀 Initializing app...");

    await Promise.all([loadCSV(), loadBins()]);

    initCardsTab();
    initAddressTab();
    initCombinedTab();
    initCursorTab();
    initTempmailTab();
    initNavigation();

    console.log("✅ App ready!");
  }

  window.AppInit = { init };
})();
