/**
 * Main Process - Electron Application Entry Point
 * @module main/main
 */

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

// Configuration
const { WINDOW, PATHS, WEB_PREFERENCES, TIMING } = require('../config/appConstants');
const isDev = process.argv.includes('--dev');

// Development environment setup
if (isDev) {
  const { setupDevelopmentEnvironment } = require('../config/development');
  setupDevelopmentEnvironment(app);
}

// Utilities
const { wrapHandler, successResponse, errorResponse, lazyServiceHandler } = require('../utils/ipcHandler');
const logger = require('../utils/logger');

// Modules
const ConfigManager = require('../modules/configManager');
const CursorResetManager = require('../modules/cursorResetManager');
const TempmailScraper = require('../scrapers/tempmailScraper');
const AutoUpdaterManager = require('../utils/autoUpdater');

// Application state
let mainWindow;
let splashWindow;
let config;
let tempmailHeadless;
let autoUpdater;

/**
 * Create splash screen window
 */
function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: WINDOW.splash.width,
    height: WINDOW.splash.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    icon: PATHS.icons.main,
    webPreferences: WEB_PREFERENCES.secure,
  });

  splashWindow.loadFile(path.join(PATHS.renderer, 'splash.html'));
  splashWindow.center();
  
  logger.info('Splash screen created');
}

/**
 * Create main application window
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW.main.width,
    height: WINDOW.main.height,
    minWidth: WINDOW.main.minWidth,
    minHeight: WINDOW.main.minHeight,
    show: false,
    backgroundColor: WINDOW.main.backgroundColor,
    icon: PATHS.icons.main,
    webPreferences: {
      ...WEB_PREFERENCES.secure,
      preload: PATHS.preload,
    },
  });

  mainWindow.loadFile(path.join(PATHS.renderer, 'app.html'));

  // Remove menu bar
  Menu.setApplicationMenu(null);

  const sendSplashProgress = (progress, status) => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.send('splash-progress', progress, status);
    }
  };

  mainWindow.once('ready-to-show', () => {
    // Send final progress updates
    sendSplashProgress(90, 'Finalizing application...');
    
    setTimeout(() => {
      sendSplashProgress(100, 'Ready!');
      setTimeout(() => {
        if (splashWindow) {
          splashWindow.close();
        }
        mainWindow.show();
        mainWindow.center();

        // Initialize auto updater in production
        if (!isDev) {
          autoUpdater = new AutoUpdaterManager(mainWindow);
          autoUpdater.checkForUpdatesAndNotify();
        }
      }, 500);
    }, TIMING.SPLASH_DURATION - 500);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    logger.info('Main window closed');
  });

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  logger.info('Main window created');
}

/**
 * Create admin panel window
 */
function createAdminWindow() {
    const adminWindow = new BrowserWindow({
    width: WINDOW.admin.width,
    height: WINDOW.admin.height,
    backgroundColor: WINDOW.main.backgroundColor,
      webPreferences: {
      ...WEB_PREFERENCES.secure,
      preload: PATHS.preload,
      },
    });

  adminWindow.loadFile(path.join(PATHS.renderer, 'app.html'), { hash: 'admin' });

    if (isDev) {
      adminWindow.webContents.openDevTools();
    }

  logger.info('Admin window created');
  return adminWindow;
}

/**
 * Get or create tempmail service instance
 */
function getTempmailService() {
  if (!tempmailHeadless) {
    tempmailHeadless = new TempmailScraper();
  }
  return tempmailHeadless;
}

// ==================== IPC HANDLERS ====================

// Auto Updater Handlers
ipcMain.handle('check-for-updates', wrapHandler(async () => {
  if (!autoUpdater) {
    return errorResponse('Auto updater not initialized');
  }
  return await autoUpdater.checkForUpdates();
}));

ipcMain.handle('download-update', wrapHandler(async () => {
  if (!autoUpdater) {
    return errorResponse('Auto updater not initialized');
  }
  return await autoUpdater.downloadUpdate();
}));

ipcMain.handle('install-update', wrapHandler(() => {
  if (!autoUpdater) {
    return;
  }
  autoUpdater.installUpdate();
}));

// Admin Panel Handler
ipcMain.handle('open-admin-panel', wrapHandler(async () => {
  createAdminWindow();
  return successResponse();
}));

// Admin Authentication Handlers
ipcMain.handle('admin-login', wrapHandler(async (event, { username, password }) => {
  return config.authenticateAdmin(username, password);
}));

ipcMain.handle('admin-verify-session', wrapHandler(async (event, sessionToken) => {
  return config.verifySession(sessionToken);
}));

ipcMain.handle('admin-logout', wrapHandler(async (event, sessionToken) => {
  config.logout(sessionToken);
  return successResponse();
}));

// BIN Management Handlers
ipcMain.handle('get-all-bins', wrapHandler(async () => {
  return successResponse({ bins: config.getAllBins() });
}));

ipcMain.handle('get-active-bins', wrapHandler(async () => {
  return successResponse({ bins: config.getActiveBins() });
}));

ipcMain.handle('load-csv', wrapHandler(async (event, filename) => {
  const fs = require('fs');
  const csvPath = path.join(__dirname, '../../assets/address', filename);
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  return successResponse({ data: csvData });
}));

