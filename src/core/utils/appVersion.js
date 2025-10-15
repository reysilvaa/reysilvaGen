/**
 * Application Version Utility
 * Provides consistent version handling across all modules
 * @module core/utils/appVersion
 */

const path = require('path');

/**
 * Get application version from package.json
 * This is the single source of truth for app version
 * @returns {string} Application version
 */
function getAppVersion() {
  const packageJsonPath = path.join(__dirname, '../../../package.json');
  const packageJson = require(packageJsonPath);
  return packageJson.version;
}

/**
 * Get version for Electron app.getVersion() compatibility
 * This ensures Electron's internal version matches our package.json
 * @returns {string} Application version
 */
function getElectronVersion() {
  // For auto-updater compatibility, we should use the same version
  return getAppVersion();
}

module.exports = {
  getAppVersion,
  getElectronVersion
};
