/**
 * Development Configuration
 * Settings and utilities for development environment
 */

const path = require("path");

const DEVELOPMENT_CONFIG = {
  // Hot reload configuration
  hotReload: {
    enabled: true, // Set to false to disable hot reload
    electron: path.join(__dirname, '../../node_modules/electron/dist', process.platform === 'win32' ? 'electron.exe' : 'electron'),
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
  if (DEVELOPMENT_CONFIG.hotReload.enabled) {
    try {
      // Get electron executable path - direct approach
      const electronBin = process.platform === 'win32' ? 'electron.exe' : 'electron';
      const electronPath = path.join(__dirname, '../../node_modules/electron/dist', electronBin);
      
      console.log('🔧 Using electron path:', electronPath);
      
      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(electronPath)) {
        throw new Error(`Electron executable not found at: ${electronPath}`);
      }
      
      console.log('✅ Electron executable found and accessible');
      
      require("electron-reload")(path.join(__dirname, '../..'), {
        electron: electronPath,
        hardResetMethod: 'exit',
        awaitWriteFinish: true,
        ignored: /node_modules|[\/\\]\.|dev-user-data|dist|cache|build/
      });
      
      console.log('✅ electron-reload initialized successfully');
      
    } catch (error) {
      console.warn('⚠️ electron-reload failed to initialize:', error.message);
      console.warn('📝 Hot reload disabled, you\'ll need to restart manually');
      
      // Debug info
      console.log('🔍 Debug info:');
      console.log('  - Platform:', process.platform);
      console.log('  - Project root:', path.join(__dirname, '../..'));
      console.log('  - Expected electron path:', path.join(__dirname, '../../node_modules/electron/dist', process.platform === 'win32' ? 'electron.exe' : 'electron'));
      
      // Check if electron directory exists
      const fs = require('fs');
      const electronDir = path.join(__dirname, '../../node_modules/electron');
      console.log('  - Electron dir exists:', fs.existsSync(electronDir));
      
      if (fs.existsSync(electronDir)) {
        const distDir = path.join(electronDir, 'dist');
        console.log('  - Electron dist dir exists:', fs.existsSync(distDir));
        
        if (fs.existsSync(distDir)) {
          const files = fs.readdirSync(distDir);
          console.log('  - Files in dist:', files.slice(0, 5)); // Show first 5 files
        }
      }
    }
  } else {
    console.log('📝 Hot reload disabled by configuration');
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

