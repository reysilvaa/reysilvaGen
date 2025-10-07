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
});

// Cursor Reset API
contextBridge.exposeInMainWorld("cursorResetAPI", {
  resetMachineId: () => ipcRenderer.invoke("cursor-reset-machine-id"),
  closeCursor: () => ipcRenderer.invoke("cursor-close"),
  checkCursorStatus: () => ipcRenderer.invoke("cursor-check-status"),
});

// Tempmail API
contextBridge.exposeInMainWorld("tempmailAPI", {
  generateEmail: (domain, customEmail) => ipcRenderer.invoke("tempmail-generate", domain, customEmail),
  checkInbox: () => ipcRenderer.invoke("tempmail-check-inbox"),
  readEmail: (emailId) => ipcRenderer.invoke("tempmail-read-email", emailId),
  getCurrentEmail: () => ipcRenderer.invoke("tempmail-get-current"),
  clear: () => ipcRenderer.invoke("tempmail-clear"),
  toggleDebug: () => ipcRenderer.invoke("tempmail-toggle-debug"),
  switchToEmail: (email) => ipcRenderer.invoke("tempmail-switch", email),
  deleteEmail: () => ipcRenderer.invoke("tempmail-delete"),
});

// Auto Updater API
contextBridge.exposeInMainWorld("autoUpdater", {
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", (_, info) => callback(info)),
  onDownloadProgress: (callback) => ipcRenderer.on("update-download-progress", (_, progress) => callback(progress)),
  onUpdateDownloaded: (callback) => ipcRenderer.on("update-downloaded", (_, info) => callback(info)),
  onUpdateError: (callback) => ipcRenderer.on("update-error", (_, error) => callback(error)),
});
