/**
 * Cursor Reset Tab Controller (Modular Version)
 * Handles cursor reset operations using BaseController pattern
 */

class CursorController extends BaseController {
  constructor() {
    super('Cursor', { logLevel: 'info' });
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
    this.clearOutput('cursor-reset-output');
    this.hideIdsDisplay();
    
    await this.safeAsync(async () => {
      this.addLogEntry('cursor-reset-output', "Memulai reset Machine ID...", "info");

      const result = await window.cursorResetAPI.resetMachineId();
      
      if (result.success) {
        // Display logs from the operation
        result.logs?.forEach((log) => {
          this.addLogEntry('cursor-reset-output', log.message, log.type);
        });

        // Display new IDs if available
        if (result.newIds) {
          this.displayNewIds(result.newIds);
        }

        this.addLogEntry('cursor-reset-output', "Machine ID berhasil direset!", "success");
        this.showSuccess("Machine ID reset berhasil!");
      } else {
        this.addLogEntry('cursor-reset-output', `Error: ${result.message}`, "error");
        this.showError(result.message);
      }
    }, 'Failed to reset machine ID');
  }

  async handleCloseCursor() {
    this.clearOutput('cursor-reset-output');
    
    await this.safeAsync(async () => {
      this.addLogEntry('cursor-reset-output', "Menutup Cursor...", "info");
      
      const result = await window.cursorResetAPI.closeCursor();
      
      const message = result.success ? "Cursor ditutup!" : result.message;
      const type = result.success ? "success" : "warning";
      
      this.addLogEntry('cursor-reset-output', message, type);
      
      if (result.success) {
        this.showSuccess("Cursor ditutup!");
      }
    }, 'Failed to close Cursor');
  }

  async handleCheckStatus() {
    this.clearOutput('cursor-reset-output');
    
    await this.safeAsync(async () => {
      this.addLogEntry('cursor-reset-output', "Memeriksa status...", "info");
      
      const result = await window.cursorResetAPI.checkCursorStatus();
      
      const message = result.isRunning ? "Cursor berjalan" : "Cursor tidak berjalan";
      const type = result.isRunning ? "success" : "info";
      
      this.addLogEntry('cursor-reset-output', message, type);
    }, 'Failed to check Cursor status');
  }

  clearOutput(elementId) {
    const element = this.getElement(elementId);
    if (element) {
      element.innerHTML = "";
    }
  }

  hideIdsDisplay() {
    this.utils.updateElement(this.elements['cursor-reset-ids'], {
      style: { display: 'none' }
    });
  }

  displayNewIds(newIds) {
    // Update ID display elements using BaseController utilities
    this.utils.updateElements({
      'new-device-id': { textContent: newIds.devDeviceId || "-" },
      'new-machine-id': { textContent: newIds.machineId || "-" },
      'new-sqm-id': { textContent: newIds.sqmId || "-" },
      'cursor-reset-ids': { style: { display: 'block' } }
    });
  }
}

// Initialize controller (singleton pattern to prevent duplicates)
async function initCursorTab() {
  try {
    // Prevent multiple initialization
    if (window.cursorController && !window.cursorController.isDestroyed) {
      console.log('ℹ️ Cursor controller already initialized, skipping...');
      return;
    }

    // Cleanup existing controller if any
    if (window.cursorController) {
      window.cursorController.destroy();
    }

    const controller = new CursorController();
    await controller.init();
    
    // Store reference for cleanup if needed
    window.cursorController = controller;
    console.log('✅ Cursor controller initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Cursor controller:', error);
    window.Utils?.showError('Failed to initialize cursor reset functionality.');
  }
}

// Export for compatibility
window.CursorController = { init: initCursorTab };