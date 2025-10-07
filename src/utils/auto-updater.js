const { autoUpdater } = require('electron-updater');

class AutoUpdaterManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupAutoUpdater();
    this.setupEventListeners();
  }

  setupAutoUpdater() {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    
    // Logging
    autoUpdater.logger = {
      info: (msg) => console.log('[AutoUpdater]', msg),
      warn: (msg) => console.warn('[AutoUpdater]', msg),
      error: (msg) => console.error('[AutoUpdater]', msg)
    };
  }

  setupEventListeners() {
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info.version);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-available', {
          version: info.version,
          releaseDate: info.releaseDate,
          releaseNotes: info.releaseNotes
        });
      }
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('No updates available. Current version:', info.version);
    });

    autoUpdater.on('download-progress', (progress) => {
      console.log(`Download progress: ${progress.percent.toFixed(2)}%`);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-download-progress', {
          percent: progress.percent,
          transferred: progress.transferred,
          total: progress.total,
          bytesPerSecond: progress.bytesPerSecond
        });
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info.version);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-downloaded', {
          version: info.version,
          releaseDate: info.releaseDate
        });
      }
    });

    autoUpdater.on('error', (error) => {
      console.error('Update error:', error);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-error', {
          message: error.message
        });
      }
    });
  }

  async checkForUpdates() {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { 
        success: true, 
        updateInfo: result?.updateInfo,
        currentVersion: result?.currentVersion
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async downloadUpdate() {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  installUpdate() {
    autoUpdater.quitAndInstall(false, true);
  }

  checkForUpdatesAndNotify() {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

module.exports = AutoUpdaterManager;

