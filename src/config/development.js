/**
 * Development Configuration
 * Settings and utilities for development environment
 */

const path = require("path");

const DEVELOPMENT_CONFIG = {
  // Hot reload configuration
  hotReload: {
    electron: path.join(__dirname, '../../node_modules/.bin/electron'),
    hardResetMethod: "exit",
    awaitWriteFinish: true,
    ignored: /node_modules|[\/\\]\.|dev-user-data/
  },

  // Command line switches for development
  commandLineSwitches: [
    '--disable-gpu-sandbox',
    '--disable-disk-cache'
  ],

  // Development paths
  paths: {
    userData: path.join(__dirname, '../../dev-user-data')
  },

  // Development window settings
  window: {
    openDevTools: true,
    autoUpdater: false
  }
};

/**
 * Setup development environment
 * @param {Electron.App} app - Electron app instance
 */
function setupDevelopmentEnvironment(app) {
  // Set custom user data path for development
  app.setPath('userData', DEVELOPMENT_CONFIG.paths.userData);
  
  // Configure hot reload
  try {
    const electronPath = require('electron');
    require("electron-reload")(path.join(__dirname, '../..'), {
      electron: electronPath,
      hardResetMethod: 'exit',
      awaitWriteFinish: true,
      ignored: /node_modules|[\/\\]\.|dev-user-data|dist|cache|build/
    });
  } catch (error) {
    console.warn('⚠️ electron-reload failed to initialize:', error.message);
  }
  
  // Configure command line switches for development
  DEVELOPMENT_CONFIG.commandLineSwitches.forEach(switchFlag => {
    app.commandLine.appendSwitch(switchFlag);
  });
}

module.exports = {
  DEVELOPMENT_CONFIG,
  setupDevelopmentEnvironment
};
