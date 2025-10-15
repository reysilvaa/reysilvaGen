/**
 * Tempmail Scraper - Clean CRUD Implementation
 * Sequential flow with Chrome initialization in separate module
 * 
 * Main Methods:
 * - create(params) - Generate new email
 * - show(params) - Get current/existing/available emails
 * - delete(params) - Delete current or specific email
 * - execute(params) - Execute various operations
 * 
 * @module scrapers/tempmail-scraper
 */

const { WEB, TIMING } = require('../config/appConstants');
const ChromeLauncher = require('../core/browser/chromeLauncher');
const { createErrorResponse, createSuccessResponse } = require('../core/utils/validators');
const logger = require('../core/utils/logger')('Tempmail');

class TempmailScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.currentEmail = null;
    this.isReady = false;
    this.chromeLauncher = new ChromeLauncher();
    this.instanceId = Math.random().toString(36).substr(2, 9);
    logger.info(`🆔 TempmailScraper instance created: ${this.instanceId}`);
  }

  /**
   * Initialize browser and navigate to tempmail
   * Sequential flow: Launch Chrome → Navigate → Set Ready
   * @returns {Promise<Object>} Initialization result
   */
  async initialize() {
    try {
      if (this.isReady) {
        logger.info(`🔄 Already initialized for instance ${this.instanceId}`);
        return createSuccessResponse('Already initialized');
      }

      // Step 1: Launch Chrome browser with simplified API
      const launchResult = await this.chromeLauncher.launch();
      if (!launchResult.success) {
        return launchResult;
      }

      this.browser = launchResult.browser;
      this.page = launchResult.page;

      // Step 2: Navigate to tempmail
      logger.info('🧭 Navigating to tempmail.ac.id...');
      await this.page.goto(WEB.TEMPMAIL_URL, {
        waitUntil: 'domcontentloaded',
        timeout: WEB.CONNECTION_TIMEOUT
      });
      
      // Step 3: Set ready state
      await this.wait(1000);
      this.isReady = true;
      
      logger.success('✅ Browser initialized and ready');
      return createSuccessResponse('Initialized successfully');
      
    } catch (error) {
      logger.error('Initialization failed:', error);
      return createErrorResponse('Initialization failed', error);
    }
  }

  /**
   * Wait for specified duration
   * @param {number} ms - Milliseconds to wait
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current email information from page
   * @param {string} excludeEmail - Email to exclude from results  
   * @returns {Promise<Object>} Email information
   */
  async getCurrentEmailInfo(excludeEmail = null) {
    try {
      // Ensure browser is ready before attempting to get email info
      if (!this.isSessionValid()) {
        logger.warn('Session not valid, attempting to initialize...');
        const initResult = await this.initialize();
        if (!initResult.success) {
          return { email: null, found: false, error: 'Failed to initialize browser' };
        }
      }

      const result = await this.performAction('getEmail', { excludeEmail });
      if (result && result.found) {
        this.currentEmail = result.email;
      }
      return result || { email: null, found: false };
    } catch (error) {
      logger.error('Error getting current email:', error);
      return { email: null, found: false, error: error.message };
    }
  }

  /**
   * Perform browser action with parameters
   * @param {string} action - Action to perform
   * @param {Object} params - Action parameters
   * @param {number} retryCount - Internal retry counter
   * @returns {Promise<any>} Action result
   */
  async performAction(action, params = {}, retryCount = 0) {
    try {
      // Check if browser session is valid
      if (!this.isSessionValid()) {
        logger.warn('Invalid browser session, attempting to recover...');
        const initResult = await this.initialize();
        if (!initResult.success) {
          throw new Error('Failed to recover browser session');
        }
      }

      // Double-check page is available
      if (!this.page || this.page.isClosed()) {
        throw new Error('Browser page is not available');
      }

      return await this.page.evaluate((action, params) => {
        switch (action) {
          case 'getEmail':
            const emailElement = document.getElementById('email_id');
            if (emailElement) {
              const foundEmail = emailElement.textContent?.trim();
              if (foundEmail && foundEmail.includes('@') && foundEmail !== params.excludeEmail) {
                return { email: foundEmail, found: true };
              }
            }
            return { email: null, found: false };

          case 'getAvailableEmails':
            const emails = [];
            const dropdown = document.querySelector('.rounded-md.shadow-xs.max-h-96.overflow-y-auto.py-1.bg-white');
            if (dropdown) {
              const links = dropdown.querySelectorAll('a.block.px-4.py-2.text-sm.leading-5.text-gray-700');
              links.forEach(link => {
                const email = link.textContent?.trim();
                if (email && email.includes('@')) emails.push(email);
              });
            }
            return emails;

          case 'generateRandom':
            const newBtn = document.querySelector('div[x-on\\:click*="in_app = true"]');
            if (newBtn) newBtn.click();
            setTimeout(() => {
          const randomBtn = document.getElementById('random');
              if (randomBtn) randomBtn.click();
            }, 500);
              return { success: true };

          case 'generateCustom':
            const { username, domain } = params;
            const formBtn = document.querySelector('div[x-on\\:click*="in_app = true"]');
            if (formBtn) formBtn.click();
            
            setTimeout(() => {
          const userInput = document.getElementById('user');
          if (userInput) {
            userInput.value = username;
            userInput.dispatchEvent(new Event('input', { bubbles: true }));
              }
              
              const domainBtn = document.querySelector(`a[x-on\\:click*="setDomain('${domain}')"]`);
              if (domainBtn) domainBtn.click();
              
              setTimeout(() => {
                const createBtn = document.getElementById('create');
                if (createBtn) createBtn.click();
              }, 300);
            }, 500);
            return { success: true };

          case 'deleteEmail':
            const deleteBtn = document.querySelector('div[wire\\:click="deleteEmail"]');
            if (deleteBtn) {
              deleteBtn.click();
              return { success: true };
            }
            return { success: false, error: 'Delete button not found' };

          case 'refreshInbox':
            const refreshBtn = document.querySelector('div[onclick*="refresh"]');
            if (refreshBtn) {
              refreshBtn.click();
              const refreshIcon = document.getElementById('refresh');
              if (refreshIcon) refreshIcon.classList.remove('pause-spinner');
              return { success: true };
            }
            return { success: false, error: 'Refresh button not found' };

          case 'getInboxEmails':
            const inboxEmails = [];
            
            // Look for email messages in the main container
            const emailMessages = document.querySelectorAll('div[id^="message-"].message.min-h-tm-groot-messages');
            
            emailMessages.forEach(messageDiv => {
              // Extract ID from the message div (format: message-12345)
              const emailId = messageDiv.id.replace('message-', '');
              
              if (emailId) {
                // Extract sender info from the message header
                let sender = 'Unknown';
                let subject = 'No Subject';
                let date = 'Just now';
                
                // Look for sender and date in the flex container
                const headerDiv = messageDiv.querySelector('.flex.justify-between.items-center.py-4.px-7');
                if (headerDiv) {
                  const senderDiv = headerDiv.querySelector('div:first-child');
                  if (senderDiv) {
                    const senderText = senderDiv.textContent.trim().split('\n')[0];
                    sender = senderText || 'Unknown';
                    
                    const emailDiv = senderDiv.querySelector('.text-xs.overflow-ellipsis');
                    if (emailDiv) {
                      sender = `${senderText} <${emailDiv.textContent.trim()}>`;
                    }
                  }
                  
                  const dateDiv = headerDiv.querySelector('div:last-child .text-xs.overflow-ellipsis');
                  if (dateDiv) {
                    date = dateDiv.textContent.trim();
                  }
                }
                
                // Extract subject from the subject line div
                const subjectDiv = messageDiv.querySelector('.border-t.border-b.border-dashed.py-4.px-7');
                if (subjectDiv) {
                  subject = subjectDiv.textContent.trim();
                }
                
                // Check for OTP in the email content
                const textarea = messageDiv.querySelector('textarea.hidden');
                let hasOTP = false;
                let otpCode = null;
                
                if (textarea) {
                  const emailContent = textarea.value || textarea.textContent;
                  
                  // Enhanced OTP detection patterns
                  const otpPatterns = [
                    /(?:one-time\s+code\s+is)[:\s]*(\d{4,8})/gi,
                    /(?:code\s+is)[:\s]*(\d{4,8})/gi,
                    /(?:otp\s+is)[:\s]*(\d{4,8})/gi,
                    /(?:verification\s+code)[:\s]*(\d{4,8})/gi,
                    /(?:your\s+code)[:\s]*(\d{4,8})/gi,
                    /(?:access\s+code)[:\s]*(\d{4,8})/gi
                  ];
                  
                  let foundOTP = null;
                  for (const pattern of otpPatterns) {
                    const match = emailContent.match(pattern);
                    if (match && match[1]) {
                      foundOTP = match[1];
                      hasOTP = true;
                      otpCode = foundOTP;
                      break;
                    }
                  }
                  
                  // Fallback: look for standalone 6-digit numbers (common OTP length)
                  if (!hasOTP) {
                    const sixDigitMatch = emailContent.match(/\b(\d{6})\b/g);
                    if (sixDigitMatch && sixDigitMatch.length === 1) {
                      hasOTP = true;
                      otpCode = sixDigitMatch[0];
                    }
                  }
                }
                
                const emailData = {
                  id: emailId,
                  sender: sender,
                  subject: subject,
                  date: date,
                  time: date,
                  from: sender,
                  preview: hasOTP ? `🔐 OTP Code: ${otpCode}` : subject,
                  read: false, // Assume unread by default
                  otp: hasOTP ? otpCode : null
                };
                
                inboxEmails.push(emailData);
              }
            });
            
            return inboxEmails;

          case 'clickEmail':
            // Try to find the email by message ID first
            let emailItem = document.getElementById(`message-${params.emailId}`);
            
            // Fallback: try to find by data-id attribute (older structure)
            if (!emailItem) {
              emailItem = document.querySelector(`[data-id="${params.emailId}"]`);
            }
            
            if (emailItem) {
              // For the message div structure, we need to click on it or scroll it into view
              emailItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // Give it a moment to scroll, then ensure it's visible
              setTimeout(() => {
                const showAttribute = emailItem.getAttribute('x-show');
                if (showAttribute) {
                  // This uses Alpine.js x-show, so we need to trigger the visibility
                  emailItem.style.display = 'block';
                }
              emailItem.click();
              }, 300);
              
              return { success: true };
            }
            return { success: false, error: 'Email not found' };

          case 'switchEmail':
            const targetEmail = params.email;
            const emailDisplay = document.getElementById('email_id');
            if (emailDisplay) emailDisplay.click();
            
            setTimeout(() => {
              const emailLinks = document.querySelectorAll('a.block.px-4.py-2.text-sm.leading-5.text-gray-700');
              for (const link of emailLinks) {
                if (link.textContent?.trim() === targetEmail) {
                  link.click();
                  return { success: true };
                }
              }
              return { success: false, error: 'Email not found in dropdown' };
            }, 300);
            return { success: true };

          default:
            return { success: false, error: `Unknown action: ${action}` };
        }
      }, action, params);
      
    } catch (error) {
      logger.error(`Action ${action} failed:`, error);
      
      // Try to recover from browser connection errors (max 2 retries)
      if (retryCount < 2 && this.isRecoverableError(error.message)) {
        
        logger.info(`🔄 [Tempmail] Attempting to recover from browser error (attempt ${retryCount + 1}/2)...`);
        
        // For minor errors, try lighter recovery first
        if (retryCount === 0 && (error.message.includes('Execution context was destroyed') || 
            error.message.includes('Protocol error'))) {
          
          logger.info('Attempting light recovery (page refresh)...');
          try {
            if (this.page && !this.page.isClosed()) {
              await this.page.reload({ waitUntil: 'domcontentloaded' });
              await this.wait(1000);
              return await this.performAction(action, params, retryCount + 1);
            }
          } catch (lightRecoveryError) {
            logger.warn('Light recovery failed, proceeding to full recovery:', lightRecoveryError.message);
          }
        }
        
        // Full recovery for persistent errors
        logger.info('Performing full browser recovery...');
        this.isReady = false;
        
        try {
          // Reset state and cleanup via ChromeLauncher
          this.isReady = false;
          await this.chromeLauncher.cleanup();
          this.browser = null;
          this.page = null;
        } catch (cleanupError) {
          logger.warn('Cleanup error (continuing):', cleanupError.message);
        }
        
        // Wait before retrying
        await this.wait(Math.min(2000 * (retryCount + 1), 5000));
        
        // Force full re-initialization
        const initResult = await this.initialize();
        if (initResult.success) {
          logger.success('🔄 Browser recovered successfully, retrying action...');
          return await this.performAction(action, params, retryCount + 1);
            } else {
          logger.error('Recovery failed:', initResult.message);
        }
      }
      
      throw error;
    }
  }

  /**
   * Validate session state
   * @returns {boolean} True if session is valid
   */
  isSessionValid() {
    return this.isReady && this.chromeLauncher.isReady();
  }

  // ==================== HELPER METHODS ====================

  /**
   * Ensure session is ready (common pattern)
   * @returns {Promise<Object|null>} Error result if failed, null if success
   */
  async ensureReady() {
    if (!this.isSessionValid()) {
      const initResult = await this.initialize();
      if (!initResult.success) return initResult;
    }
    return null;
  }

  // ==================== MAIN CRUD METHODS ====================

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
      
      // Ensure session is ready
      const readyCheck = await this.ensureReady();
      if (readyCheck) return readyCheck;

      // Prepare parameters for custom email
      let actionParams = {};
      if (type === 'custom') {
        if (customEmail) {
          const [user, dom] = customEmail.split('@');
          if (!user || !dom) {
            return createErrorResponse('Invalid email format');
          }
          actionParams = { username: user, domain: dom };
        } else if (username && domain) {
          actionParams = { username, domain };
        } else {
          return createErrorResponse('Username and domain required for custom email');
        }
      }
      
      // Execute generation
      const action = type === 'random' ? 'generateRandom' : 'generateCustom';
      const result = await this.performAction(action, actionParams);
      
      if (result.success) {
        // Wait and check for generated email
        await this.wait(2000);
        const emailInfo = await this.getCurrentEmailInfo();
        
        if (emailInfo.found) {
          logger.success(`Email created: ${emailInfo.email}`);
          return createSuccessResponse(`Email created: ${emailInfo.email}`, { 
            email: emailInfo.email 
          });
        } else {
          return createErrorResponse('Email generation completed but email not found');
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Create email error:', error);
      return createErrorResponse('Create email failed', error);
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
      
      // Ensure session is ready
      const readyCheck = await this.ensureReady();
      if (readyCheck) return readyCheck;

      switch (action) {
        case 'current':
        case 'existing':
          const emailInfo = await this.getCurrentEmailInfo();
          if (emailInfo.found) {
            return createSuccessResponse(
              `${action === 'current' ? 'Current' : 'Existing'} email: ${emailInfo.email}`,
              { email: emailInfo.email }
            );
          } else {
            return createErrorResponse(`No ${action} email found`, null);
          }

        case 'available':
          const emails = await this.performAction('getAvailableEmails');
          return createSuccessResponse(
            `Found ${emails.length} available email(s)`,
            { emails, count: emails.length }
          );

        default:
          return createErrorResponse(`Unknown show action: ${action}`);
      }
    } catch (error) {
      logger.error('Show email error:', error);
      return createErrorResponse('Show email failed', error);
    }
  }

  /**
   * DELETE - Delete current email
   * @param {Object} params - Delete parameters
   * @param {string} [params.email] - Specific email to delete (optional)
   * @returns {Promise<Object>} Delete result
   */
  async delete(params = {}) {
    try {
      const { email } = params;
      logger.info(`Deleting email: ${email || this.currentEmail}`);

      // Ensure session is ready
      const readyCheck = await this.ensureReady();
      if (readyCheck) return readyCheck;

      // Switch to specific email if provided
      if (email && email !== this.currentEmail) {
        const switchResult = await this.performAction('switchEmail', { email });
        if (!switchResult.success) {
          return createErrorResponse('Failed to switch to target email');
        }
        await this.wait(1000);
      }

      const oldEmail = this.currentEmail;
      
      // Delete email
      const deleteResult = await this.performAction('deleteEmail');
      if (deleteResult.success) {
        logger.success(`Delete initiated for: ${oldEmail}`);
        
        // Wait for website to process and check for new email
        await this.wait(3000);
        
        // Check if website auto-generated new email
        const emailInfo = await this.getCurrentEmailInfo();
        
        if (emailInfo.found) {
          logger.success(`Website auto-generated: ${emailInfo.email}`);
          return createSuccessResponse(`Email deleted: ${oldEmail}`, {
            deletedEmail: oldEmail,
            newEmail: emailInfo.email,
            autoGenerated: true
          });
        } else {
          this.currentEmail = null;
          return createSuccessResponse(`Email deleted: ${oldEmail}`, {
            deletedEmail: oldEmail,
            newEmail: null,
            autoGenerated: false
          });
        }
      }
      
      return deleteResult;
    } catch (error) {
      logger.error('Delete email error:', error);
      return createErrorResponse('Delete email failed', error);
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
      
      // Ensure session is ready (except for clear action)
      if (action !== 'clear') {
        const readyCheck = await this.ensureReady();
        if (readyCheck) return readyCheck;
      }
      
      switch (action) {
        case 'initialize':
          const emailInfo = await this.getCurrentEmailInfo();
          return createSuccessResponse(
            emailInfo.found ? `Found existing email: ${emailInfo.email}` : 'No existing email found',
            { email: emailInfo.email }
          );

        case 'inbox':
          try {
            logger.info(`Checking inbox for: ${this.currentEmail}`);
            
            // Gentle refresh instead of full page reload
            try {
              const refreshResult = await this.performAction('refreshInbox');
              if (refreshResult.success) {
                await this.wait(1000);
              } else {
                // Fallback: gentle page refresh
                if (this.page && !this.page.isClosed()) {
                  await this.page.evaluate(() => window.location.reload());
                  await this.wait(2000);
                }
              }
            } catch (refreshError) {
              logger.warn('Refresh failed, trying alternative approach:', refreshError.message);
              
              // Only reload if page is actually available
              if (this.page && !this.page.isClosed()) {
            await this.page.reload({ waitUntil: 'domcontentloaded' });
            await this.wait(1000);
              }
            }

            const emails = await this.performAction('getInboxEmails');
            logger.success(`Inbox checked: ${emails.length} email(s) found`);

            return createSuccessResponse(`Found ${emails.length} email(s)`, {
              emails,
              count: emails.length
            });
          } catch (error) {
            logger.error('Inbox check error:', error);
            return createErrorResponse('Inbox check failed', error);
          }

        case 'read':
          try {
            logger.info(`Reading email ID: ${data.emailId}`);

            const clickResult = await this.performAction('clickEmail', { emailId: data.emailId });
            if (!clickResult.success) {
              return createErrorResponse('Email not found in inbox');
            }

            await this.wait(TIMING.TEMPMAIL_EMAIL_OPEN_DELAY || 2000);

            // Get email content from the opened message
            const result = await this.page.evaluate((emailId) => {
              const messageDiv = document.getElementById(`message-${emailId}`);
              if (!messageDiv) {
                return { success: false, error: 'Email content not loaded' };
              }

              let subject = 'No Subject';
              let sender = 'Unknown';
              let date = 'Unknown';
              let body = '';

              // Extract subject from the subject line div
              const subjectDiv = messageDiv.querySelector('.border-t.border-b.border-dashed.py-4.px-7');
              if (subjectDiv) {
                subject = subjectDiv.textContent.trim();
              }

              // Extract sender and date from header
              const headerDiv = messageDiv.querySelector('.flex.justify-between.items-center.py-4.px-7');
              if (headerDiv) {
                const senderDiv = headerDiv.querySelector('div:first-child');
                if (senderDiv) {
                  const senderText = senderDiv.textContent.trim().split('\n')[0];
                  sender = senderText || 'Unknown';
                  
                  const emailDiv = senderDiv.querySelector('.text-xs.overflow-ellipsis');
                  if (emailDiv) {
                    sender = `${senderText} <${emailDiv.textContent.trim()}>`;
                  }
                }
                
                const dateDiv = headerDiv.querySelector('div:last-child .text-xs.overflow-ellipsis');
                if (dateDiv) {
                  date = dateDiv.textContent.trim();
                }
              }

              // Extract body from iframe
              const iframe = messageDiv.querySelector('iframe.w-full.flex.flex-grow.min-h-tm-groot-iframe');
              if (iframe) {
                const srcdoc = iframe.getAttribute('srcdoc');
                if (srcdoc) {
                  body = srcdoc.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
                               .replace(/&amp;#x27;/g, "'").replace(/&amp;/g, '&');
                }
              }

              // Fallback: try to extract from textarea
              if (!body) {
                const textarea = messageDiv.querySelector('textarea.hidden');
                if (textarea) {
                  const rawContent = textarea.value || textarea.textContent;
                  if (rawContent) {
                    // Extract the HTML content part
                    const htmlMatch = rawContent.match(/Content-Type:\s*text\/html(.+)/s);
                    if (htmlMatch) {
                      body = htmlMatch[1].trim();
                      // Decode HTML entities
                      body = body.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
                                 .replace(/&amp;#x27;/g, "'").replace(/&amp;/g, '&');
                    } else {
                      // Use raw content as fallback
                      body = `<pre style="white-space: pre-wrap; font-family: monospace;">${rawContent}</pre>`;
                    }
                  }
                }
              }

              if (!body) {
                body = '<div style="padding: 20px; text-align: center; color: #666;">Email content not available</div>';
              }

              // Enhanced OTP detection for email detail
              let otp = null;
              const otpPatterns = [
                /(?:one-time\s+code\s+is)[:\s]*(\d{4,8})/gi,
                /(?:code\s+is)[:\s]*(\d{4,8})/gi,
                /(?:otp\s+is)[:\s]*(\d{4,8})/gi,
                /(?:verification\s+code)[:\s]*(\d{4,8})/gi,
                /(?:your\s+code)[:\s]*(\d{4,8})/gi,
                /(?:access\s+code)[:\s]*(\d{4,8})/gi
              ];
              
              for (const pattern of otpPatterns) {
                const match = body.match(pattern);
                if (match && match[1]) {
                  otp = match[1];
                  break;
                }
              }
              
              // Fallback: look for standalone 6-digit numbers
              if (!otp) {
                const sixDigitMatch = body.match(/\b(\d{6})\b/g);
                if (sixDigitMatch && sixDigitMatch.length === 1) {
                  otp = sixDigitMatch[0];
                }
              }

              return {
                success: true,
                email: {
                  id: emailId,
                  subject: subject,
                  sender: sender,
                  from: sender,
                  date: date,
                  time: date,
                  body: body,
                  html: body,
                  text: body.replace(/<[^>]*>/g, '').substring(0, 500),
                  otp: otp
                }
              };
            }, data.emailId);

            logger.success(`Email read successfully: ${data.emailId}`);
            return result;
    } catch (error) {
            logger.error('Read email error:', error);
            return createErrorResponse('Read email failed', error);
          }

        case 'switch':
          try {
            logger.info(`Switching to email: ${data.email}`);

            const switchResult = await this.performAction('switchEmail', { email: data.email });
            if (switchResult.success) {
              await this.wait(2000);
              
              // Verify switch was successful
              const emailInfo = await this.getCurrentEmailInfo();
              if (emailInfo.found && emailInfo.email === data.email) {
                logger.success(`Successfully switched to: ${data.email}`);
        return {
                  success: true,
                  email: data.email,
                  message: `Switched to ${data.email}`
                };
              } else {
        return {
          success: false,
                  message: `Switch may have failed. Current email: ${emailInfo.email || 'none'}`
                };
              }
            }

            // Fallback: Try direct URL navigation
            logger.info('Trying fallback: direct URL navigation');
            try {
              await this.page.goto(`${WEB.TEMPMAIL_URL}/switch/${data.email}`, { waitUntil: 'domcontentloaded' });
              await this.wait(2000);

              const emailInfo = await this.getCurrentEmailInfo();
              if (emailInfo.found && emailInfo.email === data.email) {
                logger.success(`Successfully switched via URL: ${data.email}`);
                  return {
                    success: true,
                    email: data.email,
                    message: `Switched to ${data.email}`
                  };
                }
              } catch (urlError) {
                logger.error('URL switch method failed:', urlError);
              }

            return createErrorResponse('Both switch methods failed');
    } catch (error) {
            logger.error('Switch email error:', error);
            return createErrorResponse('Switch email failed', error);
          }

        case 'refresh':
          try {
            logger.info('Refreshing inbox...');
            
            const refreshResult = await this.performAction('refreshInbox');
            if (refreshResult.success) {
              await this.wait(2000);
              logger.success('Inbox refreshed successfully');
              return createSuccessResponse('Inbox refreshed');
            } else {
              // Fallback: reload page
              await this.page.reload({ waitUntil: 'domcontentloaded' });
              await this.wait(1000);
              logger.success('Inbox refreshed via page reload');
              return createSuccessResponse('Inbox refreshed via page reload');
            }
    } catch (error) {
            logger.error('Refresh error:', error);
            return createErrorResponse('Refresh failed', error);
          }

        case 'clear':
          try {
            await this.cleanup();
            return createSuccessResponse('Session cleared successfully');
          } catch (error) {
            logger.error('Clear session error:', error);
            return createErrorResponse('Clear session failed', error);
      }

        default:
          return createErrorResponse(`Unknown action: ${action}`);
      }
    } catch (error) {
      logger.error(`Execute action error:`, error);
      return createErrorResponse('Execute action failed', error);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Clean up scraper session - delegates browser cleanup to ChromeLauncher
   */
  async cleanup() {
    logger.info(`🧹 Cleaning up scraper session: ${this.instanceId}`);
    
    // Reset scraper state
    this.currentEmail = null;
    this.isReady = false;
    
    // Let ChromeLauncher handle browser cleanup
    const result = await this.chromeLauncher.cleanup();
    
    // Clear references
    this.page = null;
    this.browser = null;
    
    logger.success(`✅ Scraper cleanup completed: ${this.instanceId}`);
    return result;
  }

  /**
   * Get current email (Legacy compatibility)
   * @returns {string|null} Current email address
   */
  getCurrentEmail() {
    return this.currentEmail;
  }

  /**
   * Force close global browser instance (static method)
   * @returns {Promise<void>}
   */
  static async forceCloseGlobalBrowser() {
    await ChromeLauncher.forceCloseGlobal();
  }

  /**
   * Clear session (legacy compatibility)
   * @param {boolean} forceCloseBrowser - Force close browser
   */
  async clear(forceCloseBrowser = false) {
    return await this.cleanup(forceCloseBrowser);
  }
}

module.exports = TempmailScraper;