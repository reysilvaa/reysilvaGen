/**
 * Cursor Reset Tab Controller (Modular Version)
 * Handles cursor reset operations using BaseController pattern
 */

class CursorController extends BaseController {
  constructor() {
    super('Cursor', { logLevel: 'info' });
    this.logColors = {
      info: "#4a9eff",
      success: "#4ade80",
      error: "#f87171",
      warning: "#ffc107",
    };
    this.logIcons = {
      info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>`,
      success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`,
      error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`,
      warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`,
    };
  }

  async onInit() {
    // Setup UI elements and event listeners
    this.setupElements();
    this.setupEventListeners();
  }

  setupElements() {
    this.elements = this.getElements([
      'reset-machine-id-btn',
      'close-cursor-btn',
      'check-cursor-status-btn',
      'cursor-reset-output',
      'cursor-reset-ids',
      'new-device-id',
      'new-machine-id',
      'new-sqm-id'
    ]);
  }

  setupEventListeners() {
    this.addEventListener(this.elements['reset-machine-id-btn'], 'click', () => {
      this.handleResetMachineId();
    });

    this.addEventListener(this.elements['close-cursor-btn'], 'click', () => {
      this.handleCloseCursor();
    });

    this.addEventListener(this.elements['check-cursor-status-btn'], 'click', () => {
      this.handleCheckStatus();
    });
  }

  async handleResetMachineId() {
    this.clearOutput();
    this.hideIdsDisplay();
    
    await this.safeAsync(async () => {
      this.addLogEntry("Memulai reset Machine ID...", "info");

      const result = await window.cursorResetAPI.resetMachineId();
      
      if (result.success) {
        // Display logs from the operation
        result.logs?.forEach((log) => {
          this.addLogEntry(log.message, log.type);
        });

        // Display new IDs if available
        if (result.newIds) {
          this.displayNewIds(result.newIds);
        }

        this.addLogEntry("Machine ID berhasil direset!", "success");
        this.showSuccess("Machine ID reset berhasil!");
      } else {
        this.addLogEntry(`Error: ${result.message}`, "error");
        this.showError(result.message);
      }
    }, 'Failed to reset machine ID');
  }

  async handleCloseCursor() {
    this.clearOutput();
    
    await this.safeAsync(async () => {
      this.addLogEntry("Menutup Cursor...", "info");
      
      const result = await window.cursorResetAPI.closeCursor();
      
      const message = result.success ? "Cursor ditutup!" : result.message;
      const type = result.success ? "success" : "warning";
      
      this.addLogEntry(message, type);
      
      if (result.success) {
        this.showSuccess("Cursor ditutup!");
      }
    }, 'Failed to close Cursor');
  }

  async handleCheckStatus() {
    this.clearOutput();
    
    await this.safeAsync(async () => {
      this.addLogEntry("Memeriksa status...", "info");
      
      const result = await window.cursorResetAPI.checkCursorStatus();
      
      const message = result.isRunning ? "Cursor berjalan" : "Cursor tidak berjalan";
      const type = result.isRunning ? "success" : "info";
      
      this.addLogEntry(message, type);
    }, 'Failed to check Cursor status');
  }

  addLogEntry(message, type = "info") {
    const outputElement = this.elements['cursor-reset-output'];
    if (!outputElement) return;

    const div = document.createElement("div");
    div.style.color = this.logColors[type];
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.marginBottom = "6px";
    div.innerHTML = this.logIcons[type] + message;
    
    outputElement.appendChild(div);
    outputElement.scrollTop = outputElement.scrollHeight;
  }

  clearOutput() {
    const outputElement = this.elements['cursor-reset-output'];
    if (outputElement) {
      outputElement.innerHTML = "";
    }
  }

  hideIdsDisplay() {
    const idsElement = this.elements['cursor-reset-ids'];
    if (idsElement) {
      idsElement.style.display = "none";
    }
  }

  displayNewIds(newIds) {
    // Update ID display elements
    if (this.elements['new-device-id']) {
      this.elements['new-device-id'].textContent = newIds.devDeviceId || "-";
    }
    if (this.elements['new-machine-id']) {
      this.elements['new-machine-id'].textContent = newIds.machineId || "-";
    }
    if (this.elements['new-sqm-id']) {
      this.elements['new-sqm-id'].textContent = newIds.sqmId || "-";
    }

    // Show the IDs display
    const idsElement = this.elements['cursor-reset-ids'];
    if (idsElement) {
      idsElement.style.display = "block";
    }
  }
}

// Initialize controller
async function initCursorTab() {
  try {
    const controller = new CursorController();
    await controller.init();
    
    // Store reference for cleanup if needed
    window.cursorController = controller;
  } catch (error) {
    console.error('❌ Failed to initialize Cursor controller:', error);
    window.Utils?.showError('Failed to initialize cursor reset functionality.');
  }
}

// Export for compatibility
window.CursorController = { init: initCursorTab };