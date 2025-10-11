/**
 * Application Constants
 * Centralized configuration values
 */

const path = require("path");

const APP_CONFIG = {
  // Window dimensions
  window: {
    main: {
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 700
    },
    splash: {
      width: 550,
      height: 400
    },
    admin: {
      width: 1200,
      height: 800
    }
  },

  // Timing
  timing: {
    splashDuration: 1800
  },

  // Paths
  paths: {
    assets: path.join(__dirname, "../../assets"),
    renderer: path.join(__dirname, "../renderer"),
    preload: path.join(__dirname, "../main/preload.js")
  },

  // Icons
  icons: {
    main: path.join(__dirname, "../../assets", "icon.ico")
  },

  // Web preferences
  webPreferences: {
    secure: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  }
};

module.exports = {
  APP_CONFIG
};
