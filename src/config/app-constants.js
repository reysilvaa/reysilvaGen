/**
 * Application-wide Constants
 * Centralized constants to avoid magic numbers and strings
 * All constants merged into one file for better organization
 * @module config/app-constants
 */

const path = require("path");

// Window dimensions and UI configuration
const WINDOW = {
  main: {
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 700,
    backgroundColor: '#0a0a0a'
  },
  splash: {
    width: 550,
    height: 400
  },
  admin: {
    width: 1200,
    height: 800
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

// Timing constants (in milliseconds)
const TIMING = {
  SPLASH_DURATION: 1800,
  TEMPMAIL_LOAD_DELAY: 2500,
  TEMPMAIL_FORM_DELAY: 1800,
  TEMPMAIL_ACTION_DELAY: 400,
  TEMPMAIL_CREATE_DELAY: 1500,
  TEMPMAIL_RELOAD_DELAY: 2000,
  TEMPMAIL_EMAIL_OPEN_DELAY: 1500,
  CURSOR_CLOSE_DELAY: 2000,
  UPDATE_CHECK_TIMEOUT: 15000
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
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// Validation constants
const VALIDATION = {
  MAX_STRING_LENGTH: 1000,
  MIN_PASSWORD_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ZIP_CODE_REGEX: /^\d{5}(-\d{4})?$/,
  PHONE_REGEX: /^[\d\s\-\(\)\+]{10,}$/
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
  MAX_CARD_GENERATION_MULTIPLIER: 10,
  MIN_ATTEMPTS: 1000
};

// Electron window preferences
const BROWSER_WINDOW = {
  DEFAULT_WIDTH: 1200,
  DEFAULT_HEIGHT: 800,
  TEMPMAIL_WIDTH: 1200,
  TEMPMAIL_HEIGHT: 800
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
  // UI & Window Configuration (from old constants.js)
  WINDOW,
  PATHS,
  WEB_PREFERENCES,
  
  // Application Constants (refactored)
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
  BROWSER_WINDOW,
  CURSOR_PATHS,
  LOG,
  CARD_TYPES,
  
  // Legacy export for backward compatibility
  APP_CONFIG: {
    window: WINDOW,
    timing: { splashDuration: 1800 },
    paths: PATHS,
    icons: PATHS.icons,
    webPreferences: WEB_PREFERENCES
  }
};

