/**
 * Chrome Launcher Module
 * Handles Chrome browser initialization and management
 * @module modules/chromeLauncher
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const { WEB } = require('../config/appConstants');
const logger = require('../utils/logger')('ChromeLauncher');

// Global browser instance for efficiency
let globalBrowser = null;

class ChromeLauncher {
  constructor() {
    this.instanceId = Math.random().toString(36).substr(2, 9);
    logger.info(`🆔 ChromeLauncher instance created: ${this.instanceId}`);
  }

  /**
   * Find Chrome executable path
   * @returns {string|undefined} Chrome executable path
   */
  findChrome() {
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser'
    ];
    return paths.find(path => fs.existsSync(path));
  }

  /**
   * Launch Chrome browser
   * @param {Object} options - Browser launch options
   * @returns {Promise<Object>} Browser instance and page
   */
  async launch(options = {}) {
    try {
      let browser = globalBrowser;
      
      // Reuse global browser if available and connected
      if (browser && browser.isConnected()) {
        logger.info(`♻️ Reusing global browser for ${this.instanceId}`);
      } else {
        // Launch new browser
        logger.info('🚀 Launching new Chrome browser...');
        const chromePath = this.findChrome();
        
        const launchOptions = {
          headless: true,
          defaultViewport: { width: 1280, height: 720 },
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security'
          ],
          ...options
        };

        if (chromePath) {
          launchOptions.executablePath = chromePath;
          logger.info(`Found Chrome at: ${chromePath}`);
        }
        
        browser = await puppeteer.launch(launchOptions);
        globalBrowser = browser;
        logger.info('✅ Chrome browser launched successfully');
      }

      // Create new page
      const page = await browser.newPage();
      await page.setUserAgent(WEB.USER_AGENT);
      page.setDefaultTimeout(WEB.CONNECTION_TIMEOUT);

      // Setup request interception to block heavy resources
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        try {
          if (req.isInterceptResolutionHandled()) return;
          const type = req.resourceType();
          (type === 'image' || type === 'font') ? req.abort() : req.continue();
        } catch (error) {
          if (!error.message.includes('already handled')) {
            logger.error('Request interception error:', error);
          }
        }
      });

      logger.info('📄 New page created and configured');
      
      return {
        success: true,
        browser,
        page,
        message: 'Browser launched successfully'
      };

    } catch (error) {
      logger.error('Failed to launch Chrome browser:', error);
      return {
        success: false,
        browser: null,
        page: null,
        message: error.message
      };
    }
  }

  /**
   * Complete cleanup: close page and browser
   * Sequential flow: Close Page → Close Browser → Reset State
   * @param {Object} page - Page instance to close
   * @param {Object} browser - Browser instance to close  
   * @param {boolean} forceCloseBrowser - Force close even if it's the global instance
   * @param {string} instanceId - Instance ID for logging
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanup(page, browser, forceCloseBrowser = false, instanceId = 'unknown') {
    try {
      // Step 1: Close page
      if (page && !page.isClosed()) {
        try {
          await page.close();
          logger.info(`📄 Page closed for instance ${instanceId}`);
        } catch (error) {
          if (!error.message.includes('Protocol error') && !error.message.includes('Target closed')) {
            logger.error('Error closing page:', error);
          }
        }
      }

      // Step 2: Close browser
      await this.closeBrowser(browser, forceCloseBrowser);

      logger.info(`🧹 Chrome cleanup completed for instance ${instanceId}`);
      return { success: true, message: 'Cleanup completed successfully' };

    } catch (error) {
      if (!error.message.includes('Protocol error') && !error.message.includes('Target closed')) {
        logger.error(`Chrome cleanup error for ${instanceId}:`, error);
      }
      return { success: false, message: error.message };
    }
  }

  /**
   * Close browser instance
   * @param {Object} browser - Browser instance to close
   * @param {boolean} forceClose - Force close even if it's the global instance
   */
  async closeBrowser(browser, forceClose = false) {
    try {
      if (browser && browser.isConnected() && (forceClose || browser === globalBrowser)) {
        await browser.close();
        if (browser === globalBrowser) {
          globalBrowser = null;
        }
        logger.info('🔒 Browser closed successfully');
      }
    } catch (error) {
      if (!error.message.includes('Protocol error') && !error.message.includes('Target closed')) {
        logger.error('Error closing browser:', error);
      }
    }
  }

  /**
   * Force close global browser (static method)
   */
  static async forceCloseGlobal() {
    if (globalBrowser && globalBrowser.isConnected()) {
      try {
        await globalBrowser.close();
        globalBrowser = null;
        logger.info('🔒 Global browser force closed');
      } catch (error) {
        if (!error.message.includes('Protocol error') && !error.message.includes('Target closed')) {
          logger.error('Error force closing global browser:', error);
        }
        globalBrowser = null;
      }
    }
  }

  /**
   * Check if global browser is available
   * @returns {boolean} True if global browser is connected
   */
  static isGlobalAvailable() {
    return globalBrowser && globalBrowser.isConnected();
  }
}

module.exports = ChromeLauncher;
