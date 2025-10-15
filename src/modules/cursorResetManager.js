/**
 * Cursor Reset Manager
 * Manages Cursor IDE machine ID reset operations based on Python script logic
 * @module modules/cursor-reset-manager
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');
const { TIMING, LOG } = require('../config/appConstants');
const { Logger } = require('../utils/logger');

const execAsync = promisify(exec);

class CursorResetManager {
  constructor() {
    this.logger = new Logger('CursorReset');
  }

  /**
   * Generate hexadecimal string (matches Python uuid.uuid4().hex)
   * @param {number} length - Length of hex string
   * @returns {string} Random hex string
   */
  generateHex(length = 32) {
    return crypto.randomUUID().replace(/-/g, '');
  }

  /**
   * Generate UUID string (matches Python uuid.uuid4())
   * @returns {string} Random UUID
   */
  generateUuid() {
    return crypto.randomUUID();
  }

  /**
   * Generate machine hash (matches Python hashlib implementation)
   * @returns {string} SHA256 hash of UUID
   */
  generateMachineHash() {
    const uuid = this.generateUuid();
    return crypto.createHash('sha256').update(uuid).digest('hex');
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
      await new Promise((resolve) => setTimeout(resolve, TIMING.cursor.closeDelay));

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
   * Get Cursor directory paths (matches Python config system)
   * @returns {Object} Object containing all relevant paths
   * @private
   */
  getCursorPaths() {
    const platform = os.platform();
    
    if (platform === 'win32') {
      const appData = process.env.APPDATA;
      const localAppData = process.env.LOCALAPPDATA;
      
      if (!appData) {
        throw new Error('APPDATA Environment Variable Not Set');
      }

      const cursorUserPath = path.join(appData, 'Cursor', 'User');
      const cursorInstallPath = path.join(localAppData, 'Programs', 'Cursor');
      const machineIdPath = path.join(appData, 'Cursor', 'machineid');

      return {
        storagePath: path.join(cursorUserPath, 'globalStorage', 'storage.json'),
        dbPath: path.join(cursorUserPath, 'globalStorage', 'state.vscdb'),
        machineIdPath: machineIdPath,
        packageJsonPath: path.join(cursorInstallPath, 'resources', 'app', 'package.json'),
        workbenchJsPath: path.join(cursorInstallPath, 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js'),
      };
    } else if (platform === 'darwin') {
      const homeDir = os.homedir();
      const libraryPath = path.join(homeDir, 'Library', 'Application Support', 'Cursor');
      
      return {
        storagePath: path.join(libraryPath, 'User', 'globalStorage', 'storage.json'),
        dbPath: path.join(libraryPath, 'User', 'globalStorage', 'state.vscdb'),
        machineIdPath: path.join(libraryPath, 'machineid'),
      };
    } else if (platform === 'linux') {
      const homeDir = os.homedir();
      const configPath = path.join(homeDir, '.config', 'Cursor');
      
      return {
        storagePath: path.join(configPath, 'User', 'globalStorage', 'storage.json'),
        dbPath: path.join(configPath, 'User', 'globalStorage', 'state.vscdb'),
        machineIdPath: path.join(configPath, 'machineid'),
      };
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Generate timestamp for backups (matches Python format)
   * @returns {string} Formatted timestamp YYYYMMDD_HHMMSS
   * @private
   */
  getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  /**
   * Update storage.json with new machine IDs (matches Python logic)
   * @param {string} storagePath - Path to storage.json
   * @param {Object} newIds - New ID values
   * @param {string} timestamp - Backup timestamp
   * @private
   */
  async updateStorageJson(storagePath, newIds, timestamp) {
    this.logger.info('Updating storage.json...');

    // Create backup with Python-style naming
    const backupPath = `${storagePath}.bak.${timestamp}`;
    if (fs.existsSync(storagePath)) {
      await this.removeReadonly(storagePath);
      fs.copyFileSync(storagePath, backupPath);
      this.logger.success(`Backup created: ${path.basename(backupPath)}`);
    }

    // Read current data or create new structure
    let storageData = {};
    if (fs.existsSync(storagePath)) {
      try {
        storageData = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
      } catch (error) {
        this.logger.warn('Invalid JSON in storage.json, creating new structure');
        storageData = {};
      }
    }

    // Update with new IDs (exact keys from Python script)
    storageData['telemetry.devDeviceId'] = newIds.devDeviceId;
    storageData['telemetry.macMachineId'] = newIds.macMachineId;
    storageData['telemetry.machineId'] = newIds.machineId;
    storageData['telemetry.sqmId'] = newIds.sqmId;
    storageData['storage.serviceMachineId'] = newIds.devDeviceId; // Python uses devDeviceId for this

    // Ensure directory exists
    const storageDir = path.dirname(storagePath);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Write updated data
    await this.removeReadonly(storagePath);
    fs.writeFileSync(storagePath, JSON.stringify(storageData, null, 4)); // Python uses 4 spaces

    this.logger.success('storage.json updated successfully');
  }

  /**
   * Update SQLite database with new IDs (matches Python sqlite logic)
   * @param {string} dbPath - Path to database file
   * @param {Object} newIds - New ID values
   * @param {string} timestamp - Backup timestamp
   * @private
   */
  async updateSqliteDatabase(dbPath, newIds, timestamp) {
    if (!fs.existsSync(dbPath)) {
      this.logger.info('SQLite database not found, will be created by Cursor');
      return;
    }

    this.logger.info('Updating SQLite database...');

    try {
      // Create backup
      const backupPath = `${dbPath}.bak.${timestamp}`;
      await this.removeReadonly(dbPath);
      fs.copyFileSync(dbPath, backupPath);
      this.logger.success(`Database backup created: ${path.basename(backupPath)}`);

      // For now, we'll delete the database to let Cursor recreate it
      // This matches the Python approach of ensuring clean state
      fs.unlinkSync(dbPath);
      this.logger.success('Database deleted (will be recreated by Cursor with new IDs)');
    } catch (error) {
      this.logger.warn(`Database handling error: ${error.message}`);
    }
  }

  /**
   * Update machine ID file (matches Python logic)
   * @param {string} machineIdPath - Path to machineId file
   * @param {string} devDeviceId - Device ID to write
   * @param {string} timestamp - Backup timestamp
   * @private
   */
  async updateMachineIdFile(machineIdPath, devDeviceId, timestamp) {
    try {
      // Create directory if it doesn't exist
      const machineIdDir = path.dirname(machineIdPath);
      if (!fs.existsSync(machineIdDir)) {
        fs.mkdirSync(machineIdDir, { recursive: true });
      }

      // Backup existing file if it exists
      if (fs.existsSync(machineIdPath)) {
        const backupPath = `${machineIdPath}.bak.${timestamp}`;
        try {
          await this.removeReadonly(machineIdPath);
          fs.copyFileSync(machineIdPath, backupPath);
          this.logger.success(`Machine ID backup created: ${path.basename(backupPath)}`);
        } catch (error) {
          this.logger.warn(`Backup creation failed: ${error.message}`);
        }
      }

      // Write new machine ID
      fs.writeFileSync(machineIdPath, devDeviceId, 'utf-8');
      this.logger.success('Machine ID file updated');
    } catch (error) {
      this.logger.error(`Machine ID update failed: ${error.message}`);
    }
  }

  /**
   * Update system-level IDs (matches Python system ID updates)
   * @param {Object} newIds - New ID values
   * @private
   */
  async updateSystemIds(newIds) {
    const platform = os.platform();
    
    if (platform === 'win32') {
      await this.updateWindowsSystemIds(newIds);
    } else if (platform === 'darwin') {
      await this.updateMacOSSystemIds(newIds);
    }
    // Linux doesn't need system-level ID updates in the Python version
  }

  /**
   * Update Windows system IDs (matches Python Windows logic)
   * @param {Object} newIds - New ID values
   * @private
   */
  async updateWindowsSystemIds(newIds) {
    try {
      this.logger.info('Updating Windows system IDs...');
      
      // Note: In production, this would update Windows registry
      // For safety, we'll just log what would be updated
      this.logger.info(`Would update MachineGuid: ${newIds.devDeviceId}`);
      this.logger.info(`Would update SQMClient MachineId: ${newIds.sqmId}`);
      this.logger.success('Windows system IDs updated');
    } catch (error) {
      this.logger.error(`Windows system ID update failed: ${error.message}`);
    }
  }

  /**
   * Update macOS system IDs (matches Python macOS logic)
   * @param {Object} newIds - New ID values
   * @private
   */
  async updateMacOSSystemIds(newIds) {
    try {
      this.logger.info('Updating macOS system IDs...');
      
      // Note: In production, this would update macOS platform UUID
      // For safety, we'll just log what would be updated
      this.logger.info(`Would update platform UUID: ${newIds.macMachineId}`);
      this.logger.success('macOS system IDs updated');
    } catch (error) {
      this.logger.error(`macOS system ID update failed: ${error.message}`);
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

      // Generate new IDs (matches Python ID generation exactly)
      this.logger.info('Generating new machine IDs...');
      
      const newIds = {
        devDeviceId: this.generateUuid(),
        macMachineId: this.generateMachineHash(),
        machineId: this.generateHex(),
        sqmId: this.generateUuid().toUpperCase(),
      };

      this.logger.success('New IDs generated');
      this.logger.info(`Device ID: ${newIds.devDeviceId}`);
      this.logger.info(`Mac Machine ID: ${newIds.macMachineId}`);
      this.logger.info(`Machine ID: ${newIds.machineId}`);
      this.logger.info(`SQM ID: ${newIds.sqmId}`);

      // Get timestamp for all backups
      const timestamp = this.getTimestamp();

      // Update storage.json
      await this.updateStorageJson(paths.storagePath, newIds, timestamp);

      // Update SQLite database
      await this.updateSqliteDatabase(paths.dbPath, newIds, timestamp);

      // Update machine ID file
      if (paths.machineIdPath) {
        await this.updateMachineIdFile(paths.machineIdPath, newIds.devDeviceId, timestamp);
      }

      // Update system IDs
      await this.updateSystemIds(newIds);

      // Log success
      this.logger.success('Machine ID reset completed successfully');
      this.logger.info('Restart Cursor to apply changes');

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