// Constants Handler - Expose constants to renderer (no dependencies)
ipcMain.handle('get-app-constants', wrapHandler(async () => {
  try {
    const constants = require('../config/appConstants');
    // Only expose constants that are safe for renderer (exclude paths with __dirname)
    const safeConstants = {
      TIMING: constants.TIMING,
      SESSION: constants.SESSION,
      CRYPTO: constants.CRYPTO,
      CARD: constants.CARD,
      FILES: constants.FILES,
      WEB: constants.WEB,
      VALIDATION: constants.VALIDATION,
      XPATH: constants.XPATH,
      OTP_PATTERNS: constants.OTP_PATTERNS,
      DATE_FORMAT: constants.DATE_FORMAT,
      RETRY: constants.RETRY,
      BROWSER_WINDOW: constants.BROWSER_WINDOW,
      LOG: constants.LOG,
      CARD_TYPES: constants.CARD_TYPES,
    };
    console.log('✅ Constants loaded successfully for renderer');
    return successResponse(safeConstants);
  } catch (error) {
    console.error('❌ Failed to load constants:', error);
    return errorResponse('Failed to load constants', { error: error.message });
  }
}));

console.log('✅ IPC handler "get-app-constants" registered');

ipcMain.handle('add-bin', wrapHandler(async (event, { binPattern, cardType, description, createdBy }) => {
      return config.addBin(binPattern, cardType, description, createdBy);
}));

ipcMain.handle('update-bin', wrapHandler(async (event, { id, binPattern, cardType, description }) => {
    return config.updateBin(id, binPattern, cardType, description);
}));

ipcMain.handle('delete-bin', wrapHandler(async (event, id) => {
    return config.deleteBin(id);
}));

// Settings Handlers
ipcMain.handle('get-setting', wrapHandler(async (event, key) => {
  return successResponse({ value: config.getSetting(key) });
}));

ipcMain.handle('set-setting', wrapHandler(async (event, { key, value }) => {
    config.setSetting(key, value);
  return successResponse();
}));

// Config Management Handlers
ipcMain.handle('get-config-path', wrapHandler(async () => {
  return successResponse({ path: config.getConfigPath() });
}));

ipcMain.handle('get-app-version', wrapHandler(async () => {
  return successResponse({ version: app.getVersion() });
}));

ipcMain.handle('reset-config', wrapHandler(async () => {
    config.resetToDefault();
  return successResponse();
}));

// Cursor Reset Handlers
ipcMain.handle('cursor-reset-machine-id', wrapHandler(async () => {
    const resetManager = new CursorResetManager();
  return await resetManager.resetMachineId();
}));

ipcMain.handle('cursor-close', wrapHandler(async () => {
    const resetManager = new CursorResetManager();
    const success = await resetManager.killCursor();
    return {
      success,
    message: success ? 'Cursor berhasil ditutup' : 'Cursor tidak sedang berjalan',
  };
}));

ipcMain.handle('cursor-check-status', wrapHandler(async () => {
    const resetManager = new CursorResetManager();
    const isRunning = await resetManager.isCursorRunning();
    return { isRunning };
}));

// Tempmail Handlers - Using lazy service pattern
ipcMain.handle('tempmail-scrape-existing', lazyServiceHandler(
  getTempmailService,
  async (service) => await service.scrapeExistingEmail()
));

ipcMain.handle('tempmail-generate', lazyServiceHandler(
  getTempmailService,
  async (service, event, domain, customEmail) => await service.generateEmail(domain, customEmail)
));

ipcMain.handle('tempmail-check-inbox', wrapHandler(async () => {
  if (!tempmailHeadless) {
    return errorResponse('No email generated yet', { emails: [] });
  }
  return await tempmailHeadless.checkInbox();
}));

ipcMain.handle('tempmail-read-email', wrapHandler(async (event, emailId) => {
  if (!tempmailHeadless) {
    return errorResponse('No email generated yet');
  }
  return await tempmailHeadless.readEmail(emailId);
}));

ipcMain.handle('tempmail-get-current', wrapHandler(async () => {
  if (!tempmailHeadless) {
    return errorResponse('No email session', { email: null });
  }
    const email = tempmailHeadless.getCurrentEmail();
  return successResponse({ email });
}));

ipcMain.handle('tempmail-clear', wrapHandler(async () => {
    if (tempmailHeadless) {
      tempmailHeadless.clear();
      tempmailHeadless = null;
    }
  return successResponse();
}));

ipcMain.handle('tempmail-toggle-debug', wrapHandler(async () => {
  if (!tempmailHeadless) {
    return errorResponse('No window available');
  }
  return tempmailHeadless.toggleDebug();
}));

ipcMain.handle('tempmail-switch', lazyServiceHandler(
  getTempmailService,
  async (service, event, email) => await service.switchToEmail(email)
));

ipcMain.handle('tempmail-delete', wrapHandler(async () => {
  if (!tempmailHeadless) {
    return errorResponse('No active email');
  }
  return await tempmailHeadless.deleteCurrentEmail();
}));

// ==================== APPLICATION LIFECYCLE ====================

app.whenReady().then(async () => {
  logger.info('Application starting...');
  
  config = new ConfigManager();
  config.cleanupExpiredSessions();

  createSplashScreen();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
  
  logger.success('Application ready');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (config) {
      config.close();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (config) {
    config.close();
  }
  logger.info('Application shutting down');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
});
