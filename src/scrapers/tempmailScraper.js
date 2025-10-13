/**
 * Tempmail Scraper
 * Headless browser-based scraper for tempmail.ac.id
 * @module scrapers/tempmail-scraper
 */

const { BrowserWindow } = require('electron');
const { WEB, TIMING, XPATH, OTP_PATTERNS, BROWSER_WINDOW } = require('../config/appConstants');
const logger = require('../utils/logger').default.child('Tempmail');

class TempmailScraper {
  constructor() {
    this.window = null;
    this.currentEmail = null;
  }

  /**
   * Create or get hidden browser window
   * @returns {BrowserWindow} Browser window instance
   */
  getWindow() {
    if (!this.window || this.window.isDestroyed()) {
      this.window = new BrowserWindow({
        show: false,
        width: BROWSER_WINDOW.TEMPMAIL_WIDTH,
        height: BROWSER_WINDOW.TEMPMAIL_HEIGHT,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          javascript: true,
          webSecurity: false, // Allow external images
          allowRunningInsecureContent: true
        }
      });

      // Set CSP to allow external images
      this.window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: http:; img-src 'self' data: blob: https: http: *; media-src 'self' data: blob: https: http: *;"
            ]
          }
        });
      });

      logger.info('Browser window created');
    }
    return this.window;
  }

  /**
   * Wait for specified duration
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   * @private
   */
  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute JavaScript in browser context
   * @param {string} script - JavaScript code to execute
   * @returns {Promise<*>} Script execution result
   * @private
   */
  async _executeScript(script) {
    const window = this.getWindow();
    return await window.webContents.executeJavaScript(script);
  }

  /**
   * Load URL and wait for completion
   * @param {string} url - URL to load
   * @returns {Promise<void>}
   * @private
   */
  async _loadURL(url) {
    const window = this.getWindow();
    
    return new Promise((resolve, reject) => {
      const loadHandler = () => {
        resolve();
      };

      window.webContents.once('did-finish-load', loadHandler);
      window.loadURL(url).catch(err => {
        logger.error(`Failed to load URL: ${url}`, err);
        reject(err);
      });
    });
  }

  /**
   * Scrape existing auto-generated email from website
   * @returns {Promise<Object>} Operation result with email
   */
  async scrapeExistingEmail() {
    try {
      logger.info('Scraping existing auto-generated email...');
      
      await this._loadURL(WEB.TEMPMAIL_URL);
      await this._wait(TIMING.TEMPMAIL_LOAD_DELAY);

      const result = await this._executeScript(`
              (function() {
                console.log('🔍 Scraping existing auto-generated email...');
                
          // Primary XPath for email ID
          const emailXPath = '${XPATH.EMAIL_ID}';
                const emailResult = document.evaluate(emailXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                const emailDiv = emailResult.singleNodeValue;
                
                if (emailDiv && emailDiv.textContent && emailDiv.textContent.trim()) {
                  const autoEmail = emailDiv.textContent.trim();
                  if (autoEmail.includes('@')) {
                    console.log('✅ Found auto-generated email:', autoEmail);
                    return { email: autoEmail, found: true };
                  }
                }
                
          // Fallback XPaths
                const altXPaths = [
                  '//*[@x-text="currentEmail"]',
                  '//*[contains(@class, "text-gray-900") and contains(@class, "font-medium")]',
                  '//*[contains(@class, "font-mono") and contains(text(), "@")]'
                ];
                
                for (const xpath of altXPaths) {
                  const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                  if (result.singleNodeValue) {
                    const email = result.singleNodeValue.textContent.trim();
                    if (email.includes('@')) {
                      console.log('✅ Found email via fallback XPath:', email);
                      return { email: email, found: true };
                    }
                  }
                }
                
                console.log('❌ No auto-generated email found');
                return { email: null, found: false };
              })();
            `);

            if (result.found && result.email) {
              this.currentEmail = result.email;
        logger.success(`Using existing auto-generated email: ${result.email}`);
        return {
                success: true, 
                email: result.email, 
                message: 'Email scraped from website',
                isExisting: true
        };
            } else {
        logger.warn('No existing email found, will need to generate');
        return {
                success: false, 
                message: 'No existing email found on website' 
        };
            }
          } catch (error) {
      logger.error('Error scraping existing email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate custom email via form submission
   * @param {string} username - Email username part
   * @param {string} domain - Email domain
   * @returns {Promise<Object>} Operation result
   * @private
   */
  async _generateCustomEmail(username, domain) {
    logger.info(`Creating custom email: ${username}@${domain}`);

    await this._loadURL(WEB.TEMPMAIL_URL);
    await this._wait(TIMING.TEMPMAIL_FORM_DELAY);

    const result = await this._executeScript(`
                (async function() {
        // Click New button to show form if present
                  const newBtn = document.querySelector('[x-on\\\\:click*="in_app = true"]');
                  if (newBtn) {
                    newBtn.click();
          await new Promise(r => setTimeout(r, ${TIMING.TEMPMAIL_ACTION_DELAY}));
                  }
                  
        // Fill username
                  const userInput = document.getElementById('user');
                  if (userInput) {
                    userInput.value = '${username}';
                    userInput.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                  
        // Select domain from dropdown
                  const domainOption = document.querySelector('[x-on\\\\:click*="setDomain(\\'${domain}\\')"]');
                  if (domainOption) {
                    domainOption.click();
                    await new Promise(r => setTimeout(r, 200));
                  }
                  
        // Click create button
                  const createBtn = document.getElementById('create');
                  if (createBtn) {
                    createBtn.click();
          await new Promise(r => setTimeout(r, ${TIMING.TEMPMAIL_CREATE_DELAY}));
                  }
                  
                  // Get generated email
                  const emailDiv = document.getElementById('email_id');
                  if (emailDiv && emailDiv.textContent) {
                    return { email: emailDiv.textContent.trim() };
                  }
                  
                  return { email: null };
                })();
              `);
              
    if (result.email) {
                this.currentEmail = result.email;
      logger.success(`Email created: ${result.email}`);
      return {
        success: true,
        email: result.email,
        message: 'Email created successfully'
      };
              } else {
      logger.error('Failed to create custom email');
      return {
        success: false,
        email: null,
        message: 'Failed to create email'
      };
    }
  }

  /**
   * Generate auto email from website
   * @returns {Promise<Object>} Operation result
   * @private
   */
  async _generateAutoEmail() {
    await this._loadURL(WEB.TEMPMAIL_URL);
    await this._wait(TIMING.TEMPMAIL_RELOAD_DELAY);

    const result = await this._executeScript(`
              (function() {
                const emailDiv = document.getElementById('email_id');
                if (emailDiv && emailDiv.textContent) {
                  return { email: emailDiv.textContent.trim() };
                }
                return { email: null };
              })();
            `);

            if (result.email) {
              this.currentEmail = result.email;
      logger.success(`Auto email generated: ${result.email}`);
      return {
        success: true,
        email: result.email,
        message: 'Email generated successfully'
      };
    }

    return null;
  }

  /**
   * Generate email from tempmail.ac.id
   * @param {string} preferredDomain - Domain for fallback email
   * @param {string} customEmail - Custom email to create (username@domain)
   * @returns {Promise<Object>} Operation result
   */
  async generateEmail(preferredDomain = null, customEmail = null) {
    try {
      // Handle custom email creation
      if (customEmail) {
        const [username, domain] = customEmail.split('@');
        return await this._generateCustomEmail(username, domain);
      }

      // Handle auto generation
      this.currentEmail = null;
      const result = await this._generateAutoEmail();

      if (result) {
        return result;
            } else {
        // Fallback to offline generation
              const fallback = this.generateFallbackEmail(preferredDomain);
        logger.warn('Using offline fallback email');
        return {
          success: true,
          email: fallback,
          message: 'Email generated (offline)',
          isOffline: true
        };
            }
          } catch (error) {
      logger.error('Error generating email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Extract OTP code from email content
   * @param {string} emailId - Email ID
   * @returns {Promise<string|null>} Extracted OTP or null
   * @private
   */
  async _extractOTP(emailId) {
    try {
      const otpPatternsStr = OTP_PATTERNS.map(p => p.source).join('|');
      
      const result = await this._executeScript(`
        (function() {
          const messageXPath = '//*[@id="message-${emailId}"]';
          const messageResult = document.evaluate(messageXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const messageDiv = messageResult.singleNodeValue;
          
          if (!messageDiv) return null;
          
          // Get content from iframe
          const iframeXPath = './/iframe';
          const iframeResult = document.evaluate(iframeXPath, messageDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const iframe = iframeResult.singleNodeValue;
          
          let content = '';
          if (iframe) {
            const srcdoc = iframe.getAttribute('srcdoc');
            if (srcdoc) {
              content = srcdoc.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
                             .replace(/&amp;#x27;/g, "'").replace(/&amp;/g, '&');
            }
          }
          
          if (!content) {
            content = messageDiv.textContent;
          }
          
          // Try OTP patterns
          const otpPatterns = [
            /(?:one-time\\s+code\\s+is|code\\s+is|otp\\s+is|verification\\s+code)\\s*[:;]?\\s*(\\d{4,8})/gi,
            /\\b(\\d{6})\\b/g,
            /your\\s+(?:one-time\\s+)?code\\s+is[\\s:]+(\\d{4,8})/gi
          ];
          
          for (const pattern of otpPatterns) {
            const matches = content.match(pattern);
            if (matches) {
              for (const match of matches) {
                const code = match.match(/\\d{4,8}/);
                if (code && code[0].length >= 4 && code[0].length <= 8) {
                  return code[0];
                }
              }
            }
          }
          return null;
        })();
      `);

      return result;
    } catch (error) {
      logger.debug('Error extracting OTP:', error);
      return null;
    }
  }

  /**
   * Extract date from email
   * @param {string} emailId - Email ID
   * @returns {Promise<string|null>} Extracted date or null
   * @private
   */
  async _extractEmailDate(emailId) {
    try {
      const result = await this._executeScript(`
        (function() {
          const messageDiv = document.querySelector('#message-${emailId}');
          if (!messageDiv) return null;
          
          // XPath for date field
          const xpath = './/div[contains(@class, "text-xs") and contains(@class, "overflow-ellipsis")]';
          const xpathResult = document.evaluate(xpath, messageDiv, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          
          for (let i = 0; i < xpathResult.snapshotLength; i++) {
            const element = xpathResult.snapshotItem(i);
            const text = element.textContent.trim();
            
            // Check if matches date pattern
            if (text.match(/^\\d{1,2}\\s+\\w{3}\\s+\\d{4}\\s+\\d{1,2}:\\d{2}\\s+(AM|PM)$/i)) {
              return text;
            }
          }
          
          // Fallback XPath
          const dateXPath = './/div[text()="Date"]/following-sibling::div[contains(@class, "text-xs")]';
          const dateResult = document.evaluate(dateXPath, messageDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          
          if (dateResult.singleNodeValue) {
            return dateResult.singleNodeValue.textContent.trim();
          }
          
          return null;
        })();
      `);

      return result;
    } catch (error) {
      logger.debug('Error extracting date:', error);
      return null;
    }
  }

  /**
   * Parse email date string to timestamp
   * @param {string} dateString - Date string to parse
   * @returns {number} Timestamp
   * @private
   */
  _parseEmailDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.getTime();
    } catch (error) {
      return Date.now();
    }
  }

  /**
   * Check inbox for emails
   * @returns {Promise<Object>} Inbox check result with emails array
   */
  async checkInbox() {
    try {
      if (!this.window || this.window.isDestroyed()) {
        return {
          success: false,
          message: 'No email generated yet',
          emails: []
        };
      }

      if (!this.currentEmail) {
        return {
          success: false,
          message: 'No email active',
          emails: []
        };
      }

      logger.info(`Checking inbox for: ${this.currentEmail}`);

      // Reload page to get latest emails
      await this.window.webContents.reload();
      await new Promise(resolve => {
        this.window.webContents.once('did-finish-load', resolve);
      });
      await this._wait(TIMING.TEMPMAIL_LOAD_DELAY);

      const result = await this._executeScript(`
              (function() {
                const emails = [];
                
          // Use XPath to find email items with data-id
          const emailXPath = '${XPATH.EMAIL_WITH_DATA_ID}';
                const emailResult = document.evaluate(emailXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                
                console.log('📧 Found email items via XPath:', emailResult.snapshotLength);
                
                for (let i = 0; i < emailResult.snapshotLength; i++) {
                  const item = emailResult.snapshotItem(i);
                  const id = item.getAttribute('data-id');
                  
            // Skip invalid IDs
                  if (!id || id === '0' || id === 'null') {
                    continue;
                  }
                  
            // Get child divs for sender and subject
                  const childDivXPath = './div';
                  const childDivResult = document.evaluate(childDivXPath, item, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                  
                  const senderDiv = childDivResult.snapshotLength > 0 ? childDivResult.snapshotItem(0) : null;
                  const subjectDiv = childDivResult.snapshotLength > 1 ? childDivResult.snapshotItem(1) : null;
                  
            // Extract sender info
                  let senderName = 'Unknown';
                  let senderEmail = '';
                  
                  if (senderDiv) {
                    const textNodeXPath = './text()[normalize-space()]';
                    const textResult = document.evaluate(textNodeXPath, senderDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    if (textResult.singleNodeValue) {
                      senderName = textResult.singleNodeValue.textContent.trim();
                    }
                    
                    const emailXPath = './/div[contains(@class, "text-xs")]';
                    const emailResult = document.evaluate(emailXPath, senderDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    if (emailResult.singleNodeValue) {
                      senderEmail = emailResult.singleNodeValue.textContent.trim();
                    }
                  }
                  
                  const email = {
                    id,
                    sender: senderName,
                    from: senderEmail,
                    subject: subjectDiv?.textContent.trim() || 'No Subject',
              time: 'Just now',
              date: 'Just now',
                    read: false,
              timestamp: Date.now()
                  };
                  
                  emails.push(email);
                }
                
          // Sort by timestamp (newest first)
                emails.sort((a, b) => b.timestamp - a.timestamp);
                
                return { emails };
              })();
            `);
            
      // Extract OTP and date for each email
            for (const email of result.emails) {
        const otp = await this._extractOTP(email.id);
              if (otp) {
                email.otp = otp;
                email.preview = `OTP: ${otp} - ${email.subject}`;
              } else {
                email.preview = email.subject;
              }
              
        const emailDate = await this._extractEmailDate(email.id);
              if (emailDate && emailDate !== 'Unknown') {
                email.time = emailDate;
                email.date = emailDate;
          email.timestamp = this._parseEmailDate(emailDate);
              }
            }

      // Sort again after updating dates
            result.emails.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      logger.success(`Inbox checked: ${result.emails.length} email(s) found`);

      return {
              success: true,
              emails: result.emails,
              count: result.emails.length,
        message: result.emails.length > 0 
          ? `Found ${result.emails.length} email(s)` 
          : 'Inbox is empty'
      };
          } catch (error) {
      logger.error('Error checking inbox:', error);
      return {
        success: false,
        message: error.message,
        emails: []
      };
    }
  }

  /**
   * Read email details
   * @param {string} emailId - Email ID to read
   * @returns {Promise<Object>} Email content
   */
  async readEmail(emailId) {
    try {
      if (!this.window || this.window.isDestroyed()) {
        return { success: false, message: 'No email generated yet' };
      }

      logger.info(`Reading email ID: ${emailId}`);

      // Click on email to open it
      const clicked = await this._executeScript(`
        (function() {
          const emailXPath = '//*[@data-id="${emailId}"]';
          const emailResult = document.evaluate(emailXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const emailItem = emailResult.singleNodeValue;
          
          if (emailItem) {
            emailItem.click();
            return true;
          }
          return false;
        })();
      `);

      if (!clicked) {
        logger.error(`Email item not found: ${emailId}`);
        return { success: false, message: 'Email not found in inbox' };
      }

      // Wait for email content to load
      await this._wait(TIMING.TEMPMAIL_EMAIL_OPEN_DELAY);

      const result = await this._executeScript(`
        (function() {
          const messageXPath = '//*[@id="message-${emailId}"]';
          const messageResult = document.evaluate(messageXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const messageDiv = messageResult.singleNodeValue;
          
          if (!messageDiv) {
            return { success: false, message: 'Email content not loaded' };
          }

          // Extract date
          let date = 'Unknown';
          const dateXPath = './/div[contains(@class, "text-xs") and contains(@class, "overflow-ellipsis") and contains(text(), "20")]';
          const dateResult = document.evaluate(dateXPath, messageDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          
          if (dateResult.singleNodeValue) {
            const dateText = dateResult.singleNodeValue.textContent.trim();
            if (dateText.match(/^\\d{1,2}\\s+\\w{3}\\s+\\d{4}\\s+\\d{1,2}:\\d{2}\\s+(AM|PM)$/i)) {
              date = dateText;
            }
          }
          
          // Extract sender info
          let senderName = 'Unknown';
          let senderEmail = '';
          
          const senderXPath = './/div[contains(@class, "flex") and contains(@class, "justify-between")]/div[1]';
          const senderResult = document.evaluate(senderXPath, messageDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          
          if (senderResult.singleNodeValue) {
            const senderDiv = senderResult.singleNodeValue;
            
            const nameXPath = './text()[normalize-space()]';
            const nameResult = document.evaluate(nameXPath, senderDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (nameResult.singleNodeValue) {
              senderName = nameResult.singleNodeValue.textContent.trim();
            }
            
            const emailXPath = './/div[contains(@class, "text-xs")]';
            const emailResult = document.evaluate(emailXPath, senderDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (emailResult.singleNodeValue) {
              senderEmail = emailResult.singleNodeValue.textContent.trim();
            }
          }
          
          // Extract subject
          const subjectXPath = './/div[contains(@class, "border-t") and contains(@class, "border-b") and contains(@class, "border-dashed")]';
          const subjectResult = document.evaluate(subjectXPath, messageDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const subject = subjectResult.singleNodeValue ? subjectResult.singleNodeValue.textContent.trim() : 'No Subject';
          
          // Extract body from iframe
          const iframeXPath = './/iframe';
          const iframeResult = document.evaluate(iframeXPath, messageDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const iframe = iframeResult.singleNodeValue;
          
          let body = '';
          let rawContent = '';
          
          if (iframe) {
            const srcdoc = iframe.getAttribute('srcdoc');
            if (srcdoc) {
              rawContent = srcdoc.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
                                 .replace(/&amp;#x27;/g, "'").replace(/&amp;/g, '&');
              body = rawContent;
            }
          }
          
          // Extract OTP from content
          const fullText = rawContent || body;
          const otpPatterns = [
            /(?:one-time\\s+code\\s+is|code\\s+is|otp\\s+is|verification\\s+code)\\s*[:;]?\\s*(\\d{4,8})/gi,
            /\\b(\\d{6})\\b/g,
            /your\\s+(?:one-time\\s+)?code\\s+is[\\s:]+(\\d{4,8})/gi
          ];
          
          let otp = null;
          for (const pattern of otpPatterns) {
            const matches = fullText.match(pattern);
            if (matches) {
              for (const match of matches) {
                const code = match.match(/\\d{4,8}/);
                if (code && code[0].length >= 4 && code[0].length <= 8) {
                  otp = code[0];
                  break;
                }
              }
              if (otp) break;
            }
          }
          
          if (!body) {
            body = '<div style="padding: 20px; text-align: center; color: #666;">Email content not available</div>';
          }

          return {
            success: true,
            email: {
              id: '${emailId}',
              from: senderEmail || senderName,
              sender: senderName,
              subject: subject,
              date: date,
              body: body,
              html: body,
              text: body.replace(/<[^>]*>/g, '').substring(0, 500),
              otp: otp
            }
          };
        })();
      `);

      logger.success(`Email read successfully: ${emailId}`);
      return result;
    } catch (error) {
      logger.error('Error reading email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get current active email address
   * @returns {string|null} Current email or null
   */
  getCurrentEmail() {
    return this.currentEmail;
  }

  /**
   * Toggle debug window visibility
   * @returns {Object} Toggle result
   */
  toggleDebug() {
    if (!this.window || this.window.isDestroyed()) {
      return { success: false, message: 'No window available' };
    }

    if (this.window.isVisible()) {
      this.window.hide();
      logger.info('Debug window hidden');
      return { success: true, visible: false };
    } else {
      this.window.show();
      this.window.webContents.openDevTools();
      logger.info('Debug window shown');
      return { success: true, visible: true };
    }
  }

  /**
   * Clear and destroy window
   */
  clear() {
    if (this.window && !this.window.isDestroyed()) {
      try {
        this.window.webContents.session.clearCache();
        this.window.webContents.session.clearStorageData();
      } catch (err) {
        // Ignore cleanup errors
        logger.debug('Error during cleanup:', err);
      }
      this.window.destroy();
      this.window = null;
    }
    this.currentEmail = null;
    logger.info('Tempmail session cleared');
  }

  /**
   * Generate fallback email offline
   * @param {string} preferredDomain - Preferred domain
   * @returns {string} Generated fallback email
   */
  generateFallbackEmail(preferredDomain = null) {
    const randomString = Math.random().toString(36).substring(2, 10);
    const domain = preferredDomain && WEB.DEFAULT_DOMAINS.includes(preferredDomain)
      ? preferredDomain 
      : WEB.DEFAULT_DOMAINS[Math.floor(Math.random() * WEB.DEFAULT_DOMAINS.length)];
    
    this.currentEmail = `${randomString}@${domain}`;
    logger.info(`Generated fallback email: ${this.currentEmail}`);
    return this.currentEmail;
  }

  /**
   * Switch to existing email (fast - no scraping)
   * @param {string} email - Email address to switch to
   * @returns {Promise<Object>} Switch result
   */
  async switchToEmail(email) {
    try {
      logger.info(`Switching to: ${email}`);

      const switchUrl = `${WEB.TEMPMAIL_SWITCH_URL}/${email}`;
      await this._loadURL(switchUrl);
      await this._wait(1500);

      // Verify displayed email
      const displayedEmail = await this._executeScript(`
        (function() {
          const emailEl = document.querySelector('[x-text="currentEmail"]') || 
                         document.querySelector('.text-gray-900.font-medium');
          return emailEl ? emailEl.textContent.trim() : null;
        })();
      `);

      this.currentEmail = displayedEmail || email;
      logger.success(`Switched to: ${this.currentEmail}`);
      
      return {
        success: true,
        email: this.currentEmail,
        message: `Switched to ${this.currentEmail}`
      };
    } catch (error) {
      logger.error('Switch error:', error);
      return {
        success: false,
        message: error.message,
        email: null
      };
    }
  }

  /**
   * Delete current email (fast - click delete button)
   * @returns {Promise<Object>} Delete result
   */
  async deleteCurrentEmail() {
    try {
      logger.info(`Deleting email: ${this.currentEmail}`);
      
      if (!this.window) {
        return {
          success: false,
          message: 'No active session'
        };
      }

      // Click delete button
      await this._executeScript(`
        (function() {
          const deleteBtn = document.querySelector('${XPATH.DELETE_BUTTON}');
          if (deleteBtn) {
            deleteBtn.click();
            return true;
          }
          return false;
        })();
      `);

      await this._wait(1000);

      const oldEmail = this.currentEmail;
      this.currentEmail = null;

      logger.success(`Deleted: ${oldEmail}`);

      return {
        success: true,
        message: `Deleted ${oldEmail}`,
        deletedEmail: oldEmail
      };
    } catch (error) {
      logger.error('Delete error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = TempmailScraper;
