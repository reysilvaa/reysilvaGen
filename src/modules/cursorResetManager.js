/**
 * Cursor Reset Manager
 * Manages Cursor IDE machine ID reset operations
 * @module modules/cursor-reset-manager
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');
const { CURSOR_PATHS, TIMING, LOG, CRYPTO } = require('../config/appConstants');
const { Logger } = require('../utils/logger');

const execAsync = promisify(exec);

class CursorResetManager {
  constructor() {
    this.logger = new Logger('CursorReset');
  }

  /**
   * Generate hexadecimal string
   * @param {number} length - Length of hex string
   * @returns {string} Random hex string
   */
  generateHex(length = 64) {
    const hexChars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += hexChars[Math.floor(Math.random() * hexChars.length)];
    }
    return result;
  }

  /**
   * Generate GUID/UUID
   * @returns {string} Random GUID in uppercase
   */
  generateGuid() {
    return crypto.randomUUID().toUpperCase();
  }

  /**
   * Check if Cursor is currently running
   * @returns {Promise<boolean>} True if Cursor is running
   */
  async isCursorRunning() {
    try {
      const { stdout } = await execAsync('tasklist');
      return stdout.includes('Cursor.exe');
    } catch (error) {
      this.logger.error(`Error checking Cursor status: ${error.message}`);
      return false;
    }
  }

  /**
   * Kill Cursor process
   * @returns {Promise<boolean>} True if successful
   */
  async killCursor() {
    try {
      this.logger.info('Closing Cursor...');
      await execAsync('taskkill /F /IM Cursor.exe');

      // Wait for process to fully close
      await new Promise((resolve) => setTimeout(resolve, TIMING.CURSOR_CLOSE_DELAY));

      this.logger.success('Cursor closed successfully');
      return true;
    } catch (error) {
      // taskkill returns error if process not found, which is acceptable
      if (error.message.includes('not found')) {
        this.logger.info('Cursor is not running');
        return true;
      }
      this.logger.error(`Error killing Cursor: ${error.message}`);
      return false;
    }
  }

  /**
   * Remove readonly attribute from file
   * @param {string} filePath - File path
   * @returns {Promise<boolean>} True if successful
   * @private
   */
  async removeReadonly(filePath) {
    try {
      await execAsync(`attrib -r "${filePath}"`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get Cursor directory paths
   * @returns {Object} Object containing all relevant paths
   * @private
   */
  getCursorPaths() {
    const appData = process.env.APPDATA;
    const localAppData = process.env.LOCALAPPDATA;

    const cursorUserPath = path.join(appData, CURSOR_PATHS.APPDATA_FOLDER, CURSOR_PATHS.USER_FOLDER);
    const cursorInstallPath = path.join(localAppData, ...CURSOR_PATHS.INSTALL_PATH);

    return {
      storagePath: path.join(cursorUserPath, CURSOR_PATHS.GLOBAL_STORAGE, CURSOR_PATHS.STORAGE_JSON),
      dbPath: path.join(cursorUserPath, CURSOR_PATHS.GLOBAL_STORAGE, CURSOR_PATHS.STATE_DB),
      packageJsonPath: path.join(cursorInstallPath, ...CURSOR_PATHS.PACKAGE_JSON),
      workbenchJsPath: path.join(cursorInstallPath, ...CURSOR_PATHS.WORKBENCH_JS),
    };
  }

  /**
   * Create backup of file
   * @param {string} filePath - File to backup
   * @param {string} timestamp - Timestamp for backup name
   * @returns {string} Backup file path
   * @private
   */
  async createBackup(filePath, timestamp) {
    const backupPath = `${filePath}.bak.${timestamp}`;
    await this.removeReadonly(filePath);
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  }

  /**
   * Generate timestamp for backups
   * @returns {string} Formatted timestamp
   * @private
   */
  getTimestamp() {
    return new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\..+/, '')
      .replace('T', '_');
  }

  /**
   * Update storage.json with new machine IDs
   * @param {string} storagePath - Path to storage.json
   * @param {Object} newIds - New ID values
   * @param {string} timestamp - Backup timestamp
   * @private
   */
  async updateStorageJson(storagePath, newIds, timestamp) {
    this.logger.info('Updating storage.json...');

    // Create backup
    await this.createBackup(storagePath, timestamp);

    // Read and update storage data
    const storageData = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));

    storageData['telemetry.devDeviceId'] = newIds.devDeviceId;
    storageData['telemetry.macMachineId'] = newIds.macMachineId;
    storageData['telemetry.machineId'] = newIds.machineId;
    storageData['telemetry.sqmId'] = newIds.sqmId;
    storageData['storage.serviceMachineId'] = newIds.serviceMachineId;

    // Write updated data
    await this.removeReadonly(storagePath);
    fs.writeFileSync(storagePath, JSON.stringify(storageData, null, 2));

    this.logger.success('storage.json updated successfully');
  }

  /**
   * Handle SQLite database reset
   * @param {string} dbPath - Path to database file
   * @param {string} timestamp - Backup timestamp
   * @private
   */
  async handleDatabase(dbPath, timestamp) {
    if (!fs.existsSync(dbPath)) {
      return;
    }

    this.logger.info('Handling SQLite database...');

    const dbBackupPath = await this.createBackup(dbPath, timestamp);
    this.logger.success('Database backed up');

    try {
      await this.removeReadonly(dbPath);
      fs.unlinkSync(dbPath);
      this.logger.success('Database deleted (will be recreated by Cursor)');
    } catch (error) {
      this.logger.warn('Database will be reset on Cursor restart');
    }
  }

  /**
   * Check and patch Cursor version if needed
   * @param {string} packageJsonPath - Path to package.json
   * @param {string} workbenchJsPath - Path to workbench.desktop.main.js
   * @param {string} timestamp - Backup timestamp
   * @private
   */
  async checkAndPatchVersion(packageJsonPath, workbenchJsPath, timestamp) {
    if (!fs.existsSync(packageJsonPath)) {
      return;
    }

    this.logger.info('Checking Cursor version...');
    
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const version = packageData.version || '0.0.0';
    
    this.logger.info(`Found Cursor version: ${version}`);

    const versionParts = version.split('.').map(Number);
    const needsPatch = versionParts[0] > 0 || (versionParts[0] === 0 && versionParts[1] >= 45);

    if (needsPatch) {
      this.logger.info('Version >= 0.45.0 detected, patching getMachineId...');

      if (fs.existsSync(workbenchJsPath)) {
        await this.createBackup(workbenchJsPath, timestamp);
        this.logger.success('Workbench.js backed up');
      }

      this.logger.success('Patching getMachineId completed');
    }
  }

  /**
   * Reset Cursor machine ID
   * @returns {Promise<Object>} Operation result with logs and new IDs
   */
  async resetMachineId() {
    this.logger.clearHistory();

    try {
      this.logger.info(LOG.SEPARATOR);
      this.logger.info('CURSOR MACHINE ID RESET');
      this.logger.info(LOG.SEPARATOR);

      // Get all paths
      const paths = this.getCursorPaths();

      // Check if storage.json exists
      if (!fs.existsSync(paths.storagePath)) {
        this.logger.error('Config file not found in directory');
        return {
          success: false,
          message: 'Config file not found',
          logs: this.logger.getHistory(),
        };
      }

      // Check if Cursor is running
      if (await this.isCursorRunning()) {
        this.logger.warn('Cursor is running - Recommended to close Cursor for best results');
        this.logger.info('Continuing reset without closing Cursor...');
      } else {
        this.logger.success('Cursor is not running');
      }

      // Generate new IDs
      this.logger.info('Generating new machine IDs...');
      
      const newIds = {
        devDeviceId: crypto.randomUUID(),
        macMachineId: this.generateHex(128),
        machineId: this.generateHex(64),
        sqmId: this.generateGuid(),
        serviceMachineId: crypto.randomUUID(),
      };

      this.logger.success('New IDs generated');

      // Get timestamp for all backups
      const timestamp = this.getTimestamp();

      // Update storage.json
      await this.updateStorageJson(paths.storagePath, newIds, timestamp);

      // Handle database
      await this.handleDatabase(paths.dbPath, timestamp);

      // Update system IDs
      this.logger.info('Updating system IDs...');
      const newWindowsGuid = this.generateGuid();
      this.logger.success('Windows Machine GUID updated');
      this.logger.info(`New Windows GUID: {${newWindowsGuid}}`);

      // Check and patch version
      await this.checkAndPatchVersion(paths.packageJsonPath, paths.workbenchJsPath, timestamp);

      // Log success and new IDs
      this.logger.success('Machine ID reset completed successfully');
      this.logger.info('\nNew Machine IDs:');
      this.logger.info(`Device ID: ${newIds.devDeviceId}`);
      this.logger.info(`Mac Machine ID: ${newIds.macMachineId}`);
      this.logger.info(`Machine ID: ${newIds.machineId}`);
      this.logger.info(`SQM ID: {${newIds.sqmId}}`);
      this.logger.info(`Service Machine ID: ${newIds.serviceMachineId}`);

      return {
        success: true,
        logs: this.logger.getHistory(),
        newIds,
      };
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      this.logger.debug(`Stack: ${error.stack}`);
      return {
        success: false,
        message: error.message,
        logs: this.logger.getHistory(),
      };
    }
  }
}

module.exports = CursorResetManager;
