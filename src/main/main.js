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
const { wrapHandler, lazyServiceHandler } = require('../core/utils/ipcHandler');
const { createSuccessResponse, createErrorResponse } = require('../core/utils/validators');
const logger = require('../core/utils/logger');

// Core modules
const ConfigManager = require('../core/config/configManager');
const CursorResetManager = require('../core/system/cursorResetManager');
const TempmailScraper = require('../scrapers/tempmailScraper');
const AutoUpdaterManager = require('../core/system/autoUpdater');

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
  
  // Send version to splash when ready
  splashWindow.webContents.once('dom-ready', () => {
    splashWindow.webContents.send('splash-version', app.getVersion());
  });
  
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
      }, 2000); // Increased from 500ms to 2000ms for version loading
    }, TIMING.app.splashDuration - 500);
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
 * Get or create tempmail service instance (Singleton)
 */
function getTempmailService() {
  if (!tempmailHeadless) {
    logger.info('Creating new TempmailScraper instance...');
    tempmailHeadless = new TempmailScraper();
  } else {
    logger.debug('Reusing existing TempmailScraper instance');
  }
  return tempmailHeadless;
}

// ==================== IPC HANDLER FACTORIES ====================
// DRY principle - Reduce repetitive IPC handler patterns

/**
 * Create simple getter handler that returns config data
 */
function createGetterHandler(getterFn, dataKey = null) {
  return wrapHandler(async () => {
    const data = await getterFn();
    return createSuccessResponse('Operation completed', dataKey ? { [dataKey]: data } : data);
  });
}

/**
 * Create config operation handler with automatic success response
 */
function createConfigHandler(operation) {
  return wrapHandler(async (...args) => {
    const result = await operation(...args);
    return result.success ? result : createSuccessResponse('Operation completed', result);
  });
}

/**
 * Create simple service handler with consistent error handling
 */
function createServiceHandler(serviceFn) {
  return wrapHandler(serviceFn);
}

// ==================== IPC HANDLERS ====================

// Auto Updater Handlers
ipcMain.handle('check-for-updates', wrapHandler(async () => {
  if (!autoUpdater) {
    return createErrorResponse('Auto updater not initialized');
  }
  return await autoUpdater.checkForUpdates();
}));

ipcMain.handle('download-update', wrapHandler(async () => {
  if (!autoUpdater) {
    return createErrorResponse('Auto updater not initialized');
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
ipcMain.handle('open-admin-panel', createServiceHandler(async () => {
  createAdminWindow();
  return createSuccessResponse('Admin panel opened');
}));

// Admin Authentication Handlers  
ipcMain.handle('admin-login', createConfigHandler((event, { username, password }) => 
  config.authenticateAdmin(username, password)
));

ipcMain.handle('admin-verify-session', createConfigHandler((event, sessionToken) => 
  config.verifySession(sessionToken)
));

ipcMain.handle('admin-logout', createServiceHandler(async (event, sessionToken) => {
  config.logout(sessionToken);
  return createSuccessResponse('Admin logged out');
}));

// BIN Management Handlers - Using getter factory
ipcMain.handle('get-all-bins', createGetterHandler(() => config.getAllBins(), 'bins'));
ipcMain.handle('get-active-bins', createGetterHandler(() => config.getActiveBins(), 'bins'));

ipcMain.handle('load-csv', wrapHandler(async (event, filename) => {
  const fs = require('fs');
  const csvPath = path.join(__dirname, '../../assets/address', filename);
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  return createSuccessResponse('CSV data loaded', { data: csvData });
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
    return createSuccessResponse('Constants loaded', safeConstants);
  } catch (error) {
    console.error('❌ Failed to load constants:', error);
    return createErrorResponse('Failed to load constants', error, { error: error.message });
  }
}));

console.log('✅ IPC handler "get-app-constants" registered');

// BIN CRUD Operations - Using config handler factory
ipcMain.handle('add-bin', createConfigHandler((event, { binPattern, cardType, description, createdBy }) =>
  config.addBin(binPattern, cardType, description, createdBy)
));

ipcMain.handle('update-bin', createConfigHandler((event, { id, binPattern, cardType, description }) =>
  config.updateBin(id, binPattern, cardType, description)
));

ipcMain.handle('delete-bin', createConfigHandler((event, id) =>
  config.deleteBin(id)
));

// Settings Handlers - Using getter/setter factories
ipcMain.handle('get-setting', createGetterHandler((event, key) => config.getSetting(key), 'value'));

ipcMain.handle('set-setting', createServiceHandler(async (event, { key, value }) => {
  config.setSetting(key, value);
  return createSuccessResponse('Setting updated');
}));

// Config Management Handlers - Using getter factory
ipcMain.handle('get-config-path', createGetterHandler(() => config.getConfigPath(), 'path'));
ipcMain.handle('get-app-version', createGetterHandler(() => app.getVersion(), 'version'));

ipcMain.handle('reset-config', createServiceHandler(async () => {
  config.resetToDefault();
  return createSuccessResponse('Config reset to default');
}));

// Cursor Reset Handlers - Factory for cursor operations
function createCursorHandler(operation) {
  return createServiceHandler(async () => {
    const resetManager = new CursorResetManager();
    return await operation(resetManager);
  });
}

ipcMain.handle('cursor-reset-machine-id', createCursorHandler(manager => manager.resetMachineId()));

ipcMain.handle('cursor-close', createCursorHandler(async manager => {
  const success = await manager.killCursor();
  return createSuccessResponse(
    success ? 'Cursor berhasil ditutup' : 'Cursor tidak sedang berjalan',
    { success }
  );
}));

ipcMain.handle('cursor-check-status', createCursorHandler(async manager => 
  createSuccessResponse('Status checked', { isRunning: await manager.isCursorRunning() })
));

// Tempmail Handlers - CRUD Methods
ipcMain.handle('tempmail-create', lazyServiceHandler(
  getTempmailService,
  async (service, event, params) => await service.create(params)
));

ipcMain.handle('tempmail-show', lazyServiceHandler(
  getTempmailService,
  async (service, event, params) => await service.show(params)
));

ipcMain.handle('tempmail-delete', lazyServiceHandler(
  getTempmailService,
  async (service, event, params) => await service.delete(params)
));

ipcMain.handle('tempmail-execute', lazyServiceHandler(
  getTempmailService,
  async (service, event, params) => await service.execute(params)
));

ipcMain.handle('tempmail-clear', createServiceHandler(async () => {
  if (tempmailHeadless) {
    await tempmailHeadless.clear();
    tempmailHeadless = null;
  }
  return createSuccessResponse('Tempmail services closed');
}));


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

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    if (config) {
      config.close();
    }
    if (tempmailHeadless) {
      await tempmailHeadless.clear();
    }
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (config) {
    config.close();
  }
  if (tempmailHeadless) {
    await tempmailHeadless.clear();
  }
  logger.info('Application shutting down');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  // Only log significant errors, ignore common Puppeteer protocol errors
  if (error && error.message && 
      !error.message.includes('Request is already handled') &&
      !error.message.includes('Protocol error') &&
      !error.message.includes('Target closed') &&
      !error.message.includes('Execution context was destroyed')) {
    logger.error('Unhandled rejection:', error);
  }
});
