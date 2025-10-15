/**
 * Simple Chrome Launcher Module
 * Handles Chrome browser with clear launch/close/cleanup methods only
 * @module core/browser/chromeLauncher
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const { WEB } = require('../../config/appConstants');
const logger = require('../utils/logger')('ChromeLauncher');

class ChromeLauncher {
  constructor() {
    this.browser = null;
    this.page = null;
    this.instanceId = Math.random().toString(36).substr(2, 9);
    logger.info(`🆔 ChromeLauncher created: ${this.instanceId}`);
  }

  /**
   * Find Chrome executable path
   * @returns {string|undefined} Chrome executable path
   */
  _findChrome() {
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
   * Launch Chrome browser with page
   * @param {Object} options - Browser launch options
   * @returns {Promise<Object>} Launch result with browser and page
   */
  async launch(options = {}) {
    try {
      if (this.browser && this.browser.isConnected()) {
        logger.info(`♻️ Reusing existing browser for ${this.instanceId}`);
        
        // Create new page on existing browser
        this.page = await this.browser.newPage();
        await this._configurePage(this.page);
        
        return {
          success: true,
          browser: this.browser,
          page: this.page,
          message: 'Page created on existing browser'
        };
      }

      // Launch new browser
      logger.info(`🚀 Launching Chrome browser for ${this.instanceId}...`);
      const chromePath = this._findChrome();
      
      const launchOptions = {
        headless: true,
        defaultViewport: { width: 1280, height: 720 },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        ...options
      };

      if (chromePath) {
        launchOptions.executablePath = chromePath;
      }
      
      this.browser = await puppeteer.launch(launchOptions);
      this.page = await this.browser.newPage();
      await this._configurePage(this.page);

      logger.info(`✅ Chrome launched successfully for ${this.instanceId}`);
      
      return {
        success: true,
        browser: this.browser,
        page: this.page,
        message: 'Browser launched successfully'
      };

    } catch (error) {
      logger.error(`Failed to launch Chrome for ${this.instanceId}:`, error);
      return {
        success: false,
        browser: null,
        page: null,
        message: error.message
      };
    }
  }

  /**
   * Configure page with default settings
   * @param {Object} page - Puppeteer page
   */
  async _configurePage(page) {
    await page.setUserAgent(WEB.USER_AGENT);
    page.setDefaultTimeout(WEB.CONNECTION_TIMEOUT);

    // Setup request interception
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      try {
        if (req.isInterceptResolutionHandled()) return;
        const type = req.resourceType();
        (type === 'image' || type === 'font') ? req.abort() : req.continue();
      } catch (error) {
        if (!error.message.includes('already handled')) {
          logger.warn('Request interception error:', error.message);
        }
      }
    });
  }

  /**
   * Close current page only (keep browser alive)
   * @returns {Promise<Object>} Close result
   */
  async close() {
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
        this.page = null;
        logger.info(`📄 Page closed for ${this.instanceId}`);
      }
      
      return { success: true, message: 'Page closed successfully' };
    } catch (error) {
      logger.error(`Error closing page for ${this.instanceId}:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Complete cleanup: close page and browser
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanup() {
    try {
      // Close page first
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
        this.page = null;
        logger.info(`📄 Page closed for ${this.instanceId}`);
      }

      // Close browser
      if (this.browser && this.browser.isConnected()) {
        await this.browser.close();
        this.browser = null;
        logger.info(`🔒 Browser closed for ${this.instanceId}`);
      }

      logger.info(`🧹 Cleanup completed for ${this.instanceId}`);
      return { success: true, message: 'Cleanup completed successfully' };

    } catch (error) {
      logger.error(`Cleanup error for ${this.instanceId}:`, error);
      this.page = null;
      this.browser = null;
      return { success: false, message: error.message };
    }
  }

  /**
   * Check if browser and page are ready
   * @returns {boolean} True if ready
   */
  isReady() {
    return this.browser && 
           this.browser.isConnected() && 
           this.page && 
           !this.page.isClosed();
  }
}

module.exports = ChromeLauncher;
