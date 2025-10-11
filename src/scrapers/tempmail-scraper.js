/**
 * Tempmail Headless Browser Handler
 * Using Electron BrowserWindow as headless scraper
 */

const { BrowserWindow } = require('electron');

class TempmailHeadless {
  constructor() {
    this.window = null;
    this.currentEmail = null;
  }

  /**
   * Create or get hidden browser window
   */
  getWindow() {
    if (!this.window || this.window.isDestroyed()) {
      this.window = new BrowserWindow({
        show: false,
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          javascript: true,
          webSecurity: false, // Allow external images
          allowRunningInsecureContent: true
        }
      });

      // Set CSP untuk mengizinkan gambar eksternal
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
    }
    return this.window;
  }

  /**
   * Generate email from tempmail.ac.id
   * @param {string} preferredDomain - Domain untuk fallback email (oliq.me, asmojo.tech, gipo.me)
   * @param {string} customEmail - Custom email to switch to (e.g., username@domain.com)
   */
  async generateEmail(preferredDomain = null, customEmail = null) {
    try {
      const window = this.getWindow();
      
      // If custom email is provided, scrape form submission
      if (customEmail) {
        const [username, domain] = customEmail.split('@');
        
        return new Promise((resolve) => {
          const loadHandler = async () => {
            try {
              await new Promise(r => setTimeout(r, 1800)); // Wait untuk Livewire
              
              console.log(`📝 Creating email: ${username}@${domain}`);
              
              // Fill form dan submit
              const result = await window.webContents.executeJavaScript(`
                (async function() {
                  // Klik tombol New untuk show form (jika ada)
                  const newBtn = document.querySelector('[x-on\\\\:click*="in_app = true"]');
                  if (newBtn) {
                    newBtn.click();
                    await new Promise(r => setTimeout(r, 400));
                  }
                  
                  // Isi username
                  const userInput = document.getElementById('user');
                  if (userInput) {
                    userInput.value = '${username}';
                    userInput.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                  
                  // Pilih domain dari dropdown
                  const domainOption = document.querySelector('[x-on\\\\:click*="setDomain(\\'${domain}\\')"]');
                  if (domainOption) {
                    domainOption.click();
                    await new Promise(r => setTimeout(r, 200));
                  }
                  
                  // Klik button create
                  const createBtn = document.getElementById('create');
                  if (createBtn) {
                    createBtn.click();
                    await new Promise(r => setTimeout(r, 1500)); // Wait for Livewire
                  }
                  
                  // Get generated email
                  const emailDiv = document.getElementById('email_id');
                  if (emailDiv && emailDiv.textContent) {
                    return { email: emailDiv.textContent.trim() };
                  }
                  
                  return { email: null };
                })();
              `);
              
              if (result.email && result.email === customEmail) {
                this.currentEmail = customEmail;
                console.log(`✅ Email successfully created: ${customEmail}`);
                resolve({ success: true, email: customEmail, message: 'Email created successfully' });
              } else if (result.email) {
                this.currentEmail = result.email;
                console.log(`⚠️ Website returned: ${result.email} (requested: ${customEmail})`);
                resolve({ success: true, email: result.email, message: 'Email created successfully' });
              } else {
                console.error('❌ No email found after form submission');
                resolve({ success: false, email: null, message: 'Failed to create email' });
              }
            } catch (error) {
              console.error('❌ Error during email creation:', error);
              resolve({ success: false, email: null, message: `Error: ${error.message}` });
            }
          };
          
          window.webContents.once('did-finish-load', loadHandler);
          window.loadURL('https://tempmail.ac.id').catch(err => {
            console.error('❌ Failed to load tempmail.ac.id:', err);
            resolve({ success: false, email: null, message: `Failed to load: ${err.message}` });
          });
        });
      }
      
      // Reset current email - akan di-set ulang setelah generate
      this.currentEmail = null;
      
      return new Promise((resolve) => {
        const loadHandler = async () => {
          try {
            await new Promise(r => setTimeout(r, 2000)); // Wait for Livewire
            
            const result = await window.webContents.executeJavaScript(`
              (function() {
                // Ambil langsung dari div#email_id
                const emailDiv = document.getElementById('email_id');
                
                if (emailDiv && emailDiv.textContent) {
                  return { email: emailDiv.textContent.trim() };
                }
                
                return { email: null };
              })();
            `);

            if (result.email) {
              // Selalu gunakan email yang didapat, tidak perlu regenerate
              this.currentEmail = result.email;
              resolve({ success: true, email: result.email, message: 'Email generated successfully' });
            } else {
              const fallback = this.generateFallbackEmail(preferredDomain);
              resolve({ success: true, email: fallback, message: 'Email generated (offline)', isOffline: true });
            }
          } catch (error) {
            resolve({ success: false, message: error.message });
          }
        };

        window.webContents.once('did-finish-load', loadHandler);
        window.loadURL('https://tempmail.ac.id').catch(err => {
          resolve({ success: false, message: err.message });
        });
      });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Check inbox for emails
   */
  async checkInbox() {
    try {
      if (!this.window || this.window.isDestroyed()) {
        return { success: false, message: "No email generated yet", emails: [] };
      }

      if (!this.currentEmail) {
        return { success: false, message: "No email active", emails: [] };
      }

      console.log(`🔍 Checking inbox for: ${this.currentEmail}`);

      // Get current URL
      const currentURL = this.window.webContents.getURL();
      console.log(`Current URL: ${currentURL}`);

      await this.window.webContents.reload();
      
      return new Promise((resolve) => {
        this.window.webContents.once('did-finish-load', async () => {
          try {
            await new Promise(r => setTimeout(r, 2500)); // Wait longer for Livewire
            
            const result = await this.window.webContents.executeJavaScript(`
              (function() {
                const emails = [];
                
                // Gunakan XPath untuk mencari email items dengan data-id
                const emailXPath = '//*[@data-id]';
                const emailResult = document.evaluate(emailXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                
                console.log('📧 Found email items via XPath:', emailResult.snapshotLength);
                
                for (let i = 0; i < emailResult.snapshotLength; i++) {
                  const item = emailResult.snapshotItem(i);
                  const id = item.getAttribute('data-id');
                  
                  // Skip jika ID null, empty, atau "0"
                  if (!id || id === '0' || id === 'null') {
                    console.log('⏭️ Skipping email with invalid ID:', id);
                    continue;
                  }
                  
                  // Gunakan XPath untuk mencari child divs
                  const childDivXPath = './div';
                  const childDivResult = document.evaluate(childDivXPath, item, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                  
                  const senderDiv = childDivResult.snapshotLength > 0 ? childDivResult.snapshotItem(0) : null;
                  const subjectDiv = childDivResult.snapshotLength > 1 ? childDivResult.snapshotItem(1) : null;
                  
                  // Extract sender info menggunakan XPath
                  let senderName = 'Unknown';
                  let senderEmail = '';
                  
                  if (senderDiv) {
                    // XPath untuk text nodes pertama
                    const textNodeXPath = './text()[normalize-space()]';
                    const textResult = document.evaluate(textNodeXPath, senderDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    if (textResult.singleNodeValue) {
                      senderName = textResult.singleNodeValue.textContent.trim();
                    }
                    
                    // XPath untuk email dengan class text-xs
                    const emailXPath = './/div[contains(@class, "text-xs")]';
                    const emailResult = document.evaluate(emailXPath, senderDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    if (emailResult.singleNodeValue) {
                      senderEmail = emailResult.singleNodeValue.textContent.trim();
                    }
                  }
                  
                  // Extract date - akan diambil saat email dibuka
                  let emailDate = 'Just now';
                  
                  const email = {
                    id,
                    sender: senderName,
                    from: senderEmail,
                    subject: subjectDiv?.textContent.trim() || 'No Subject',
                    time: emailDate,
                    date: emailDate,
                    read: false,
                    timestamp: new Date().getTime() // For sorting
                  };
                  
                  console.log('📨 Valid email found via XPath:', email);
                  emails.push(email);
                }
                
                // Sort emails by timestamp (newest first)
                emails.sort((a, b) => b.timestamp - a.timestamp);
                
                console.log('✅ Total emails:', emails.length);
                return { emails };
              })();
            `);
            
            console.log(`📬 Inbox result: ${result.emails.length} email(s) found`);

            // Extract OTP and date from each email
            for (const email of result.emails) {
              const otp = await this.extractOTP(email.id);
              if (otp) {
                email.otp = otp;
                email.preview = `OTP: ${otp} - ${email.subject}`;
              } else {
                email.preview = email.subject;
              }
              
              // Extract real date from email detail
              const emailDate = await this.extractEmailDate(email.id);
              if (emailDate && emailDate !== 'Unknown') {
                email.time = emailDate;
                email.date = emailDate;
                // Update timestamp for better sorting
                email.timestamp = this.parseEmailDate(emailDate);
              }
            }

            // Sort emails by timestamp after updating dates (newest first)
            result.emails.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            resolve({
              success: true,
              emails: result.emails,
              count: result.emails.length,
              message: result.emails.length > 0 ? `Found ${result.emails.length} email(s)` : 'Inbox is empty'
            });
          } catch (error) {
            resolve({ success: false, message: error.message, emails: [] });
          }
        });
      });
    } catch (error) {
      return { success: false, message: error.message, emails: [] };
    }
  }

  /**
   * Extract date from email by ID
   */
  async extractEmailDate(emailId) {
    try {
      const result = await this.window.webContents.executeJavaScript(`
        (function() {
          const messageDiv = document.querySelector('#message-${emailId}');
          if (!messageDiv) return null;
          
          // Gunakan XPath untuk mencari div dengan class "text-xs overflow-ellipsis" yang berisi tanggal
          const xpath = './/div[contains(@class, "text-xs") and contains(@class, "overflow-ellipsis")]';
          const xpathResult = document.evaluate(xpath, messageDiv, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          
          for (let i = 0; i < xpathResult.snapshotLength; i++) {
            const element = xpathResult.snapshotItem(i);
            const text = element.textContent.trim();
            
            // Check if text matches date pattern (DD MMM YYYY HH:MM AM/PM)
            if (text.match(/^\\d{1,2}\\s+\\w{3}\\s+\\d{4}\\s+\\d{1,2}:\\d{2}\\s+(AM|PM)$/i)) {
              console.log('📅 Found date via XPath:', text);
              return text;
            }
          }
          
          // Fallback XPath: cari struktur Date dengan parent div
          const dateXPath = './/div[text()="Date"]/following-sibling::div[contains(@class, "text-xs")]';
          const dateResult = document.evaluate(dateXPath, messageDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          
          if (dateResult.singleNodeValue) {
            const dateText = dateResult.singleNodeValue.textContent.trim();
            console.log('📅 Found date via fallback XPath:', dateText);
            return dateText;
          }
          
          // Last fallback: traditional method
          const dateSection = messageDiv.querySelector('.flex.justify-between.items-center');
          if (dateSection) {
            const divs = dateSection.querySelectorAll('div');
            if (divs.length >= 2) {
              const dateDiv = divs[1];
              const dateText = dateDiv.querySelector('.text-xs.overflow-ellipsis') || dateDiv.querySelector('.text-xs');
              if (dateText) {
                console.log('📅 Found date via CSS fallback:', dateText.textContent.trim());
                return dateText.textContent.trim();
              }
            }
          }
          
          console.log('❌ No date found for email:', '${emailId}');
          return null;
        })();
      `);
      return result;
    } catch (error) {
      console.error('Error extracting date:', error);
      return null;
    }
  }

  /**
   * Parse email date string to timestamp for sorting
   */
  parseEmailDate(dateString) {
    try {
      // Format: "11 Oct 2025 06:18 PM"
      const date = new Date(dateString);
      return date.getTime();
    } catch (error) {
      return new Date().getTime(); // Fallback to current time
    }
  }

  /**
   * Extract OTP from email by ID
   */
  async extractOTP(emailId) {
    try {
      const result = await this.window.webContents.executeJavaScript(`
        (function() {
          // XPath untuk mencari message div
          const messageXPath = '//*[@id="message-${emailId}"]';
          const messageResult = document.evaluate(messageXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const messageDiv = messageResult.singleNodeValue;
          
          if (!messageDiv) return null;
          
          // XPath untuk mencari iframe
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
          
          // Fallback: get all text content
          if (!content) {
            content = messageDiv.textContent;
          }
          
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
      return null;
    }
  }

  /**
   * Read email details
   */
  async readEmail(emailId) {
    try {
      if (!this.window || this.window.isDestroyed()) {
        return { success: false, message: "No email generated yet" };
      }

      console.log(`📖 Reading email ID: ${emailId}`);

      // First, click on the email to open it menggunakan XPath
      const clicked = await this.window.webContents.executeJavaScript(`
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
        console.error(`❌ Email item not found: ${emailId}`);
        return { success: false, message: 'Email not found in inbox' };
      }

      // Wait for email content to load
      await new Promise(r => setTimeout(r, 1500));

      const result = await this.window.webContents.executeJavaScript(`
        (function() {
          // XPath untuk mencari message div
          const messageXPath = '//*[@id="message-${emailId}"]';
          const messageResult = document.evaluate(messageXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const messageDiv = messageResult.singleNodeValue;
          
          if (!messageDiv) {
            console.error('Message div not found for ID: ${emailId}');
            return { success: false, message: 'Email content not loaded' };
          }

          // Extract menggunakan XPath
          let senderName = 'Unknown';
          let senderEmail = '';
          let date = 'Unknown';
          
          // XPath untuk mencari tanggal dengan akurat
          const dateXPath = './/div[contains(@class, "text-xs") and contains(@class, "overflow-ellipsis") and contains(text(), "20")]';
          const dateResult = document.evaluate(dateXPath, messageDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          
          if (dateResult.singleNodeValue) {
            const dateText = dateResult.singleNodeValue.textContent.trim();
            if (dateText.match(/^\\d{1,2}\\s+\\w{3}\\s+\\d{4}\\s+\\d{1,2}:\\d{2}\\s+(AM|PM)$/i)) {
              date = dateText;
              console.log('📅 Date extracted via XPath:', date);
            }
          }
          
          // XPath untuk mencari sender info
          const senderXPath = './/div[contains(@class, "flex") and contains(@class, "justify-between")]/div[1]';
          const senderResult = document.evaluate(senderXPath, messageDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          
          if (senderResult.singleNodeValue) {
            const senderDiv = senderResult.singleNodeValue;
            
            // XPath untuk text node pertama (sender name)
            const nameXPath = './text()[normalize-space()]';
            const nameResult = document.evaluate(nameXPath, senderDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (nameResult.singleNodeValue) {
              senderName = nameResult.singleNodeValue.textContent.trim();
            }
            
            // XPath untuk email address
            const emailXPath = './/div[contains(@class, "text-xs")]';
            const emailResult = document.evaluate(emailXPath, senderDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (emailResult.singleNodeValue) {
              senderEmail = emailResult.singleNodeValue.textContent.trim();
            }
          }
          
          // XPath untuk subject
          const subjectXPath = './/div[contains(@class, "border-t") and contains(@class, "border-b") and contains(@class, "border-dashed")]';
          const subjectResult = document.evaluate(subjectXPath, messageDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const subject = subjectResult.singleNodeValue ? subjectResult.singleNodeValue.textContent.trim() : 'No Subject';
          
          // XPath untuk iframe body
          const iframeXPath = './/iframe';
          const iframeResult = document.evaluate(iframeXPath, messageDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const iframe = iframeResult.singleNodeValue;
          
          let body = '';
          let rawContent = '';
          
          if (iframe) {
            const srcdoc = iframe.getAttribute('srcdoc');
            if (srcdoc) {
              // Decode HTML entities
              rawContent = srcdoc.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
                                 .replace(/&amp;#x27;/g, "'").replace(/&amp;/g, '&');
              body = rawContent;
            }
          }
          
          // Extract OTP from rawContent
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
          
          // If no body from iframe, show placeholder
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

      console.log('📧 Read email result:', result.success ? 'Success' : result.message);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get current email
   */
  getCurrentEmail() {
    return this.currentEmail;
  }

  /**
   * Toggle debug window visibility
   */
  toggleDebug() {
    if (!this.window || this.window.isDestroyed()) {
      return { success: false, message: "No window available" };
    }

    if (this.window.isVisible()) {
      this.window.hide();
      return { success: true, visible: false };
    } else {
      this.window.show();
      this.window.webContents.openDevTools();
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
        // Ignore errors
      }
      this.window.destroy();
      this.window = null;
    }
    this.currentEmail = null;
  }

  /**
   * Generate fallback email
   * @param {string} preferredDomain - Domain yang dipilih user
   */
  generateFallbackEmail(preferredDomain = null) {
    const randomString = Math.random().toString(36).substring(2, 10);
    const domains = ['oliq.me', 'asmojo.tech', 'gipo.me'];
    const domain = preferredDomain && domains.includes(preferredDomain) 
      ? preferredDomain 
      : domains[Math.floor(Math.random() * domains.length)];
    this.currentEmail = `${randomString}@${domain}`;
    return this.currentEmail;
  }

  /**
   * Switch to existing email (FAST - no scraping needed)
   * @param {string} email - Email dari history
   */
  async switchToEmail(email) {
    try {
      console.log(`🔄 Switching to: ${email}`);
      
      if (!this.window) {
        this.window = this.createWindow();
      }

      const switchUrl = `https://tempmail.ac.id/switch/${email}`;
      await this.window.loadURL(switchUrl);

      // Wait for page load
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get the displayed email
      const displayedEmail = await this.window.webContents.executeJavaScript(`
        (function() {
          const emailEl = document.querySelector('[x-text="currentEmail"]') || 
                         document.querySelector('.text-gray-900.font-medium');
          return emailEl ? emailEl.textContent.trim() : null;
        })();
      `);

      this.currentEmail = displayedEmail || email;
      
      console.log(`✅ Switched to: ${this.currentEmail}`);
      
      return {
        success: true,
        email: this.currentEmail,
        message: `Switched to ${this.currentEmail}`
      };

    } catch (error) {
      console.error("❌ Switch error:", error);
      return {
        success: false,
        message: error.message,
        email: null
      };
    }
  }

  /**
   * Delete current email (FAST - just click delete button)
   */
  async deleteCurrentEmail() {
    try {
      console.log(`🗑️ Deleting email: ${this.currentEmail}`);
      
      if (!this.window) {
        return {
          success: false,
          message: "No active session"
        };
      }

      // Click delete button
      await this.window.webContents.executeJavaScript(`
        (function() {
          const deleteBtn = document.querySelector('[wire\\\\:click="deleteEmail"]');
          if (deleteBtn) {
            deleteBtn.click();
            return true;
          }
          return false;
        })();
      `);

      // Wait for deletion
      await new Promise(resolve => setTimeout(resolve, 1000));

      const oldEmail = this.currentEmail;
      this.currentEmail = null;

      console.log(`✅ Deleted: ${oldEmail}`);

      return {
        success: true,
        message: `Deleted ${oldEmail}`,
        deletedEmail: oldEmail
      };

    } catch (error) {
      console.error("❌ Delete error:", error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = TempmailHeadless;

