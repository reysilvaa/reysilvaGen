/**
 * Configuration Manager
 * Handles application configuration, BIN management, and admin authentication
 * @module modules/configManager
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { FILES, SESSION, CRYPTO } = require('../config/appConstants');
const logger = require('../utils/logger').default.child('ConfigManager');

class ConfigManager {
  constructor(configPath = null) {
    if (!configPath) {
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      configPath = path.join(userDataPath, FILES.CONFIG_NAME);
    }

    this.configPath = configPath;
    this.config = this.loadConfig();
    
    logger.info(`Config loaded from: ${configPath}`);
  }

  /**
   * Load configuration from file or create default
   * @returns {Object} Configuration object
   */
  loadConfig() {
    if (fs.existsSync(this.configPath)) {
      try {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        logger.error('Error loading config, using defaults:', error);
        return this.getDefaultConfig();
      }
    } else {
      const defaultConfig = this.getDefaultConfig();
      this.saveConfig(defaultConfig);
      logger.info('Created new configuration file');
      return defaultConfig;
    }
  }

  /**
   * Get default configuration structure
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    const { hash, salt } = this.hashPassword('admin123');

    return {
      admins: [
        {
          id: 1,
          username: 'admin',
          password_hash: hash,
          salt: salt,
          created_at: new Date().toISOString(),
          last_login: null,
        },
      ],
      bins: [
        {
          id: 1,
          bin_pattern: '552461',
          card_type: 'Mastercard',
          description: 'Mastercard Debit',
          is_active: 1,
          created_at: new Date().toISOString(),
          created_by: 'system',
        },
        {
          id: 2,
          bin_pattern: '559888039',
          card_type: 'Mastercard',
          description: 'Mastercard Debit',
          is_active: 1,
          created_at: new Date().toISOString(),
          created_by: 'system',
        },
      ],
      settings: {},
      sessions: [],
      nextAdminId: 2,
      nextBinId: 3,
      nextSessionId: 1,
    };
  }

  /**
   * Save configuration to file
   * @param {Object} config - Configuration object to save
   */
  saveConfig(config = null) {
    try {
      const data = JSON.stringify(config || this.config, null, 2);
      fs.writeFileSync(this.configPath, data, 'utf8');
    } catch (error) {
      logger.error('Failed to save config:', error);
      throw error;
    }
  }

  /**
   * Hash password with salt
   * @param {string} password - Plain text password
   * @returns {Object} Hash and salt
   */
  hashPassword(password) {
    const salt = crypto.randomBytes(CRYPTO.SALT_LENGTH).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, CRYPTO.HASH_ITERATIONS, CRYPTO.HASH_KEY_LENGTH, CRYPTO.HASH_ALGORITHM)
      .toString('hex');
    return { hash, salt };
  }

  /**
   * Verify password against stored hash
   * @param {string} password - Plain text password
   * @param {string} hash - Stored password hash
   * @param {string} salt - Stored salt
   * @returns {boolean} True if password matches
   */
  verifyPassword(password, hash, salt) {
    const testHash = crypto
      .pbkdf2Sync(password, salt, CRYPTO.HASH_ITERATIONS, CRYPTO.HASH_KEY_LENGTH, CRYPTO.HASH_ALGORITHM)
      .toString('hex');
    return hash === testHash;
  }

  /**
   * Authenticate admin user
   * @param {string} username - Admin username
   * @param {string} password - Admin password
   * @returns {Object} Authentication result
   */
  authenticateAdmin(username, password) {
    const admin = this.config.admins.find((a) => a.username === username);

    if (!admin) {
      logger.warn(`Failed login attempt for username: ${username}`);
      return { success: false, message: 'Invalid username or password' };
    }

    if (!this.verifyPassword(password, admin.password_hash, admin.salt)) {
      logger.warn(`Invalid password for username: ${username}`);
      return { success: false, message: 'Invalid username or password' };
    }

    // Update last login
    admin.last_login = new Date().toISOString();

    // Create session
    const sessionToken = crypto.randomBytes(SESSION.TOKEN_LENGTH).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION.EXPIRY_HOURS * 60 * 60 * 1000);

    this.config.sessions.push({
      id: this.config.nextSessionId++,
      username: username,
      session_token: sessionToken,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    this.saveConfig();

    logger.success(`Admin logged in: ${username}`);

    return {
      success: true,
      sessionToken,
      username,
      expiresAt,
    };
  }

  /**
   * Verify session token
   * @param {string} sessionToken - Session token to verify
   * @returns {Object} Verification result
   */
  verifySession(sessionToken) {
    const now = new Date();
    const session = this.config.sessions.find(
      (s) => s.session_token === sessionToken && new Date(s.expires_at) > now
    );

    if (!session) {
      return { valid: false };
    }

    return { valid: true, username: session.username };
  }

  /**
   * Logout and remove session
   * @param {string} sessionToken - Session token to remove
   */
  logout(sessionToken) {
    this.config.sessions = this.config.sessions.filter(
      (s) => s.session_token !== sessionToken
    );
    this.saveConfig();
    logger.info('Admin logged out');
  }

  /**
   * Get all active BINs
   * @returns {Array} Array of active BINs
   */
  getAllBins() {
    return this.config.bins.filter((b) => b.is_active === 1);
  }

  /**
   * Get active BINs with minimal data
   * @returns {Array} Array of simplified BIN objects
   */
  getActiveBins() {
    return this.config.bins
      .filter((b) => b.is_active === 1)
      .map((b) => ({
        id: b.id,
        bin_pattern: b.bin_pattern,
        card_type: b.card_type,
        description: b.description,
      }));
  }

  /**
   * Add new BIN
   * @param {string} binPattern - BIN pattern
   * @param {string} cardType - Card type
   * @param {string} description - BIN description
   * @param {string} createdBy - Creator username
   * @returns {Object} Operation result
   */
  addBin(binPattern, cardType, description, createdBy) {
    try {
      const newBin = {
        id: this.config.nextBinId++,
        bin_pattern: binPattern,
        card_type: cardType,
        description: description,
        is_active: 1,
        created_at: new Date().toISOString(),
        created_by: createdBy,
      };

      this.config.bins.push(newBin);
      this.saveConfig();

      logger.success(`BIN added: ${binPattern} (${cardType})`);

      return { success: true, id: newBin.id };
    } catch (error) {
      logger.error('Failed to add BIN:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Update existing BIN
   * @param {number} id - BIN ID
   * @param {string} binPattern - New BIN pattern
   * @param {string} cardType - New card type
   * @param {string} description - New description
   * @returns {Object} Operation result
   */
  updateBin(id, binPattern, cardType, description) {
    try {
      const bin = this.config.bins.find((b) => b.id === id);

      if (!bin) {
        return { success: false, message: 'BIN not found' };
      }

      bin.bin_pattern = binPattern;
      bin.card_type = cardType;
      bin.description = description;
      bin.updated_at = new Date().toISOString();

      this.saveConfig();
      
      logger.success(`BIN updated: ${binPattern} (${cardType})`);

      return { success: true };
    } catch (error) {
      logger.error('Failed to update BIN:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Soft delete BIN
   * @param {number} id - BIN ID to delete
   * @returns {Object} Operation result
   */
  deleteBin(id) {
    try {
      const bin = this.config.bins.find((b) => b.id === id);

      if (!bin) {
        return { success: false, message: 'BIN not found' };
      }

      bin.is_active = 0;
      bin.deleted_at = new Date().toISOString();
      this.saveConfig();

      logger.success(`BIN deleted: ${bin.bin_pattern}`);

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete BIN:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get setting value
   * @param {string} key - Setting key
   * @returns {*} Setting value or null
   */
  getSetting(key) {
    return this.config.settings[key] || null;
  }

  /**
   * Set setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  setSetting(key, value) {
    this.config.settings[key] = value;
    this.saveConfig();
    logger.info(`Setting updated: ${key}`);
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    const initialCount = this.config.sessions.length;
    
    this.config.sessions = this.config.sessions.filter(
      (s) => new Date(s.expires_at) > now
    );
    
    const removedCount = initialCount - this.config.sessions.length;
    
    if (removedCount > 0) {
      this.saveConfig();
      logger.info(`Cleaned up ${removedCount} expired session(s)`);
    }
  }

  /**
   * Get configuration file path
   * @returns {string} Configuration file path
   */
  getConfigPath() {
    return this.configPath;
  }

  /**
   * Reset configuration to default
   * @returns {boolean} Always true
   */
  resetToDefault() {
    const defaultConfig = this.getDefaultConfig();
    this.config = defaultConfig;
    this.saveConfig();
    logger.warn('Configuration reset to default');
    return true;
  }

  /**
   * Close and save configuration
   */
  close() {
    this.saveConfig();
    logger.info('Configuration saved and closed');
  }
}

module.exports = ConfigManager;
