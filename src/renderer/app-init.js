/**
 * Application Initialization
 * Orchestration layer - delegates to controllers
 */

(function () {
  "use strict";

  const utils = window.Utils;
  let availableBins = [];

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
          const description = bin.description ? ` - ${bin.description}` : '';
          html += `<option value="${bin.bin_pattern}" data-card-type="${bin.card_type}">${bin.bin_pattern}${description}</option>`;
        });
        html += `</optgroup>`;
      });

    binSelect.innerHTML = html;
    combinedBinSelect.innerHTML = html;
  }

  // ============= Global Helper =============
  window.copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      utils.showSuccess(`${label} copied!`);
    } catch (error) {
      utils.showError(`Failed to copy ${label}`);
    }
  };

  // ============= Auto Update =============
  function initAutoUpdater() {
    const checkUpdateBtn = document.getElementById("check-update-btn");
    const updateStatus = document.getElementById("update-status");

    if (!checkUpdateBtn || !updateStatus) return;

    // Listen to auto-updater events
    window.electron.autoUpdater.onUpdateChecking(() => {
      updateStatus.style.display = "block";
      updateStatus.style.color = "var(--text-muted)";
      updateStatus.innerHTML = "🔍 Checking for updates...";
      checkUpdateBtn.disabled = true;
    });

    window.electron.autoUpdater.onUpdateAvailable((info) => {
      updateStatus.style.display = "block";
      updateStatus.style.color = "var(--success)";
      updateStatus.innerHTML = `✨ Update ${info.version} available!`;
      checkUpdateBtn.textContent = "Download Update";
      checkUpdateBtn.disabled = false;
      
      // Change button action to download
      checkUpdateBtn.onclick = () => {
        window.electron.autoUpdater.downloadUpdate();
        checkUpdateBtn.disabled = true;
        checkUpdateBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Downloading...
        `;
      };
    });

    window.electron.autoUpdater.onUpdateNotAvailable(() => {
      updateStatus.style.display = "block";
      updateStatus.style.color = "var(--success)";
      updateStatus.innerHTML = "✅ You're up to date!";
      checkUpdateBtn.disabled = false;
      
      setTimeout(() => {
        updateStatus.style.display = "none";
      }, 3000);
    });

    window.electron.autoUpdater.onDownloadProgress((progress) => {
      updateStatus.style.display = "block";
      updateStatus.style.color = "var(--primary)";
      updateStatus.innerHTML = `📥 Downloading: ${Math.round(progress.percent)}%`;
    });

    window.electron.autoUpdater.onUpdateDownloaded((info) => {
      updateStatus.style.display = "block";
      updateStatus.style.color = "var(--success)";
      updateStatus.innerHTML = `✅ Update ${info.version} ready!`;
      checkUpdateBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        Restart to Update
      `;
      checkUpdateBtn.disabled = false;
      
      // Change button action to install
      checkUpdateBtn.onclick = () => {
        window.electron.autoUpdater.installUpdate();
      };
    });

    window.electron.autoUpdater.onError((error) => {
      updateStatus.style.display = "block";
      updateStatus.style.color = "var(--danger)";
      updateStatus.innerHTML = `❌ Update failed: ${error.message || 'Unknown error'}`;
      checkUpdateBtn.disabled = false;
      checkUpdateBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        Check for Updates
      `;
      
      setTimeout(() => {
        updateStatus.style.display = "none";
      }, 5000);
    });

    // Button click handler
    checkUpdateBtn.addEventListener("click", () => {
      if (!checkUpdateBtn.disabled) {
        window.electron.autoUpdater.checkForUpdates();
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

    await loadBins();

    // Initialize all controllers
    window.CardsController?.init();
    window.AddressController?.init();
    window.CombinedController?.init();
    window.CursorController?.init();
    window.TempmailInit?.init();
    
    initNavigation();
    initAutoUpdater();

    console.log("✅ App ready!");
  }

  window.AppInit = { init };
})();
