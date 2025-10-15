/**
 * Puppeteer Configuration
 * Skip Chrome download to avoid network issues
 */

const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Skip downloading Chrome during npm install
  skipDownload: true,
  
  // Use system Chrome if available
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  
  // Cache directory
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
