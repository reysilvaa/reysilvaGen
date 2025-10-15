/**
 * Application Initialization & Management
 * Single source of truth for app lifecycle
 * Merged functionality from Application.js for simplicity
 */

(function () {
  "use strict";

  const utils = window.Utils;
  let availableBins = [];
  let isInitialized = false;

  // ============= BIN Management =============
  async function loadBins() {
    try {
      // Check if electron IPC is available
      if (!window.electron || !window.electron.getActiveBins) {
        console.warn("⚠️ Electron IPC not available, using fallback");
        availableBins = [];
        populateBinSelects();
        return;
      }

      console.log("📡 Loading BINs from backend...");
      const result = await window.electron.getActiveBins();
      
      if (result && result.success) {
        availableBins = result.bins || [];
        console.log(`✅ Loaded ${availableBins.length} BINs`);
      } else {
        console.warn("⚠️ BIN loading failed:", result?.message || "Unknown error");
        availableBins = [];
      }
      
      // Always try to populate selects (even if empty)
      populateBinSelects();
      
    } catch (error) {
      console.error("❌ BIN load failed:", error);
      availableBins = [];
      populateBinSelects();
      
      // Show user-friendly error
      if (utils && utils.showError) {
        utils.showError("Failed to load BIN patterns");
      }
    }
  }

  function populateBinSelects() {
    const binSelect = document.getElementById("bin-select");
    const combinedBinSelect = document.getElementById("combined-bin-select");

    // If elements don't exist yet, store the data and try again later
    if (!binSelect && !combinedBinSelect) {
      console.log("📋 BIN select elements not found, will populate later");
      return;
    }

    let html = "";
    
    if (availableBins.length === 0) {
      html = '<option value="">No BINs configured - Contact admin</option>';
    } else {
      const binsByType = {};
      availableBins.forEach((bin) => {
        const type = bin.card_type || "Other";
        if (!binsByType[type]) binsByType[type] = [];
        binsByType[type].push(bin);
      });

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
    }

    // Populate available selects
    if (binSelect) {
      binSelect.innerHTML = html;
      console.log("✅ Populated main BIN select");
    }
    
    if (combinedBinSelect) {
      combinedBinSelect.innerHTML = html;
      console.log("✅ Populated combined BIN select");
    }
  }

  // ============= Global Helper =============
  window.copyToClipboard = async (text, label) => {
    const result = await utils.safeAsync(
      () => navigator.clipboard.writeText(text),
      'Copy to clipboard',
      { userMessage: `Failed to copy ${label}` }
    );
    
    if (result.success) {
      utils.showSuccess(`${label} copied!`);
    }
  };

  // ============= Auto Update =============
  // Helper functions using unified DOM utilities - DRY principle
  function updateStatusDisplay(updateStatus, config) {
    const { icon, message, color = "var(--text-muted)", show = true } = config;
    
    if (!show) {
      return utils.updateElement(updateStatus, { style: { display: "none" } });
    }
    
    const iconEl = utils.createIcon(icon.path, { 
      width: 14, height: 14, 
      className: icon.class || '' 
    });
    
    utils.updateElement(updateStatus, {
      style: {
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "6px", color
      },
      innerHTML: `${iconEl.outerHTML}<span>${message}</span>`
    });
  }

  function updateButtonState(checkUpdateBtn, config) {
    const { icon, text, disabled = false, onclick } = config;
    utils.updateButton(checkUpdateBtn, {
      icon: { 
        path: icon.path, 
        className: icon.class || '',
        style: icon.style || {} 
      },
      text,
      disabled,
      onclick
    });
  }

  function initAutoUpdater() {
    const checkUpdateBtn = document.getElementById("check-update-btn");
    const updateStatus = document.getElementById("update-status");

    if (!checkUpdateBtn || !updateStatus || !window.autoUpdater) return;

    // Listen to auto-updater events
    window.autoUpdater.onUpdateAvailable((info) => {
      updateStatusDisplay(updateStatus, {
        icon: { path: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="16 8 22 2 16 2"/>' },
        message: `Update ${info.version} available!`,
        color: "var(--success)"
      });

      updateButtonState(checkUpdateBtn, {
        icon: { path: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>' },
        text: "Download Update",
        disabled: false,
        onclick: () => {
          window.autoUpdater.downloadUpdate();
          updateButtonState(checkUpdateBtn, {
            icon: { path: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>', class: 'class="spinning"' },
            text: "Downloading...",
            disabled: true
          });
        }
      });
    });

    window.autoUpdater.onDownloadProgress((progress) => {
      updateStatusDisplay(updateStatus, {
        icon: { path: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>', class: 'class="spinning"' },
        message: `Downloading: ${Math.round(progress.percent)}%`,
        color: "var(--primary)"
      });
    });

    window.autoUpdater.onUpdateDownloaded((info) => {
      updateStatusDisplay(updateStatus, {
        icon: { path: '<polyline points="20 6 9 17 4 12"/>' },
        message: `Update ${info.version} ready!`,
        color: "var(--success)"
      });

      updateButtonState(checkUpdateBtn, {
        icon: { path: '<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>' },
        text: "Restart to Update",
        disabled: false,
        onclick: () => window.autoUpdater.installUpdate()
      });
    });

    window.autoUpdater.onUpdateNotAvailable(() => {
      updateStatusDisplay(updateStatus, {
        icon: { path: '<polyline points="20 6 9 17 4 12"/>' },
        message: "You're up to date!",
        color: "var(--success)"
      });
      
      checkUpdateBtn.disabled = false;
      
      setTimeout(() => updateStatusDisplay(updateStatus, { show: false }), 3000);
    });

    window.autoUpdater.onUpdateError((error) => {
      const errorMsg = error.message || 'Unknown error';
      const isNoRelease = errorMsg.includes('404') || errorMsg.includes('timeout');
      
      updateStatusDisplay(updateStatus, {
        icon: { 
          path: isNoRelease 
            ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
            : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
        },
        message: isNoRelease ? "No releases published yet" : "Update check failed",
        color: isNoRelease ? "var(--warning)" : "var(--danger)"
      });

      updateButtonState(checkUpdateBtn, {
        icon: { path: '<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>', class: 'class="update-icon"' },
        text: "Check for Updates",
        disabled: false
      });
      
      setTimeout(() => updateStatusDisplay(updateStatus, { show: false }), 5000);
    });

    // Button click handler
    checkUpdateBtn.addEventListener("click", async () => {
      if (!checkUpdateBtn.disabled) {
        updateStatusDisplay(updateStatus, {
          icon: { path: '<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>', class: 'class="spinning"' },
          message: "Checking for updates...",
          color: "var(--text-muted)"
        });
        checkUpdateBtn.disabled = true;
        
        try {
          const result = await window.autoUpdater.checkForUpdates();
          
          if (result && !result.success) {
            const isTimeout = result.error?.includes('timeout');
            updateStatusDisplay(updateStatus, {
              icon: { 
                path: isTimeout 
                  ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
                  : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
              },
              message: isTimeout ? "Check timed out" : "No updates available",
              color: "var(--warning)"
            });
            checkUpdateBtn.disabled = false;
            setTimeout(() => updateStatusDisplay(updateStatus, { show: false }), 4000);
          } else {
            // If update check succeeds but no update, this event fires
            setTimeout(() => {
              if (updateStatus.innerHTML.includes("Checking")) {
                updateStatusDisplay(updateStatus, {
                  icon: { path: '<polyline points="20 6 9 17 4 12"/>' },
                  message: "You're up to date!",
                  color: "var(--success)"
                });
                checkUpdateBtn.disabled = false;
                setTimeout(() => updateStatusDisplay(updateStatus, { show: false }), 3000);
              }
            }, 1000);
          }
        } catch (error) {
          updateStatusDisplay(updateStatus, {
            icon: { path: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' },
            message: "Failed to check updates",
            color: "var(--danger)"
          });
          checkUpdateBtn.disabled = false;
          setTimeout(() => updateStatusDisplay(updateStatus, { show: false }), 3000);
        }
      }
    });
  }

  // ============= Navigation & Routing =============
  function setupRoutes() {
    if (!window.TabRouter) {
      console.error('❌ TabRouter not available');
      return;
    }

    // Register all routes with their controllers
    window.TabRouter.register('cards', {
      title: 'Generate Cards',
      controller: window.CardsController,
      onEnter: () => console.log('📄 Entered Cards tab'),
      onLeave: () => console.log('📄 Left Cards tab')
    });

    window.TabRouter.register('address', {
      title: 'Generate Address', 
      controller: window.AddressController,
      onEnter: () => console.log('📄 Entered Address tab'),
      onLeave: () => console.log('📄 Left Address tab')
    });

    window.TabRouter.register('combined', {
      title: 'Combined Mode',
      controller: window.CombinedController,
      onEnter: () => console.log('📄 Entered Combined tab'),
      onLeave: () => console.log('📄 Left Combined tab')
    });

    window.TabRouter.register('cursor-reset', {
      title: 'Cursor Reset',
      controller: window.CursorController,
      onEnter: () => console.log('📄 Entered Cursor Reset tab'),
      onLeave: () => console.log('📄 Left Cursor Reset tab')
    });

    window.TabRouter.register('tempmail', {
      title: 'Temp Mail',
      controller: window.TempmailInit,
      onEnter: () => console.log('📄 Entered Tempmail tab'),
      onLeave: () => console.log('📄 Left Tempmail tab')
    });

    console.log('🛣️ All routes registered');
  }

  function initNavigation() {
    // Setup routes first
    setupRoutes();
    
    // Setup navigation listeners through router
    window.TabRouter.setupNavigation();
    
    // Navigate to default route
    window.TabRouter.navigateToDefault();

    // Admin shortcut
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        window.goToAdmin();
      }
    });
  }

  // Legacy function for backward compatibility
  async function switchTab(tabName) {
    if (window.TabRouter) {
      await window.TabRouter.navigate(tabName);
    } else {
      console.warn('⚠️ TabRouter not available, using fallback');
      // Simple fallback method
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('tab-content--active');
      });
      
      const targetTab = document.getElementById(`${tabName}-tab`);
      if (targetTab) {
        targetTab.classList.add('tab-content--active');
        console.log(`📄 Switched to ${tabName} tab`);
      }
    }
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

  // ============= Component Rendering =============
  function renderComponents() {
    console.log("🎨 Rendering UI components...");
    
    // Render sidebar
    const sidebarContainer = document.getElementById("sidebar-container");
    if (sidebarContainer && window.Sidebar) {
      sidebarContainer.innerHTML = window.Sidebar.render();
      console.log("✅ Sidebar rendered");
    }

    // Render main content tabs
    const mainContent = document.getElementById("main-content-container");
    if (mainContent) {
      const tabs = [
        window.CardsTab?.render(),
        window.AddressTab?.render(),
        window.CombinedTab?.render(),
        window.CursorResetTab?.render(),
        window.TempmailTab?.render()
      ].filter(Boolean);
      
      mainContent.innerHTML = tabs.join('');
      console.log("✅ Main content tabs rendered");
      
      // Try to populate BIN selects now that elements should exist
      setTimeout(() => {
        populateBinSelects();
      }, 100);
    }

    // Render footer
    const footerContainer = document.getElementById("footer-container");
    if (footerContainer && window.Footer) {
      footerContainer.innerHTML = window.Footer.render();
      console.log("✅ Footer rendered");
    }
  }

  // ============= Main Init =============
  async function init() {
    if (isInitialized) {
      console.log("⚠️ App already initialized");
      return;
    }

    try {
      console.log("🚀 Initializing app...");

      // Initialize loading manager first
      if (window.LoadingManager) {
        window.LoadingManager.init();
        console.log("✅ Loading manager initialized");
      }

      // Render UI components first
      renderComponents();

      // Load data after UI is rendered
      await loadBins();
      await loadAppVersion();

      
      // Setup navigation and auto-updater
      initNavigation();
      initAutoUpdater();

      isInitialized = true;
      console.log("✅ App ready!");
      
    } catch (error) {
      console.error("❌ App initialization failed:", error);
      utils.showError(`Failed to initialize: ${error.message}`);
    }
  }

  // ============= Debug Functions =============
  window.debugBins = async () => {
    console.log("🔍 Debug: Testing BIN loading...");
    console.log("🔍 Electron available:", !!window.electron);
    console.log("🔍 getActiveBins available:", !!window.electron?.getActiveBins);
    
    if (window.electron?.getActiveBins) {
      try {
        const result = await window.electron.getActiveBins();
        console.log("🔍 BIN loading result:", result);
        return result;
      } catch (error) {
        console.error("🔍 BIN loading error:", error);
        return { error };
      }
    } else {
      console.log("🔍 IPC not available");
      return { error: "IPC not available" };
    }
  };

  // ============= Public API =============
  window.AppInit = { 
    init, 
    switchTab,
    renderComponents,
    populateBinSelects,
    loadBins,
    isInitialized: () => isInitialized,
    getBins: () => availableBins
  };
})();
