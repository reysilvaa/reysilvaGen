/**
 * Auto Updater Manager
 * Manages automatic updates for the Electron application
 * @module utils/auto-updater
 */

const { autoUpdater } = require('electron-updater');
const { TIMING } = require('../config/app-constants');
const logger = require('./logger').default.child('AutoUpdater');

class AutoUpdaterManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupAutoUpdater();
    this.setupEventListeners();
    
    logger.info('Auto updater initialized');
  }

  /**
   * Setup auto updater configuration
   * @private
   */
  setupAutoUpdater() {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    
    // Use custom logger
    autoUpdater.logger = logger;
  }

  /**
   * Setup event listeners for update events
   * @private
   */
  setupEventListeners() {
    autoUpdater.on('checking-for-update', () => {
      logger.info('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      logger.info(`Update available: ${info.version}`);
      this._sendToRenderer('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      logger.info(`No updates available. Current version: ${info.version}`);
      this._sendToRenderer('update-not-available', {
        version: info.version
      });
    });

    autoUpdater.on('download-progress', (progress) => {
      const percent = progress.percent.toFixed(2);
      logger.info(`Download progress: ${percent}%`);
      this._sendToRenderer('update-download-progress', {
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total,
        bytesPerSecond: progress.bytesPerSecond
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      logger.success(`Update downloaded: ${info.version}`);
      this._sendToRenderer('update-downloaded', {
        version: info.version,
        releaseDate: info.releaseDate
      });
    });

    autoUpdater.on('error', (error) => {
      logger.error('Update error:', error);
      this._sendToRenderer('update-error', {
        message: error.message
      });
    });
  }

  /**
   * Send message to renderer process
   * @param {string} channel - IPC channel name
   * @param {Object} data - Data to send
   * @private
   */
  _sendToRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Check for updates with timeout
   * @returns {Promise<Object>} Update check result
   */
  async checkForUpdates() {
    try {
      logger.info('Starting update check...');
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Update check timed out'));
        }, TIMING.UPDATE_CHECK_TIMEOUT);
      });
      
      // Race between check and timeout
      const checkPromise = autoUpdater.checkForUpdates();
      const result = await Promise.race([checkPromise, timeoutPromise]);
      
      logger.success('Update check completed');
      
      return {
        success: true,
        updateInfo: result?.updateInfo,
        currentVersion: result?.currentVersion
      };
    } catch (error) {
      logger.error('Update check failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download available update
   * @returns {Promise<Object>} Download result
   */
  async downloadUpdate() {
    try {
      logger.info('Starting update download...');
      await autoUpdater.downloadUpdate();
      logger.success('Update download completed');
      return { success: true };
    } catch (error) {
      logger.error('Update download failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Install downloaded update and restart application
   */
  installUpdate() {
    logger.info('Installing update and restarting...');
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Check for updates and notify user automatically
   */
  checkForUpdatesAndNotify() {
    logger.info('Checking for updates automatically...');
    autoUpdater.checkForUpdatesAndNotify();
  }

  /**
   * Get current version
   * @returns {string} Current app version
   */
  getCurrentVersion() {
    const { app } = require('electron');
    return app.getVersion();
  }

  /**
   * Set custom feed URL
   * @param {string} url - Update feed URL
   */
  setFeedURL(url) {
    autoUpdater.setFeedURL({ provider: 'generic', url });
    logger.info(`Update feed URL set to: ${url}`);
  }
}

module.exports = AutoUpdaterManager;

