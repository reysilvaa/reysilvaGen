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

    if (!checkUpdateBtn || !updateStatus || !window.autoUpdater) return;

    // Listen to auto-updater events
    window.autoUpdater.onUpdateAvailable((info) => {
      updateStatus.style.display = "flex";
      updateStatus.style.alignItems = "center";
      updateStatus.style.justifyContent = "center";
      updateStatus.style.gap = "6px";
      updateStatus.style.color = "var(--success)";
      updateStatus.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          <polyline points="16 8 22 2 16 2"/>
        </svg>
        <span>Update ${info.version} available!</span>
      `;
      checkUpdateBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        <span>Download Update</span>
      `;
      checkUpdateBtn.disabled = false;
      
      // Change button action to download
      checkUpdateBtn.onclick = () => {
        window.autoUpdater.downloadUpdate();
        checkUpdateBtn.disabled = true;
        checkUpdateBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spinning">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          <span>Downloading...</span>
        `;
      };
    });

    window.autoUpdater.onDownloadProgress((progress) => {
      updateStatus.style.display = "flex";
      updateStatus.style.alignItems = "center";
      updateStatus.style.justifyContent = "center";
      updateStatus.style.gap = "6px";
      updateStatus.style.color = "var(--primary)";
      updateStatus.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spinning">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        <span>Downloading: ${Math.round(progress.percent)}%</span>
      `;
    });

    window.autoUpdater.onUpdateDownloaded((info) => {
      updateStatus.style.display = "flex";
      updateStatus.style.alignItems = "center";
      updateStatus.style.justifyContent = "center";
      updateStatus.style.gap = "6px";
      updateStatus.style.color = "var(--success)";
      updateStatus.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Update ${info.version} ready!</span>
      `;
      checkUpdateBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        <span>Restart to Update</span>
      `;
      checkUpdateBtn.disabled = false;
      
      // Change button action to install
      checkUpdateBtn.onclick = () => {
        window.autoUpdater.installUpdate();
      };
    });

    window.autoUpdater.onUpdateNotAvailable(() => {
      updateStatus.style.display = "flex";
      updateStatus.style.alignItems = "center";
      updateStatus.style.justifyContent = "center";
      updateStatus.style.gap = "6px";
      updateStatus.style.color = "var(--success)";
      updateStatus.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>You're up to date!</span>
      `;
      checkUpdateBtn.disabled = false;
      
      setTimeout(() => {
        updateStatus.style.display = "none";
      }, 3000);
    });

    window.autoUpdater.onUpdateError((error) => {
      updateStatus.style.display = "flex";
      updateStatus.style.alignItems = "center";
      updateStatus.style.justifyContent = "center";
      updateStatus.style.gap = "6px";
      const errorMsg = error.message || 'Unknown error';
      const isNoRelease = errorMsg.includes('404') || errorMsg.includes('timeout');
      updateStatus.style.color = isNoRelease ? "var(--warning)" : "var(--danger)";
      updateStatus.innerHTML = isNoRelease ? `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span>No releases published yet</span>
      ` : `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span>Update check failed</span>
      `;
      checkUpdateBtn.disabled = false;
      checkUpdateBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="update-icon">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        <span>Check for Updates</span>
      `;
      
      setTimeout(() => {
        updateStatus.style.display = "none";
      }, 5000);
    });

    // Button click handler
    checkUpdateBtn.addEventListener("click", async () => {
      if (!checkUpdateBtn.disabled) {
        updateStatus.style.display = "flex";
        updateStatus.style.alignItems = "center";
        updateStatus.style.justifyContent = "center";
        updateStatus.style.gap = "6px";
        updateStatus.style.color = "var(--text-muted)";
        updateStatus.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spinning">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          <span>Checking for updates...</span>
        `;
        checkUpdateBtn.disabled = true;
        
        try {
          const result = await window.autoUpdater.checkForUpdates();
          
          if (result && !result.success) {
            // Check failed - could be no releases or network error
            updateStatus.style.display = "flex";
            updateStatus.style.alignItems = "center";
            updateStatus.style.justifyContent = "center";
            updateStatus.style.gap = "6px";
            updateStatus.style.color = "var(--warning)";
            updateStatus.innerHTML = result.error?.includes('timeout') 
              ? `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Check timed out</span>
              `
              : `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>No updates available</span>
              `;
            checkUpdateBtn.disabled = false;
            
            setTimeout(() => {
              updateStatus.style.display = "none";
            }, 4000);
          } else {
            // If update check succeeds but no update, this event fires
            setTimeout(() => {
              if (updateStatus.innerHTML.includes("Checking")) {
                updateStatus.style.display = "flex";
                updateStatus.style.alignItems = "center";
                updateStatus.style.justifyContent = "center";
                updateStatus.style.gap = "6px";
                updateStatus.style.color = "var(--success)";
                updateStatus.innerHTML = `
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>You're up to date!</span>
                `;
                checkUpdateBtn.disabled = false;
                
                setTimeout(() => {
                  updateStatus.style.display = "none";
                }, 3000);
              }
            }, 1000);
          }
        } catch (error) {
          updateStatus.style.display = "flex";
          updateStatus.style.alignItems = "center";
          updateStatus.style.justifyContent = "center";
          updateStatus.style.gap = "6px";
          updateStatus.style.color = "var(--danger)";
          updateStatus.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>Failed to check updates</span>
          `;
          checkUpdateBtn.disabled = false;
          
          setTimeout(() => {
            updateStatus.style.display = "none";
          }, 3000);
        }
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

  // ============= Version Display =============
  async function loadAppVersion() {
    try {
      const result = await window.electron.getAppVersion();
      if (result.success && result.version) {
        const versionElement = document.getElementById("app-version");
        if (versionElement) {
          versionElement.textContent = `v${result.version}`;
        }
      }
    } catch (error) {
      console.error("❌ Failed to load app version:", error);
    }
  }

  // ============= Main Init =============
  async function init() {
    console.log("🚀 Initializing app...");

    await loadBins();
    await loadAppVersion();

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
