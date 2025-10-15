/**
 * Cursor Reset Tab Controller (Modular Version)
 * Handles cursor reset operations using BaseController pattern
 */

class CursorController extends BaseController {
  constructor() {
    super('Cursor');
    this.isProcessing = false; // Prevent double execution
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
    this.addEvent(this.elements['reset-machine-id-btn'], 'click', () => {
      this.handleResetMachineId();
    });

    this.addEvent(this.elements['close-cursor-btn'], 'click', () => {
      this.handleCloseCursor();
    });

    this.addEvent(this.elements['check-cursor-status-btn'], 'click', () => {
      this.handleCheckStatus();
    });
  }

  async handleResetMachineId() {
    // Prevent double execution
    if (this.isProcessing) {
      this.log('warn', 'Reset already in progress, ignoring duplicate request');
      return;
    }

    this.isProcessing = true;
    this.clearOutput('cursor-reset-output');
    this.hideIdsDisplay();
    
    await this.run(async () => {
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
        this.notify('success', "Machine ID reset berhasil!");
      } else {
        this.addLogEntry('cursor-reset-output', `Error: ${result.message}`, "error");
        this.notify('error', result.message);
      }
    }, 'Resetting Machine ID...');
    
    // Reset processing flag
    this.isProcessing = false;
  }

  async handleCloseCursor() {
    this.clearOutput('cursor-reset-output');
    
    await this.run(async () => {
      this.addLogEntry('cursor-reset-output', "Menutup Cursor...", "info");
      
      const result = await window.cursorResetAPI.closeCursor();
      
      const message = result.success ? "Cursor ditutup!" : result.message;
      const type = result.success ? "success" : "warning";
      
      this.addLogEntry('cursor-reset-output', message, type);
      
      if (result.success) {
        this.notify('success', "Cursor ditutup!");
      }
    }, 'Failed to close Cursor');
  }

  async handleCheckStatus() {
    this.clearOutput('cursor-reset-output');
    
    await this.run(async () => {
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
    const idsContainer = this.getElement('cursor-reset-ids');
    if (idsContainer) {
      idsContainer.style.display = 'none';
    }
  }

  displayNewIds(newIds) {
    // Update ID display elements
    const deviceIdEl = this.getElement('new-device-id');
    const machineIdEl = this.getElement('new-machine-id');
    const sqmIdEl = this.getElement('new-sqm-id');
    const idsContainer = this.getElement('cursor-reset-ids');

    if (deviceIdEl) deviceIdEl.textContent = newIds.devDeviceId || "-";
    if (machineIdEl) machineIdEl.textContent = newIds.machineId || "-";
    if (sqmIdEl) sqmIdEl.textContent = newIds.sqmId || "-";
    if (idsContainer) idsContainer.style.display = 'block';
  }

  /**
   * Called when route enters
   */
  async onRouteEnter() {
    // Cursor tab doesn't need special activation logic
  }
}

// Initialize controller (singleton pattern to prevent duplicates)
async function initCursorTab() {
  // Prevent multiple initialization - return existing if available
  if (window.cursorController && !window.cursorController.isDestroyed) {
    console.log('ℹ️ Cursor controller already initialized, returning existing...');
    return window.cursorController;
  }

  try {
    // Cleanup existing controller if any
    if (window.cursorController) {
      window.cursorController.destroy();
    }

    console.log('🎮 Creating new Cursor controller...');
    const controller = new CursorController();
    await controller.init();
    
    // Store reference for cleanup if needed
    window.cursorController = controller;
    console.log('✅ Cursor controller initialized');
    return controller;
  } catch (error) {
    console.error('❌ Failed to initialize Cursor controller:', error);
    window.Utils?.showError('Failed to initialize cursor reset functionality.');
    return null;
  }
}

// Export for compatibility
window.CursorController = { init: initCursorTab };