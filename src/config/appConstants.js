/**
 * Application-wide Constants
 * Centralized constants to avoid magic numbers and strings
 * All constants merged into one file for better organization
 * @module config/app-constants
 */

const path = require("path");

// UI Configuration - Consolidated window settings
const UI = {
  window: {
    main: { width: 1200, height: 800, minWidth: 900, minHeight: 700 },
    splash: { width: 550, height: 400 },
    admin: { width: 1200, height: 800 },
    tempmail: { width: 1200, height: 800 }, // Moved from BROWSER_WINDOW
    backgroundColor: '#0a0a0a'
  },
  zIndex: {
    modal: 100000,
    notification: 10001,
    overlay: 10000
  },
  animation: {
    duration: 300,
    slideIn: 'slideIn 0.3s ease'
  }
};

// Application paths
const PATHS = {
  assets: path.join(__dirname, "../../assets"),
  renderer: path.join(__dirname, "../renderer"),
  preload: path.join(__dirname, "../main/preload.js"),
  icons: {
    main: path.join(__dirname, "../../assets", "icon.ico")
  }
};

// Web preferences for Electron windows
const WEB_PREFERENCES = {
  secure: {
    nodeIntegration: false,
    contextIsolation: true,
    webSecurity: true,
    allowRunningInsecureContent: false
  }
};

// Timing constants (in milliseconds) - Organized by category
const TIMING = {
  app: {
    splashDuration: 1800,
    updateCheckTimeout: 15000
  },
  tempmail: {
    loadDelay: 2500,
    formDelay: 1800,
    actionDelay: 400,
    createDelay: 1500,
    reloadDelay: 2000,
    emailOpenDelay: 1500
  },
  cursor: {
    closeDelay: 2000
  },
  notification: {
    success: 3000,
    error: 4000,
    info: 3500,
    warning: 4000
  }
};

// Session constants
const SESSION = {
  EXPIRY_HOURS: 24,
  TOKEN_LENGTH: 32
};

// Password hashing constants
const CRYPTO = {
  SALT_LENGTH: 16,
  HASH_ITERATIONS: 10000,
  HASH_KEY_LENGTH: 64,
  HASH_ALGORITHM: 'sha512',
  UUID_FORMAT: 'v4'
};

// Card generation constants
const CARD = {
  MIN_LENGTH: 13,
  MAX_LENGTH: 19,
  BIN_MIN_LENGTH: 6,
  BIN_MAX_LENGTH: 9,
  CVV_MIN_LENGTH: 3,
  CVV_MAX_LENGTH: 4,
  DEFAULT_LENGTH: 16,
  MAX_BULK_GENERATION: 10000,
  DEFAULT_EXPIRY_YEARS: 5
};

// File paths
const FILES = {
  CONFIG_NAME: 'reysilvagen.cfg',
  ADDRESS_CSV: 'us-US.csv',
  SECURITY_LOG: 'security.log'
};

// HTTP/Web constants
const WEB = {
  TEMPMAIL_URL: 'https://tempmail.ac.id',
  TEMPMAIL_SWITCH_URL: 'https://tempmail.ac.id/switch',
  DEFAULT_DOMAINS: ['oliq.me', 'asmojo.tech', 'gipo.me'],
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // Connection settings for better reliability
  CONNECTION_TIMEOUT: 15000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000
};

// Validation patterns and limits
const VALIDATION = {
  strings: {
    maxLength: 1000,
    minPasswordLength: 8
  },
  patterns: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    zipCode: /^\d{5}(-\d{4})?$/,
    phone: /^[\d\s\-\(\)\+]{10,}$/,
    binPattern: /^[0-9x]+$/i
  }
};

// XPath selectors for web scraping
const XPATH = {
  EMAIL_ID: '//*[@id="email_id"]',
  EMAIL_WITH_DATA_ID: '//*[@data-id]',
  EMAIL_TEXT: '//*[contains(@class, "text-gray-900") and contains(@class, "font-medium")]',
  SENDER_EMAIL: './/div[contains(@class, "text-xs")]',
  DATE_FIELD: './/div[contains(@class, "text-xs") and contains(@class, "overflow-ellipsis")]',
  MESSAGE_DIV: '//*[@id="message-{id}"]',
  IFRAME: './/iframe',
  DELETE_BUTTON: '[wire\\:click="deleteEmail"]'
};

// OTP detection patterns
const OTP_PATTERNS = [
  /(?:one-time\s+code\s+is|code\s+is|otp\s+is|verification\s+code)\s*[:;]?\s*(\d{4,8})/gi,
  /\b(\d{6})\b/g,
  /your\s+(?:one-time\s+)?code\s+is[\s:]+(\d{4,8})/gi
];

// Date format for parsing email dates
const DATE_FORMAT = {
  EMAIL_DATE_REGEX: /^\d{1,2}\s+\w{3}\s+\d{4}\s+\d{1,2}:\d{2}\s+(AM|PM)$/i
};

// Retry and attempt limits
const RETRY = {
  maxCardGenerationMultiplier: 10,
  minAttempts: 1000
};

// Cursor reset paths (Windows-specific)
const CURSOR_PATHS = {
  APPDATA_FOLDER: 'Cursor',
  USER_FOLDER: 'User',
  GLOBAL_STORAGE: 'globalStorage',
  STORAGE_JSON: 'storage.json',
  STATE_DB: 'state.vscdb',
  INSTALL_PATH: ['Programs', 'Cursor'],
  PACKAGE_JSON: ['resources', 'app', 'package.json'],
  WORKBENCH_JS: ['resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js']
};

// Log constants
const LOG = {
  MAX_HISTORY: 1000,
  SEPARATOR: '='.repeat(50)
};

// Card type detection
const CARD_TYPES = {
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  AMEX: 'amex',
  DISCOVER: 'discover',
  JCB: 'jcb',
  DINERS: 'diners',
  UNIONPAY: 'unionpay',
  UNKNOWN: 'unknown'
};

module.exports = {
  // New organized structure
  UI,
  PATHS,
  WEB_PREFERENCES,
  TIMING,
  SESSION,
  CRYPTO,
  CARD,
  FILES,
  WEB,
  VALIDATION,
  XPATH,
  OTP_PATTERNS,
  DATE_FORMAT,
  RETRY,
  CURSOR_PATHS,
  LOG,
  CARD_TYPES,
  
  // Backward compatibility - Legacy exports
  WINDOW: UI.window, // Map to new structure
  BROWSER_WINDOW: UI.window, // Remove redundancy
  
  // Legacy config object for backward compatibility
  APP_CONFIG: {
    window: UI.window,
    timing: { splashDuration: TIMING.app.splashDuration },
    paths: PATHS,
    icons: PATHS.icons,
    webPreferences: WEB_PREFERENCES
  }
};

