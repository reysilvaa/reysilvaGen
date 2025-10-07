const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

class ConfigManager {
  constructor(configPath = null) {
    if (!configPath) {
      const { app } = require("electron");
      const userDataPath = app.getPath("userData");
      configPath = path.join(userDataPath, "reysilvagen.cfg");
    }

    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  loadConfig() {
    if (fs.existsSync(this.configPath)) {
      try {
        const data = fs.readFileSync(this.configPath, "utf8");
        return JSON.parse(data);
      } catch (error) {
        console.error("Error loading config, using defaults:", error);
        return this.getDefaultConfig();
      }
    } else {
      const defaultConfig = this.getDefaultConfig();
      this.saveConfig(defaultConfig);
      return defaultConfig;
    }
  }

  getDefaultConfig() {
    const { hash, salt } = this.hashPassword("admin123");

    return {
      admins: [
        {
          id: 1,
          username: "admin",
          password_hash: hash,
          salt: salt,
          created_at: new Date().toISOString(),
          last_login: null,
        },
      ],
      bins: [
        {
          id: 1,
          bin_pattern: "552461",
          card_type: "Mastercard",
          description: "Mastercard Debit",
          is_active: 1,
          created_at: new Date().toISOString(),
          created_by: "system",
        },
        {
          id: 2,
          bin_pattern: "559888039",
          card_type: "Mastercard",
          description: "Mastercard Debit",
          is_active: 1,
          created_at: new Date().toISOString(),
          created_by: "system",
        },
      ],
      settings: {},
      sessions: [],
      nextAdminId: 2,
      nextBinId: 3,
      nextSessionId: 1,
    };
  }

  saveConfig(config = null) {
    const data = JSON.stringify(config || this.config, null, 2);
    fs.writeFileSync(this.configPath, data, "utf8");
  }

  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");
    return { hash, salt };
  }

  verifyPassword(password, hash, salt) {
    const testHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");
    return hash === testHash;
  }

  authenticateAdmin(username, password) {
    const admin = this.config.admins.find((a) => a.username === username);

    if (!admin) {
      return { success: false, message: "Invalid username or password" };
    }

    if (!this.verifyPassword(password, admin.password_hash, admin.salt)) {
      return { success: false, message: "Invalid username or password" };
    }

    admin.last_login = new Date().toISOString();

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    this.config.sessions.push({
      id: this.config.nextSessionId++,
      username: username,
      session_token: sessionToken,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    this.saveConfig();

    return {
      success: true,
      sessionToken,
      username,
      expiresAt,
    };
  }

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

  logout(sessionToken) {
    this.config.sessions = this.config.sessions.filter(
      (s) => s.session_token !== sessionToken
    );
    this.saveConfig();
  }

  getAllBins() {
    return this.config.bins.filter((b) => b.is_active === 1);
  }

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

      return { success: true, id: newBin.id };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  updateBin(id, binPattern, cardType, description) {
    try {
      const bin = this.config.bins.find((b) => b.id === id);

      if (!bin) {
        return { success: false, message: "BIN not found" };
      }

      bin.bin_pattern = binPattern;
      bin.card_type = cardType;
      bin.description = description;

      this.saveConfig();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  deleteBin(id) {
    try {
      const bin = this.config.bins.find((b) => b.id === id);

      if (!bin) {
        return { success: false, message: "BIN not found" };
      }

      bin.is_active = 0;
      this.saveConfig();

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getSetting(key) {
    return this.config.settings[key] || null;
  }

  setSetting(key, value) {
    this.config.settings[key] = value;
    this.saveConfig();
  }

  cleanupExpiredSessions() {
    const now = new Date();
    this.config.sessions = this.config.sessions.filter(
      (s) => new Date(s.expires_at) > now
    );
    this.saveConfig();
  }

  getConfigPath() {
    return this.configPath;
  }

  resetToDefault() {
    const defaultConfig = this.getDefaultConfig();
    this.config = defaultConfig;
    this.saveConfig();
    return true;
  }

  close() {
    this.saveConfig();
  }
}

module.exports = ConfigManager;
