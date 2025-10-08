const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");

// Modules
const ConfigManager = require("../modules/config-manager");
const CursorResetManager = require("../modules/cursor-reset-manager");

// Scrapers
const TempmailScraper = require("../scrapers/tempmail-scraper");

// Utils
const AutoUpdaterManager = require("../utils/auto-updater");

let mainWindow;
let splashWindow;
let config;
let tempmailHeadless;
let autoUpdater;

function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 350,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    icon: path.join(__dirname, "../../assets", "icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile("src/renderer/splash.html");
  splashWindow.center();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 700,
    show: false,
    backgroundColor: "#0a0a0a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../../assets", "icon.ico"),
  });

  mainWindow.loadFile("src/renderer/index.html");

  // Remove menu bar
  Menu.setApplicationMenu(null);

  mainWindow.once("ready-to-show", () => {
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
      }
      mainWindow.show();
      mainWindow.center();
      
      // Initialize auto updater and check for updates
      if (!process.argv.includes("--dev")) {
        autoUpdater = new AutoUpdaterManager(mainWindow);
        autoUpdater.checkForUpdatesAndNotify();
      }
    }, 1800);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open DevTools in development mode
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }
}

// IPC Handlers for Auto Update
ipcMain.handle('check-for-updates', async () => {
  if (!autoUpdater) return { success: false, error: 'Auto updater not initialized' };
  return await autoUpdater.checkForUpdates();
});

ipcMain.handle('download-update', async () => {
  if (!autoUpdater) return { success: false, error: 'Auto updater not initialized' };
  return await autoUpdater.downloadUpdate();
});

ipcMain.handle('install-update', () => {
  if (!autoUpdater) return;
  autoUpdater.installUpdate();
});

app.whenReady().then(async () => {
  config = new ConfigManager();

  config.cleanupExpiredSessions();

  createSplashScreen();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (config) {
      config.close();
    }
    app.quit();
  }
});

app.on("before-quit", () => {
  if (config) {
    config.close();
  }
});

// Handle opening admin panel
ipcMain.handle("open-admin-panel", async () => {
  const adminWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#0a0a0a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  adminWindow.loadFile("src/renderer/admin.html");

  if (process.argv.includes("--dev")) {
    adminWindow.webContents.openDevTools();
  }

  return { success: true };
});

ipcMain.handle("admin-login", async (event, { username, password }) => {
  try {
    return config.authenticateAdmin(username, password);
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("admin-verify-session", async (event, sessionToken) => {
  try {
    return config.verifySession(sessionToken);
  } catch (error) {
    return { valid: false };
  }
});

ipcMain.handle("admin-logout", async (event, sessionToken) => {
  try {
    config.logout(sessionToken);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("get-all-bins", async (event) => {
  try {
    return { success: true, bins: config.getAllBins() };
  } catch (error) {
    return { success: false, message: error.message, bins: [] };
  }
});

ipcMain.handle("get-active-bins", async (event) => {
  try {
    return { success: true, bins: config.getActiveBins() };
  } catch (error) {
    return { success: false, message: error.message, bins: [] };
  }
});

ipcMain.handle("load-csv", async (event, filename) => {
  try {
    const fs = require('fs');
    const csvPath = path.join(__dirname, '../../assets/address', filename);
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    return { success: true, data: csvData };
  } catch (error) {
    console.error('Error loading CSV:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle(
  "add-bin",
  async (event, { binPattern, cardType, description, createdBy }) => {
    try {
      return config.addBin(binPattern, cardType, description, createdBy);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
);

ipcMain.handle(
  "update-bin",
  async (event, { id, binPattern, cardType, description }) => {
    try {
      return config.updateBin(id, binPattern, cardType, description);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
);

ipcMain.handle("delete-bin", async (event, id) => {
  try {
    return config.deleteBin(id);
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("get-setting", async (event, key) => {
  try {
    return { success: true, value: config.getSetting(key) };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("set-setting", async (event, { key, value }) => {
  try {
    config.setSetting(key, value);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("get-config-path", async () => {
  try {
    return { success: true, path: config.getConfigPath() };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("reset-config", async () => {
  try {
    config.resetToDefault();
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Cursor Reset Operations
ipcMain.handle("cursor-reset-machine-id", async () => {
  try {
    const resetManager = new CursorResetManager();
    const result = await resetManager.resetMachineId();
    return result;
  } catch (error) {
    return { success: false, message: error.message, logs: [] };
  }
});

ipcMain.handle("cursor-close", async () => {
  try {
    const resetManager = new CursorResetManager();
    const success = await resetManager.killCursor();
    return {
      success,
      message: success
        ? "Cursor berhasil ditutup"
        : "Cursor tidak sedang berjalan",
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("cursor-check-status", async () => {
  try {
    const resetManager = new CursorResetManager();
    const isRunning = await resetManager.isCursorRunning();
    return { isRunning };
  } catch (error) {
    return { isRunning: false, error: error.message };
  }
});

// Tempmail Operations - Headless Browser
ipcMain.handle("tempmail-generate", async (event, domain, customEmail) => {
  try {
    if (!tempmailHeadless) tempmailHeadless = new TempmailScraper();
    return await tempmailHeadless.generateEmail(domain, customEmail);
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("tempmail-check-inbox", async () => {
  try {
    if (!tempmailHeadless) return { success: false, message: "No email generated yet", emails: [] };
    return await tempmailHeadless.checkInbox();
  } catch (error) {
    return { success: false, message: error.message, emails: [] };
  }
});

ipcMain.handle("tempmail-read-email", async (event, emailId) => {
  try {
    if (!tempmailHeadless) return { success: false, message: "No email generated yet" };
    return await tempmailHeadless.readEmail(emailId);
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("tempmail-get-current", async () => {
  try {
    if (!tempmailHeadless) return { success: false, email: null };
    const email = tempmailHeadless.getCurrentEmail();
    return { success: true, email };
  } catch (error) {
    return { success: false, message: error.message, email: null };
  }
});

ipcMain.handle("tempmail-clear", async () => {
  try {
    if (tempmailHeadless) {
      tempmailHeadless.clear();
      tempmailHeadless = null;
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("tempmail-toggle-debug", async () => {
  try {
    if (!tempmailHeadless) return { success: false, message: "No window available" };
    return tempmailHeadless.toggleDebug();
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("tempmail-switch", async (event, email) => {
  try {
    if (!tempmailHeadless) tempmailHeadless = new TempmailScraper();
    return await tempmailHeadless.switchToEmail(email);
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("tempmail-delete", async () => {
  try {
    if (!tempmailHeadless) return { success: false, message: "No active email" };
    return await tempmailHeadless.deleteCurrentEmail();
  } catch (error) {
    return { success: false, message: error.message };
  }
});
