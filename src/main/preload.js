const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  // Open admin panel
  openAdminPanel: () => ipcRenderer.invoke("open-admin-panel"),

  // Admin Authentication
  adminLogin: (credentials) => ipcRenderer.invoke("admin-login", credentials),
  adminVerifySession: (sessionToken) =>
    ipcRenderer.invoke("admin-verify-session", sessionToken),
  adminLogout: (sessionToken) =>
    ipcRenderer.invoke("admin-logout", sessionToken),

  // BIN Management
  getAllBins: () => ipcRenderer.invoke("get-all-bins"),
  getActiveBins: () => ipcRenderer.invoke("get-active-bins"),
  addBin: (binData) => ipcRenderer.invoke("add-bin", binData),
  updateBin: (binData) => ipcRenderer.invoke("update-bin", binData),
  deleteBin: (id) => ipcRenderer.invoke("delete-bin", id),

  // Settings
  getSetting: (key) => ipcRenderer.invoke("get-setting", key),
  setSetting: (data) => ipcRenderer.invoke("set-setting", data),

  // Config Management
  getConfigPath: () => ipcRenderer.invoke("get-config-path"),
  resetConfig: () => ipcRenderer.invoke("reset-config"),
  
  // App Info
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
});

// Cursor Reset API
contextBridge.exposeInMainWorld("cursorResetAPI", {
  resetMachineId: () => ipcRenderer.invoke("cursor-reset-machine-id"),
  closeCursor: () => ipcRenderer.invoke("cursor-close"),
  checkCursorStatus: () => ipcRenderer.invoke("cursor-check-status"),
});

// Tempmail API - Clean CRUD Interface
contextBridge.exposeInMainWorld("tempmailAPI", {
  // CRUD Methods
  create: (params) => ipcRenderer.invoke("tempmail-create", params),
  show: (params) => ipcRenderer.invoke("tempmail-show", params),
  delete: (params) => ipcRenderer.invoke("tempmail-delete", params),
  execute: (params) => ipcRenderer.invoke("tempmail-execute", params),
  
  // Utility methods
  clear: () => ipcRenderer.invoke("tempmail-clear"),
});

// Auto Updater API
contextBridge.exposeInMainWorld("autoUpdater", {
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", (_, info) => callback(info)),
  onUpdateNotAvailable: (callback) => ipcRenderer.on("update-not-available", (_, info) => callback(info)),
  onDownloadProgress: (callback) => ipcRenderer.on("update-download-progress", (_, progress) => callback(progress)),
  onUpdateDownloaded: (callback) => ipcRenderer.on("update-downloaded", (_, info) => callback(info)),
  onUpdateError: (callback) => ipcRenderer.on("update-error", (_, error) => callback(error)),
});

// CSV Loader API
contextBridge.exposeInMainWorld("csvLoader", {
  loadCSV: (filename) => ipcRenderer.invoke("load-csv", filename),
});

// Constants API - Expose app constants to renderer
contextBridge.exposeInMainWorld("appConstants", {
  getConstants: () => ipcRenderer.invoke("get-app-constants"),
});

// Splash Screen API - For progress updates
contextBridge.exposeInMainWorld("splashAPI", {
  onProgress: (callback) => ipcRenderer.on("splash-progress", (_, progress, status) => callback(progress, status)),
});
