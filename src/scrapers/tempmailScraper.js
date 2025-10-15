/**
 * Tempmail Scraper - CRUD Implementation
 * Lightweight and reliable scraper for tempmail.ac.id using Puppeteer
 * 
 * CRUD Methods:
 * - create(params) - Generate new email
 * - show(params) - Get current/existing/available emails
 * - delete(params) - Delete current or specific email
 * - execute(params) - Execute various operations
 * 
 * @module scrapers/tempmail-scraper
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { WEB, TIMING, OTP_PATTERNS } = require('../config/appConstants');
const logger = require('../utils/logger')('Tempmail');

class TempmailScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.currentEmail = null;
    this.isInitialized = false;
    this.isInitializing = false;
  }

  /**
   * Find Chrome executable path
   * @returns {string|undefined} Chrome executable path
   * @private
   */
  _findChrome() {
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser'
    ];

    for (const chromePath of possiblePaths) {
        if (fs.existsSync(chromePath)) {
          return chromePath;
        }
      }
    return undefined;
  }

  /**
   * Initialize Puppeteer browser
   * @returns {Promise<void>}
   * @private
   */
  async _initializeBrowser() {
    try {
      // Check if already initialized or initializing
      if (this.browser && this.page && this.isInitialized) {
        logger.info('Browser already initialized, skipping...');
        return;
      }
      
      // Prevent multiple simultaneous initialization
      if (this.isInitializing) {
        logger.info('Browser initialization already in progress, waiting...');
        // Wait for initialization to complete
        while (this.isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return;
      }
      
      // Mark as initializing
      this.isInitializing = true;

      logger.info('Initializing Puppeteer browser...');
      
      const chromePath = this._findChrome();
      if (chromePath) {
        logger.info(`Found Chrome at: ${chromePath}`);
      }

      const browserOptions = {
        headless: false,
        defaultViewport: null,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      };

      if (chromePath) {
        browserOptions.executablePath = chromePath;
      }

      logger.info('🚀 Launching Chrome browser...');
      this.browser = await puppeteer.launch(browserOptions);
      logger.info('✅ Chrome browser launched successfully');
      
      this.page = await this.browser.newPage();
      logger.info('📄 New page created');
      
      // Set user agent
      await this.page.setUserAgent(WEB.USER_AGENT);
      
      // Set request timeout
      this.page.setDefaultTimeout(WEB.CONNECTION_TIMEOUT);
      
      // Intercept requests to block only heavy resources (keep CSS for proper rendering)
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        try {
          // Check if request is already handled
          if (req.isInterceptResolutionHandled()) {
            return;
          }
          
        const resourceType = req.resourceType();
        // Only block images and fonts, keep CSS for proper rendering
        if (resourceType === 'image' || resourceType === 'font') {
          req.abort();
        } else {
          req.continue();
          }
        } catch (error) {
          // Silently ignore "Request is already handled" errors
          if (!error.message.includes('Request is already handled')) {
            logger.error('Request interception error:', error);
          }
        }
      });

      this.isInitialized = true;
      logger.success('Puppeteer browser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Puppeteer browser:', error);
      throw new Error(`Browser initialization failed: ${error.message}`);
    } finally {
      // Always reset initializing flag
      this.isInitializing = false;
    }
  }

  /**
   * Navigate to tempmail website
   * @returns {Promise<void>}
   * @private
   */
  async _navigateToTempmail() {
    try {
      logger.info('Navigating to tempmail.ac.id...');
      await this.page.goto(WEB.TEMPMAIL_URL, {
        waitUntil: 'domcontentloaded',
        timeout: WEB.CONNECTION_TIMEOUT
      });
      await this._wait(1000);
      logger.success('Successfully navigated to tempmail.ac.id');
    } catch (error) {
      logger.error('Failed to navigate to tempmail:', error);
      throw error;
    }
  }

  /**
   * Check for current email on the page
   * @param {string} excludeEmail - Email to exclude from results
   * @returns {Promise<Object>} Result with current email info
   * @private
   */
  async _checkCurrentEmail(excludeEmail = null) {
    try {
      logger.info('Checking for current email...');
      
      const result = await this._safeEvaluate((excludeEmail) => {
        // Check current email display element using #email_id
        const emailElement = document.getElementById('email_id');
        
        if (emailElement) {
          const foundEmail = emailElement.textContent ? emailElement.textContent.trim() : '';
          
          // Check if it's a valid email and not the excluded one
          if (foundEmail && foundEmail.includes('@') && foundEmail !== excludeEmail) {
            console.log('✅ Found current email from #email_id:', foundEmail);
            return { 
              email: foundEmail, 
              found: true, 
              method: 'email_id'
            };
          } else {
            console.log('❌ #email_id found but no valid email:', foundEmail);
          }
        } else {
          console.log('❌ #email_id element not found');
        }
        
        return { 
          email: null, 
          found: false
        };
      }, excludeEmail);

      return result;
    } catch (error) {
      logger.error('Error checking current email:', error);
      return { 
        email: null, 
        found: false,
        error: error.message
      };
    }
  }

  /**
   * Get available emails from dropdown list
   * @returns {Promise<Array>} Array of available emails
   * @private
   */
  async _getAvailableEmails() {
    try {
      logger.info('Getting available emails from dropdown...');
      
      const availableEmails = await this._safeEvaluate(() => {
        const emails = [];
        
        // Find dropdown with email list using exact HTML structure
        const dropdownDiv = document.querySelector('.rounded-md.shadow-xs.max-h-96.overflow-y-auto.py-1.bg-white');
        
        if (dropdownDiv) {
          // Look for email links with the specific class structure
          const emailLinks = dropdownDiv.querySelectorAll('a.block.px-4.py-2.text-sm.leading-5.text-gray-700');
          console.log(`📧 Found ${emailLinks.length} email links in dropdown`);
          
          emailLinks.forEach(link => {
            const emailText = link.textContent.trim();
            const href = link.getAttribute('href');
            
            if (emailText && emailText.includes('@')) {
              console.log(`📧 Available email: ${emailText} (href: ${href})`);
              emails.push(emailText);
            } else if (href && href.includes('switch/')) {
              // Fallback: extract from href if text is not available
              const emailMatch = href.match(/switch\/(.+@.+)/);
              if (emailMatch) {
                const email = emailMatch[1];
                emails.push(email);
                console.log('📧 Found email in href:', email);
              }
            }
          });
        } else {
          console.log('❌ Email dropdown not found');
        }
        
        console.log('✅ Found ' + emails.length + ' available email(s)');
        return emails;
      });

      return availableEmails;
    } catch (error) {
      logger.error('Error getting available emails:', error);
      return [];
    }
  }

  /**
   * Wait for specified duration
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   * @private
   */
  async _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reload current page
   * @returns {Promise<void>}
   * @private
   */
  async _reloadPage() {
    try {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this._wait(1000);
    } catch (error) {
      logger.error('Error reloading page:', error);
      throw error;
    }
  }

  /**
   * Validate session state
   * @returns {Object|null} Error object if invalid, null if valid
   * @private
   */
  _validateSession() {
    if (!this.browser || !this.page || !this.isInitialized) {
      return { success: false, message: 'Session not initialized' };
    }
    return null;
  }

  /**
   * Execute email generation (random or custom)
   * @param {string} type - 'random' or 'custom'
   * @param {Object} params - Parameters for custom email
   * @returns {Promise<Object>} Generation result
   * @private
   */
  async _executeEmailGeneration(type, params = {}) {
    const { username, domain } = params;
    
    return await this._safeEvaluate(async (type, username, domain) => {
      try {
        console.log(`Generating ${type} email...`);
        
        // Click New button to show form if present
        const newBtn = document.querySelector('div[x-on\\:click*="in_app = true"]') || 
                      document.querySelector('[x-on\\:click*="in_app"]');
            if (newBtn) {
              console.log('Clicking New button to show form...');
              newBtn.click();
              await new Promise(r => setTimeout(r, 1000));
          }
          
        if (type === 'random') {
          // Handle random email generation using exact HTML structure
          // First click "New" button: <div x-on:click="in_app = true" class="flex justify-center items-center bg-white bg-opacity-10 hover:bg-opacity-25 text-white rounded-md text-center cursor-pointer py-3 px-4">
          const newBtn = document.querySelector('div[x-on\\:click*="in_app = true"]');
          if (newBtn) {
            console.log('🆕 Clicking New button...');
            newBtn.click();
            await new Promise(r => setTimeout(r, 500));
          }
          
          // Then click random button: <button id="random" class="flex items-center bg-green-400 rounded-md text-white text-center py-4 px-5 hover:bg-opacity-75 cursor-pointer">
          const randomBtn = document.getElementById('random');
            if (randomBtn) {
            console.log('🎲 Clicking random button...');
              randomBtn.click();
              await new Promise(r => setTimeout(r, 2000));
              return { success: true };
            } else {
            return { success: false, error: 'Random button not found' };
          }
        } else if (type === 'custom') {
          // Handle custom email generation using exact HTML structure
          // First click "New" button to show the form
          const newBtn = document.querySelector('div[x-on\\:click*="in_app = true"]');
          if (newBtn) {
            console.log('🆕 Clicking New button to show form...');
            newBtn.click();
            await new Promise(r => setTimeout(r, 500));
          }
          
          // Fill username input: <input class="block appearance-none w-full rounded-md py-4 px-5 bg-white text-white bg-opacity-10 focus:outline-none placeholder-white placeholder-opacity-50" type="text" name="user" id="user" wire:model="user" placeholder="Enter Username">
          const userInput = document.getElementById('user');
          if (userInput) {
            console.log('📝 Filling username input...');
            userInput.value = username;
            userInput.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 200));
          }
          
          // Domain selection using the exact HTML structure provided
          let domainSelected = false;
          
          console.log(`🔍 Attempting to select domain: ${domain}`);
          
          // First, open the domain dropdown if it's not already open
          const domainInput = document.querySelector('#domain');
          if (domainInput) {
            console.log('🔽 Opening domain dropdown...');
            domainInput.click();
            await new Promise(r => setTimeout(r, 300));
          }
          
          // Method 1: Try Alpine.js x-on:click selector with exact structure from HTML
          // <a x-on:click="$refs.domain.value = 'oliq.me'; $wire.setDomain('oliq.me')" class="...">oliq.me</a>
          const domainOption1 = document.querySelector(`a[x-on\\:click*="setDomain('${domain}')"]`);
          if (domainOption1) {
            console.log(`✅ Found domain option with Alpine.js: ${domain}`);
            domainOption1.click();
            domainSelected = true;
          }
          
          // Method 2: Try with $wire.setDomain pattern
          if (!domainSelected) {
            const domainOption2 = document.querySelector(`a[x-on\\:click*="\\$wire.setDomain('${domain}')"]`);
            if (domainOption2) {
              console.log(`✅ Found domain option with $wire.setDomain: ${domain}`);
              domainOption2.click();
              domainSelected = true;
            }
          }
          
          // Method 3: Try by text content in dropdown
          if (!domainSelected) {
            const dropdownDiv = document.querySelector('.rounded-md.shadow-xs.max-h-96.overflow-y-auto.py-1.bg-white');
            if (dropdownDiv) {
              const domainLinks = dropdownDiv.querySelectorAll('a.block.px-4.py-2.text-sm.leading-5.text-gray-700');
              for (const link of domainLinks) {
                if (link.textContent && link.textContent.trim() === domain) {
                  console.log(`✅ Found domain by text content: ${domain}`);
                  link.click();
                  domainSelected = true;
                  break;
                }
              }
            }
          }
          
          // Method 4: Try to find any element with the domain text and click it
          if (!domainSelected) {
            const allElements = document.querySelectorAll('a, button, div[role="button"]');
            for (const el of allElements) {
              const onclick = el.getAttribute('x-on:click') || '';
              if (onclick.includes(`setDomain('${domain}')`) || onclick.includes(`setDomain("${domain}")`)) {
                console.log(`✅ Found domain element with setDomain: ${domain}`);
                el.click();
                domainSelected = true;
                break;
              }
            }
          }
          
          // Method 5: Manual domain input setting (fallback)
          if (!domainSelected) {
            const domainInput = document.querySelector('#domain');
            if (domainInput) {
              console.log(`🔧 Manually setting domain input: ${domain}`);
              domainInput.value = domain;
              domainInput.dispatchEvent(new Event('input', { bubbles: true }));
              domainInput.dispatchEvent(new Event('change', { bubbles: true }));
              domainSelected = true;
            }
          }
          
          if (domainSelected) {
            await new Promise(r => setTimeout(r, 500));
            console.log(`✅ Domain selected successfully: ${domain}`);
          } else {
            console.warn(`❌ Could not select domain: ${domain}`);
            
            // Debug: Show available domains
            const availableDomains = [];
            const dropdownDiv = document.querySelector('.rounded-md.shadow-xs.max-h-96.overflow-y-auto.py-1.bg-white');
            if (dropdownDiv) {
              const domainLinks = dropdownDiv.querySelectorAll('a');
              domainLinks.forEach(link => {
                const text = link.textContent.trim();
                const onclick = link.getAttribute('x-on:click') || '';
                if (text || onclick.includes('setDomain')) {
                  availableDomains.push(text || onclick);
                }
              });
            }
            console.log('💡 Available domains:', availableDomains);
          }
          
          // Click create button: <button id="create" class="flex items-center bg-indigo-600 rounded-md text-white text-center py-4 px-5 hover:bg-opacity-75 cursor-pointer">
          const createBtn = document.getElementById('create');
          if (createBtn) {
            console.log('✅ Clicking create button...');
            createBtn.click();
              await new Promise(r => setTimeout(r, 2000));
              return { success: true };
            } else {
            console.log('❌ Create button not found');
            return { success: false, error: 'Create button not found' };
            }
          }
        
        return { success: false, error: 'Unknown generation type' };
        } catch (error) {
        console.error(`Error in ${type} email generation:`, error);
          return { success: false, error: error.message };
        }
    }, type, username, domain);
  }

  // ==================== CRUD METHODS ====================

  /**
   * CREATE - Generate new email
   * @param {Object} params - Creation parameters
   * @param {string} params.type - 'random' or 'custom'
   * @param {string} [params.username] - Username for custom email
   * @param {string} [params.domain] - Domain for custom email
   * @param {string} [params.customEmail] - Full custom email (alternative to username+domain)
   * @returns {Promise<Object>} Creation result
   */
  async create(params = {}) {
    try {
      const { type = 'random', username, domain, customEmail } = params;

      logger.info(`Creating ${type} email...`);
      
      // Initialize browser if needed
      if (!this.isInitialized) {
        await this._initializeBrowser();
        await this._navigateToTempmail();
      }
      
      let generationParams = {};
      
      if (type === 'custom') {
        if (customEmail) {
          const [user, dom] = customEmail.split('@');
          if (!user || !dom) {
            return { success: false, message: 'Invalid email format' };
          }
          generationParams = { username: user, domain: dom };
        } else if (username && domain) {
          generationParams = { username, domain };
        } else {
          return { success: false, message: 'Username and domain required for custom email' };
        }
      }
      
      // Execute email generation
      const result = await this._executeEmailGeneration(type, generationParams);
      
      if (result.success) {
        // Wait and check for generated email
        await this._wait(2000);
        const emailCheck = await this._checkCurrentEmail();
        
        if (emailCheck.found) {
          this.currentEmail = emailCheck.email;
          logger.success(`Email created successfully: ${emailCheck.email}`);
          
          return {
            success: true,
            email: emailCheck.email,
            message: `Email created: ${emailCheck.email}`
          };
        } else {
          return { success: false, message: 'Email generation completed but email not found' };
        }
      } else {
        return result;
      }
    } catch (error) {
      logger.error('Error creating email:', error);
      
      // Fallback: Try to check if email was actually created despite the error
      try {
        logger.info('Attempting fallback email check...');
        await this._wait(1000);
        const fallbackCheck = await this._checkCurrentEmail();
        
        if (fallbackCheck.found && fallbackCheck.email !== this.currentEmail) {
          // Email was actually created!
          this.currentEmail = fallbackCheck.email;
          logger.success(`Email created successfully (fallback): ${fallbackCheck.email}`);
          
          return {
            success: true,
            email: fallbackCheck.email,
            message: `Email created: ${fallbackCheck.email}`
          };
        }
      } catch (fallbackError) {
        logger.warn('Fallback check also failed:', fallbackError.message);
      }
      
      return { success: false, message: error.message };
    }
  }

  /**
   * SHOW - Get current/existing/available emails
   * @param {Object} params - Show parameters
   * @param {string} params.action - 'current', 'existing', or 'available'
   * @returns {Promise<Object>} Show result
   */
  async show(params = {}) {
    try {
      const { action = 'current' } = params;
      
      logger.info(`Showing ${action} email(s)...`);
      
      // Initialize browser if needed
      if (!this.isInitialized) {
        await this._initializeBrowser();
        await this._navigateToTempmail();
      }

      switch (action) {
        case 'current':
          const currentResult = await this._checkCurrentEmail();
          if (currentResult.found) {
            this.currentEmail = currentResult.email;
          return {
            success: true,
              email: currentResult.email,
              message: `Current email: ${currentResult.email}`
            };
          } else {
            return {
              success: false,
              email: null,
              message: 'No current email found'
            };
          }

        case 'existing':
          const existingResult = await this._checkCurrentEmail();
          if (existingResult.found) {
            this.currentEmail = existingResult.email;
            return {
              success: true,
              email: existingResult.email,
              message: `Found existing email: ${existingResult.email}`
            };
          } else {
            return {
              success: false,
              email: null,
              message: 'No existing email found'
            };
          }

        case 'available':
          const emails = await this._getAvailableEmails();
          return {
            success: true,
            emails: emails,
            count: emails.length,
            message: `Found ${emails.length} available email(s)`
          };

        default:
          return {
            success: false,
            message: `Unknown show action: ${action}`
          };
      }
    } catch (error) {
      logger.error('Error showing email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * DELETE - Delete current email (simple - let website handle everything)
   * @param {Object} params - Delete parameters
   * @param {string} [params.email] - Specific email to delete (optional)
   * @returns {Promise<Object>} Delete result
   */
  async delete(params = {}) {
    try {
      const { email } = params;

      // If specific email provided, switch to it first
      if (email && email !== this.currentEmail) {
        const switchResult = await this.execute({ action: 'switch', email });
        if (!switchResult.success) {
          return switchResult;
        }
      }

      // Simple delete - just click delete button and let website handle everything
      logger.info(`Deleting email: ${this.currentEmail}`);
      
      const sessionError = this._validateSession();
      if (sessionError) return { success: false, message: 'No active session' };

      const oldEmail = this.currentEmail;
      
      // Click delete button - website will handle the rest
      const deleteResult = await this._executeDeleteButton();

      if (deleteResult.success) {
        logger.success(`Delete button clicked for: ${oldEmail}`);
        
        // Wait longer for website to process delete and potentially generate new email
        await this._wait(3000);
        
        // Try multiple times to check for current email (website might be slow)
        let currentEmailCheck = { found: false };
        for (let attempt = 0; attempt < 3; attempt++) {
          currentEmailCheck = await this._checkCurrentEmail();
          if (currentEmailCheck.found) {
            break;
          }
          logger.info(`Attempt ${attempt + 1}: No email found, waiting...`);
          await this._wait(1000);
        }
        
        if (currentEmailCheck.found) {
          // Website auto-generated new email
          this.currentEmail = currentEmailCheck.email;
          logger.success(`✅ After delete, website auto-generated: ${currentEmailCheck.email}`);
          
          return {
            success: true,
            message: `Email deleted: ${oldEmail}`,
            deletedEmail: oldEmail,
            newEmail: currentEmailCheck.email,
            autoGenerated: true
          };
        } else {
          // No new email generated
          this.currentEmail = null;
          logger.warn(`❌ After delete, no new email generated. Website might not auto-generate.`);
          
          return {
            success: true,
            message: `Email deleted: ${oldEmail}`,
            deletedEmail: oldEmail,
            newEmail: null,
            autoGenerated: false
          };
        }
      } else {
        return {
          success: false,
          message: 'Failed to click delete button'
        };
      }
    } catch (error) {
      logger.error('Error deleting email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * EXECUTE - Execute various operations
   * @param {Object} params - Execution parameters
   * @param {string} params.action - Action to execute
   * @param {*} [params.data] - Additional data for the action
   * @returns {Promise<Object>} Execution result
   */
  async execute(params = {}) {
    try {
      const { action, ...data } = params;

      logger.info(`Executing action: ${action}`);
      
      // Initialize browser if needed for most actions
      if (!this.isInitialized && action !== 'clear') {
        await this._initializeBrowser();
        await this._navigateToTempmail();
      }
      
      switch (action) {
        case 'initialize':
          // Initialize and check for existing email
          const emailCheck = await this._checkCurrentEmail();
          
          if (emailCheck.found) {
            this.currentEmail = emailCheck.email;
            logger.success(`Found existing email: ${emailCheck.email}`);
              
          return {
            success: true,
              email: emailCheck.email,
              message: `Found existing email: ${emailCheck.email}`
              };
            } else {
            logger.info('No existing email found');
              return {
              success: true,
              email: null,
              message: 'No existing email found'
            };
          }

        case 'inbox':
          // Check inbox implementation
          try {
            const sessionError = this._validateSession();
            if (sessionError) return sessionError;

            logger.info(`Checking inbox for: ${this.currentEmail}`);
            await this._reloadPage();

            const result = await this._safeEvaluate(() => {
              const emails = [];
              
              console.log('📧 Checking for emails using exact HTML structure...');
              
              // Use the exact structure from HTML: <div class="messages flex flex-col-reverse justify-end min-h-tm-groot-messages">
              const messagesContainer = document.querySelector('.messages.flex.flex-col-reverse.justify-end.min-h-tm-groot-messages');
              
              if (messagesContainer) {
                // Look for email items with exact structure: <div x-on:click="show = true; id = 31041; ..." class="flex items-center gap-3 hover:bg-gray-200 border-b border-dashed py-4 px-7 cursor-pointer" data-id="31041">
                const emailItems = messagesContainer.querySelectorAll('div[data-id].flex.items-center.gap-3');
                
                console.log('📧 Found ' + emailItems.length + ' email items');
                
                emailItems.forEach((item, index) => {
                  const emailId = item.getAttribute('data-id');
                  
                  if (emailId) {
                    // Extract sender info using exact HTML structure
                  let senderName = 'Unknown';
                  let senderEmail = '';
                    let subject = 'No Subject';
                    let date = 'Unknown';
                  
                    // Find sender information: <div class="w-1/2 md:w-3/12">
                    const senderDiv = item.querySelector('.w-1\\/2.md\\:w-3\\/12');
                  if (senderDiv) {
                      const textContent = senderDiv.textContent.trim();
                      const lines = textContent.split('\\n').map(line => line.trim()).filter(line => line);
                      
                      if (lines.length >= 1) {
                        senderName = lines[0];
                      }
                      
                      // Look for email in nested div: <div class="text-xs overflow-ellipsis">
                    const emailDiv = senderDiv.querySelector('.text-xs.overflow-ellipsis');
                    if (emailDiv) {
                      senderEmail = emailDiv.textContent.trim();
                    }
                  }
                  
                    // Find subject: <div class="w-1/2 md:w-8/12">
                  const subjectDiv = item.querySelector('.w-1\\/2.md\\:w-8\\/12');
                    if (subjectDiv) {
                      subject = subjectDiv.textContent.trim();
                    }
                    
                    console.log(`📧 Email ${index + 1}: ID=${emailId}, From=${senderName} <${senderEmail}>, Subject=${subject}`);
                    
                    emails.push({
                      id: emailId,
                      from: senderEmail || senderName,
                    sender: senderName,
                    subject: subject,
                      date: date,
                    preview: subject
                    });
                  }
                });
              } else {
                console.log('❌ Messages container (.messages.flex.flex-col-reverse.justify-end.min-h-tm-groot-messages) not found');
                
                // Debug: show what containers are available
                const containers = document.querySelectorAll('.messages, [class*="messages"]');
                console.log('🔍 Available message containers:', containers.length);
                containers.forEach((container, i) => {
                  console.log(`Container ${i}: ${container.className}`);
                });
              }
              
              return emails;
            });

            logger.success(`Inbox checked: ${result.length} email(s) found`);

            return {
              success: true,
              emails: result,
              count: result.length,
              message: `Found ${result.length} email(s)`
            };
          } catch (error) {
            logger.error('Error checking inbox:', error);
            return { success: false, message: error.message, emails: [] };
          }

        case 'read':
          // Read email implementation
          try {
            const sessionError = this._validateSession();
            if (sessionError) return { success: false, message: 'No email generated yet' };

            logger.info(`Reading email ID: ${data.emailId}`);

            const clicked = await this._safeEvaluate((emailId) => {
              const emailItem = document.querySelector(`[data-id="${emailId}"]`);
              if (emailItem) {
                emailItem.click();
                return true;
              }
              return false;
            }, data.emailId);

            if (!clicked) {
              logger.error(`Email item not found: ${data.emailId}`);
              return { success: false, message: 'Email not found in inbox' };
            }

            await this._wait(TIMING.TEMPMAIL_EMAIL_OPEN_DELAY);

            const result = await this._safeEvaluate((emailId) => {
              const messageDiv = document.getElementById(`message-${emailId}`);
              
              if (!messageDiv) {
                return { success: false, message: 'Email content not loaded' };
              }

              let subject = 'No Subject';
              let senderName = 'Unknown';
              let senderEmail = '';
              let date = 'Unknown';
              let body = '';

              const subjectDiv = messageDiv.querySelector('.border-t.border-b.border-dashed.py-4.px-7');
              if (subjectDiv) {
                subject = subjectDiv.textContent.trim();
              }

              const iframe = messageDiv.querySelector('iframe.w-full.flex.flex-grow.min-h-tm-groot-iframe');
              if (iframe) {
                const srcdoc = iframe.getAttribute('srcdoc');
                if (srcdoc) {
                  body = srcdoc.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
                               .replace(/&amp;#x27;/g, "'").replace(/&amp;/g, '&');
                }
              }

              if (!body) {
                body = '<div style="padding: 20px; text-align: center; color: #666;">Email content not available</div>';
              }

              return {
                success: true,
                email: {
                  id: emailId,
                  from: senderEmail || senderName,
                  sender: senderName,
                  subject: subject,
                  date: date,
                  body: body,
                  html: body,
                  text: body.replace(/<[^>]*>/g, '').substring(0, 500)
                }
              };
            }, data.emailId);

            logger.success(`Email read successfully: ${data.emailId}`);
            return result;
    } catch (error) {
            logger.error('Error reading email:', error);
            return { success: false, message: error.message };
          }

        case 'switch':
          // Switch email implementation using website's dropdown
          try {
            const sessionError = this._validateSession();
            if (sessionError) return { success: false, message: 'No active session' };

            logger.info(`Switching to email: ${data.email}`);

            // Method 1: Try clicking on email from dropdown
            const switchResult = await this._safeEvaluate((targetEmail) => {
              console.log(`🔄 Attempting to switch to: ${targetEmail}`);
              
              // First, try to open the dropdown by clicking on current email display
              const emailDisplay = document.getElementById('email_id');
              if (emailDisplay) {
                console.log('📧 Clicking on email display to open dropdown...');
                emailDisplay.click();
                // Wait a bit for dropdown to appear
                setTimeout(() => {}, 500);
              }
              
              // Look for dropdown with available emails
              let dropdownDiv = document.querySelector('.rounded-md.shadow-xs.max-h-96.overflow-y-auto.py-1.bg-white');
              
              // If dropdown not visible, try clicking on other elements that might trigger it
              if (!dropdownDiv) {
                console.log('🔽 Dropdown not visible, trying to trigger it...');
                
                // Try clicking on elements that might open the dropdown
                const triggers = document.querySelectorAll('[x-data], .cursor-pointer, .dropdown-toggle');
                for (const trigger of triggers) {
                  const text = trigger.textContent || '';
                  if (text.includes('@') || trigger.id === 'email_id') {
                    console.log('🔽 Clicking potential dropdown trigger:', text.substring(0, 30));
                    trigger.click();
                    break;
                  }
                }
                
                // Wait and check again
                setTimeout(() => {
                  dropdownDiv = document.querySelector('.rounded-md.shadow-xs.max-h-96.overflow-y-auto.py-1.bg-white');
                }, 300);
              }
              
              if (dropdownDiv) {
                console.log('📋 Dropdown found, looking for email links...');
                
                // Find the email link in dropdown
                const emailLinks = dropdownDiv.querySelectorAll('a.block.px-4.py-2.text-sm.leading-5.text-gray-700');
                console.log(`📧 Found ${emailLinks.length} email links in dropdown`);
                
                for (const link of emailLinks) {
                  const emailText = link.textContent.trim();
                  const href = link.getAttribute('href');
                  
                  console.log(`🔍 Checking link: ${emailText} (${href})`);
                  
                  if (emailText === targetEmail || (href && href.includes(targetEmail))) {
                    console.log(`✅ Found matching email link: ${emailText} (${href})`);
                    link.click();
                    return { success: true, method: 'dropdown-click' };
                  }
                }
                
                console.log('❌ Target email not found in dropdown');
                return { success: false, message: 'Email not found in dropdown' };
              } else {
                console.log('❌ Dropdown still not found after attempts');
                return { success: false, message: 'Dropdown not accessible' };
              }
            }, data.email);

            if (switchResult.success) {
              // Wait for switch to complete
              await this._wait(2000);
              
              // Verify the switch was successful
              const verifyResult = await this._checkCurrentEmail();
              
              if (verifyResult.found && verifyResult.email === data.email) {
                this.currentEmail = data.email;
                logger.success(`Successfully switched to: ${data.email}`);
                
        return {
                  success: true,
                  email: data.email,
                  message: `Switched to ${data.email}`
                };
              } else {
                logger.warn(`Switch completed but verification failed. Expected: ${data.email}, Found: ${verifyResult.email}`);
                
                // Update current email anyway if found
                if (verifyResult.found) {
                  this.currentEmail = verifyResult.email;
                }
                
        return {
          success: false,
                  message: `Switch may have failed. Current email: ${verifyResult.email || 'none'}`
                };
              }
            } else {
              // Method 2: Fallback to direct URL navigation
              logger.info('Trying fallback method: direct URL navigation');
              
              try {
                const switchUrl = `https://tempmail.ac.id/switch/${data.email}`;
                await this.page.goto(switchUrl, { waitUntil: 'domcontentloaded' });
                await this._wait(2000);

                // Verify the switch was successful
                const verifyResult = await this._checkCurrentEmail();
                
                if (verifyResult.found && verifyResult.email === data.email) {
                  this.currentEmail = data.email;
                  logger.success(`Successfully switched to: ${data.email} (via URL)`);
                  
                  return {
                    success: true,
                    email: data.email,
                    message: `Switched to ${data.email}`
                  };
                } else {
                  return {
                    success: false,
                    message: 'Failed to verify email switch via URL'
                  };
                }
              } catch (urlError) {
                logger.error('URL switch method failed:', urlError);
      return {
                  success: false,
                  message: 'Both switch methods failed'
                };
              }
            }
    } catch (error) {
            logger.error('Switch email error:', error);
      return {
        success: false,
              message: error.message
            };
          }

        case 'refresh':
          // Refresh inbox implementation using the exact HTML structure
          try {
            logger.info('Refreshing inbox...');
            
      const sessionError = this._validateSession();
            if (sessionError) return { success: false, message: 'No active session' };

            // Click the refresh button using the exact HTML structure
            const refreshResult = await this._safeEvaluate(() => {
              // Find refresh button: <div onclick="document.getElementById('refresh').classList.remove('pause-spinner')" class="flex justify-center items-center bg-white bg-opacity-10 hover:bg-opacity-25 text-white rounded-md text-center cursor-pointer py-3 px-4">
              const refreshBtn = document.querySelector('div[onclick*="refresh"]');
              if (refreshBtn) {
                console.log('🔄 Clicking refresh button...');
                refreshBtn.click();
                
                // Also trigger the onclick action manually
                const refreshIcon = document.getElementById('refresh');
                if (refreshIcon) {
                  refreshIcon.classList.remove('pause-spinner');
                }
                
                return { success: true, message: 'Refresh button clicked' };
              } else {
                console.log('❌ Refresh button not found');
                return { success: false, message: 'Refresh button not found' };
              }
            });

            if (refreshResult.success) {
              // Wait for refresh to complete
              await this._wait(2000);
              
              logger.success('Inbox refreshed successfully');
              
              return {
                success: true,
                message: 'Inbox refreshed'
              };
            } else {
              // Fallback: reload page
              await this._reloadPage();
              
              logger.success('Inbox refreshed via page reload');

        return {
          success: true,
                message: 'Inbox refreshed via page reload'
              };
            }
    } catch (error) {
            logger.error('Refresh error:', error);
            return {
              success: false,
              message: error.message
            };
          }

        case 'clear':
          // Clear session implementation
          try {
            await this.clear();
        return {
          success: true,
              message: 'Session cleared successfully'
        };
          } catch (error) {
            logger.error('Clear session error:', error);
        return {
          success: false,
              message: error.message
        };
      }

        default:
      return {
        success: false,
            message: `Unknown action: ${action}`
      };
      }
    } catch (error) {
      logger.error(`Error executing action ${params.action}:`, error);
      return { success: false, message: error.message };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Execute delete button click on page using exact HTML structure
   * @returns {Promise<Object>} Delete execution result
   * @private
   */
  async _executeDeleteButton() {
    return await this._safeEvaluate(() => {
        try {
          console.log('🗑️ Looking for delete button using exact HTML structure...');
          
          // Method 1: Try the exact delete button structure from HTML
          // <div wire:click="deleteEmail" class="flex justify-center items-center bg-white bg-opacity-10 hover:bg-opacity-25 text-white rounded-md text-center cursor-pointer py-3 px-4">
          const deleteBtn1 = document.querySelector('div[wire\\:click="deleteEmail"]');
          if (deleteBtn1) {
            console.log('✅ Found delete button with wire:click="deleteEmail"');
            deleteBtn1.click();
            return { success: true, method: 'wire:click="deleteEmail"' };
          }
          
          // Method 2: Try any wire:click with delete
          const deleteBtn2 = document.querySelector('[wire\\:click*="delete"]');
          if (deleteBtn2) {
            console.log('✅ Found delete button with wire:click containing "delete"');
            deleteBtn2.click();
            return { success: true, method: 'wire:click contains delete' };
          }
          
          // Method 3: Try by class structure and text content
          const deleteBtns = document.querySelectorAll('.flex.justify-center.items-center.bg-white.bg-opacity-10');
          for (const btn of deleteBtns) {
            const text = btn.textContent.toLowerCase();
            if (text.includes('delete') || text.includes('hapus')) {
              console.log('✅ Found delete button by class structure and text');
              btn.click();
              return { success: true, method: 'class-structure-text' };
            }
          }
          
          // Method 4: Try finding by icon (trash icon)
          const trashIcons = document.querySelectorAll('.fa-trash-alt, .fa-trash, [class*="trash"]');
          for (const icon of trashIcons) {
            const btn = icon.closest('div[wire\\:click], button, .cursor-pointer');
            if (btn) {
              console.log('✅ Found delete button by trash icon');
              btn.click();
              return { success: true, method: 'trash-icon' };
            }
          }
          
          // Method 5: Try any element with delete text
          const allElements = document.querySelectorAll('button, div[role="button"], .cursor-pointer, div[wire\\:click]');
          for (const element of allElements) {
            const text = element.textContent.toLowerCase();
            const wireClick = element.getAttribute('wire:click') || '';
            
            if (text.includes('delete') || text.includes('hapus') || wireClick.includes('delete')) {
              console.log('✅ Found delete element by text/wire:click');
              element.click();
              return { success: true, method: 'general-delete-text' };
            }
          }
          
          console.log('❌ Delete button not found with any method');
          
          // Debug: Show available wire:click elements
          const wireElements = document.querySelectorAll('[wire\\:click]');
          console.log('🔍 Available wire:click elements:');
          wireElements.forEach((el, i) => {
            console.log(`${i}: wire:click="${el.getAttribute('wire:click')}" text="${el.textContent.trim()}"`);
          });
          
          return { success: false, error: 'Delete button not found' };
        } catch (scriptError) {
          console.error('Delete script error:', scriptError);
          return { success: false, error: 'Script execution failed' };
        }
      });
  }

  /**
   * Safe page evaluation with error handling
   * @param {Function} fn - Function to evaluate
   * @param {...any} args - Arguments to pass to the function
   * @returns {Promise<any>} Evaluation result
   * @private
   */
  async _safeEvaluate(fn, ...args) {
    // Simple retry mechanism for context destroyed errors
    const maxRetries = 2;
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Check if browser is connected
        if (!this.browser || !this.browser.isConnected()) {
          logger.warn('Browser not connected, need to reinitialize...');
          await this._initializeBrowser();
          await this._navigateToTempmail();
        }
        
        // Check if page exists and is not closed
        if (!this.page || this.page.isClosed()) {
          logger.warn('Page closed, creating new page from existing browser...');
          this.page = await this.browser.newPage();
          await this.page.setUserAgent(WEB.USER_AGENT);
          await this._navigateToTempmail();
        }
        
        return await this.page.evaluate(fn, ...args);
        
      } catch (error) {
        lastError = error;
        
        // If context destroyed and we have retries left, create fresh page and retry
        if (error.message.includes('Execution context was destroyed') || 
            error.message.includes('Protocol error') ||
            error.message.includes('Target closed')) {
          
          if (attempt < maxRetries - 1) {
            logger.warn(`Page context destroyed (attempt ${attempt + 1}/${maxRetries}), creating fresh page...`);
            
            try {
              // Close the broken page
              if (this.page && !this.page.isClosed()) {
                await this.page.close().catch(() => {});
              }
              
              // Create completely fresh page from existing browser
              this.page = await this.browser.newPage();
              await this.page.setUserAgent(WEB.USER_AGENT);
              this.page.setDefaultTimeout(WEB.CONNECTION_TIMEOUT);
              
              // Setup request interception for new page
              await this.page.setRequestInterception(true);
              this.page.on('request', (req) => {
                try {
                  if (req.isInterceptResolutionHandled()) return;
                  const resourceType = req.resourceType();
                  if (resourceType === 'image' || resourceType === 'font') {
                    req.abort();
                  } else {
                    req.continue();
                  }
                } catch (error) {
                  if (!error.message.includes('Request is already handled')) {
                    logger.error('Request interception error:', error);
                  }
                }
              });
              
              await this._navigateToTempmail();
              logger.info('Fresh page created, retrying...');
              await this._wait(1000); // Wait for page to be fully ready
              continue; // Retry
            } catch (recreateError) {
              logger.error('Failed to create fresh page:', recreateError);
              // Fall through to throw error
            }
          } else {
            logger.error('Max retries reached for context destroyed error');
          }
        }
        
        // If not a retryable error, or max retries reached, throw
        throw error;
      }
    }
    
    throw lastError;
  }

  /**
   * Toggle debug mode (not applicable for Puppeteer)
   * @returns {Object} Toggle result
   */
  toggleDebug() {
    logger.info('Debug mode not applicable for Puppeteer implementation');
    return { success: true, message: 'Debug mode not applicable for Puppeteer' };
  }

  /**
   * Clear and destroy browser
   */
  async clear() {
    try {
      // Clear current email and state first
      this.currentEmail = null;
      this.isInitialized = false;
      this.isInitializing = false;
      
      // Close page safely
      if (this.page && !this.page.isClosed()) {
        try {
        await this.page.close();
        } catch (error) {
          // Ignore protocol errors when page is already closed/destroyed
          if (!error.message.includes('Protocol error') && !error.message.includes('Target closed')) {
            logger.error('Error closing page:', error);
          }
        }
        this.page = null;
      }
      
      // Close browser safely
      if (this.browser && this.browser.isConnected()) {
        try {
        await this.browser.close();
        } catch (error) {
          // Ignore protocol errors when browser is already closed
          if (!error.message.includes('Protocol error') && !error.message.includes('Target closed')) {
            logger.error('Error closing browser:', error);
          }
        }
        this.browser = null;
      }
      
      logger.info('Tempmail session cleared');
    } catch (error) {
      // Only log unexpected errors
      if (!error.message.includes('Protocol error') && !error.message.includes('Target closed')) {
      logger.error('Error clearing session:', error);
    }
  }
}

  /**
   * Get current email (Legacy compatibility)
   * @returns {string|null} Current email address
   */
  getCurrentEmail() {
    return this.currentEmail;
  }
}

module.exports = TempmailScraper;