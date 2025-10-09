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
    
    // Set timeout and request options to prevent hanging
    autoUpdater.requestHeaders = {
      'Cache-Control': 'no-cache'
    };
    
    // Configure HTTP request timeout (10 seconds)
    autoUpdater.httpExecutor = {
      request: (options) => {
        options.timeout = 10000; // 10 second timeout
        return autoUpdater.httpExecutor.request(options);
      }
    };
    
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
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-not-available', {
          version: info.version
        });
      }
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
      // Add timeout wrapper to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Update check timed out')), 15000); // 15 second timeout
      });
      
      const checkPromise = autoUpdater.checkForUpdates();
      
      const result = await Promise.race([checkPromise, timeoutPromise]);
      
      return { 
        success: true, 
        updateInfo: result?.updateInfo,
        currentVersion: result?.currentVersion
      };
    } catch (error) {
      console.error('[AutoUpdater] Check failed:', error.message);
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

