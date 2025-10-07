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
          javascript: true
        }
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
      
      // Jika ada email sebelumnya, delete dulu
      if (this.currentEmail && this.window && !this.window.isDestroyed()) {
        try {
          await this.window.webContents.executeJavaScript(`
            (function() {
              const deleteBtn = document.querySelector('[wire\\\\:click="deleteEmail"]');
              if (deleteBtn) deleteBtn.click();
            })();
          `);
          await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
          // Ignore, akan create window baru
        }
      }
      
      return new Promise((resolve) => {
        const loadHandler = async () => {
          try {
            await new Promise(r => setTimeout(r, 2500)); // Wait for Livewire
            
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

            if (result.email && result.email !== this.currentEmail) {
              this.currentEmail = result.email;
              resolve({ success: true, email: result.email, message: 'Email generated successfully' });
            } else if (result.email) {
              // Email sama, coba delete dan reload
              await window.webContents.executeJavaScript(`
                (function() {
                  const deleteBtn = document.querySelector('[wire\\\\:click="deleteEmail"]');
                  if (deleteBtn) deleteBtn.click();
                })();
              `);
              await new Promise(r => setTimeout(r, 2500));
              
              const newResult = await window.webContents.executeJavaScript(`
                (function() {
                  const emailDiv = document.getElementById('email_id');
                  if (emailDiv && emailDiv.textContent) {
                    return { email: emailDiv.textContent.trim() };
                  }
                  return { email: null };
                })();
              `);
              
              if (newResult.email && newResult.email !== this.currentEmail) {
                this.currentEmail = newResult.email;
                resolve({ success: true, email: newResult.email, message: 'Email generated successfully' });
              } else {
                const fallback = this.generateFallbackEmail(preferredDomain);
                resolve({ success: true, email: fallback, message: 'Email generated (fallback)', isOffline: true });
              }
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
                const emailItems = document.querySelectorAll('[data-id]');
                
                console.log('📧 Found email items:', emailItems.length);
                
                emailItems.forEach(item => {
                  const id = item.getAttribute('data-id');
                  const senderEl = item.querySelector('.w-1\\\\/2:first-child, [class*="sender"]');
                  const subjectEl = item.querySelector('.w-1\\\\/2:nth-child(2), [class*="subject"]');
                  const emailEl = item.querySelector('.text-xs');
                  
                  if (id) {
                    const email = {
                      id: id,
                      sender: senderEl ? senderEl.textContent.trim() : 'Unknown',
                      from: emailEl ? emailEl.textContent.trim() : '',
                      subject: subjectEl ? subjectEl.textContent.trim() : 'No Subject',
                      read: false
                    };
                    console.log('📨 Email found:', email);
                    emails.push(email);
                  }
                });
                
                console.log('✅ Total emails:', emails.length);
                return { emails };
              })();
            `);
            
            console.log(`📬 Inbox result: ${result.emails.length} email(s) found`);

            // Extract OTP from each email
            for (const email of result.emails) {
              const otp = await this.extractOTP(email.id);
              if (otp) {
                email.otp = otp;
                email.preview = `🔐 ${otp} - ${email.subject}`;
              } else {
                email.preview = email.subject;
              }
            }

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
   * Extract OTP from email by ID
   */
  async extractOTP(emailId) {
    try {
      const result = await this.window.webContents.executeJavaScript(`
        (function() {
          const messageDiv = document.querySelector('#message-${emailId}');
          if (!messageDiv) return null;
          
          const textarea = messageDiv.querySelector('textarea');
          if (!textarea) return null;
          
          const content = textarea.value;
          const otpPatterns = [
            /(?:code|otp|token|verification|kode)[\\s\\S]{0,50}?(\\d{4,8})/gi,
            /(\\d{6})/g,
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

      const result = await this.window.webContents.executeJavaScript(`
        (function() {
          const messageDiv = document.querySelector('#message-${emailId}');
          if (!messageDiv) return { success: false, message: 'Email not found' };

          const textarea = messageDiv.querySelector('textarea');
          if (!textarea) return { success: false, message: 'Email content not found' };

          const rawContent = textarea.value;
          const fromMatch = rawContent.match(/From:\\s*"?([^"<]+)"?\\s*<?([^>]+)?>?/i);
          const subjectMatch = rawContent.match(/Subject:\\s*(.+?)(?:\\r?\\n|Date:)/i);
          const dateMatch = rawContent.match(/Date:\\s*(.+?)(?:\\r?\\n|Content-Type:)/i);
          
          // Extract OTP
          const otpPatterns = [
            /(?:code|otp|token|verification|kode)[\\s\\S]{0,50}?(\\d{4,8})/gi,
            /(\\d{6})/g,
            /your\\s+(?:one-time\\s+)?code\\s+is[\\s:]+(\\d{4,8})/gi
          ];
          
          let otp = null;
          for (const pattern of otpPatterns) {
            const matches = rawContent.match(pattern);
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
          
          const bodyMatch = rawContent.match(/Content-Type:\\s*text\\/html[\\s\\S]*?(<[\\s\\S]+)/i);
          let body = bodyMatch ? bodyMatch[1] : rawContent;
          body = body.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
                     .replace(/&amp;#x27;/g, "'").replace(/&amp;/g, '&');

          return {
            success: true,
            email: {
              id: '${emailId}',
              from: fromMatch ? (fromMatch[2] || fromMatch[1]) : 'Unknown',
              sender: fromMatch ? fromMatch[1] : 'Unknown',
              subject: subjectMatch ? subjectMatch[1].trim() : 'No Subject',
              date: dateMatch ? dateMatch[1].trim() : 'Unknown',
              body: body,
              html: body,
              text: body.replace(/<[^>]*>/g, '').substring(0, 500),
              otp: otp
            }
          };
        })();
      `);

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
}

module.exports = TempmailHeadless;

