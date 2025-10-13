/**
 * Logger Utility
 * Provides consistent logging across the application
 * @module utils/logger
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  SUCCESS: 'success',
  DEBUG: 'debug'
};

const LOG_SYMBOLS = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  success: '✅',
  debug: '🔍'
};

class Logger {
  constructor(prefix = '') {
    this.prefix = prefix;
    this.logs = [];
    this.maxLogs = 1000; // Prevent memory leaks
  }

  /**
   * Format log message with timestamp and level
   * @private
   */
  _formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    const symbol = LOG_SYMBOLS[level] || '';
    const prefix = this.prefix ? `[${this.prefix}]` : '';
    return `${symbol} ${prefix} ${message}`;
  }

  /**
   * Add log to history
   * @private
   */
  _addToHistory(level, message) {
    this.logs.push({
      level,
      message,
      timestamp: new Date(),
      prefix: this.prefix
    });

    // Prevent memory leaks by limiting log history
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Log error message
   */
  error(message, error = null) {
    const formattedMessage = this._formatMessage(LOG_LEVELS.ERROR, message);
    console.error(formattedMessage, error || '');
    this._addToHistory(LOG_LEVELS.ERROR, message);
  }

  /**
   * Log warning message
   */
  warn(message) {
    const formattedMessage = this._formatMessage(LOG_LEVELS.WARN, message);
    console.warn(formattedMessage);
    this._addToHistory(LOG_LEVELS.WARN, message);
  }

  /**
   * Log info message
   */
  info(message) {
    const formattedMessage = this._formatMessage(LOG_LEVELS.INFO, message);
    console.log(formattedMessage);
    this._addToHistory(LOG_LEVELS.INFO, message);
  }

  /**
   * Log success message
   */
  success(message) {
    const formattedMessage = this._formatMessage(LOG_LEVELS.SUCCESS, message);
    console.log(formattedMessage);
    this._addToHistory(LOG_LEVELS.SUCCESS, message);
  }

  /**
   * Log debug message (only in development)
   */
  debug(message) {
    if (process.argv.includes('--dev')) {
      const formattedMessage = this._formatMessage(LOG_LEVELS.DEBUG, message);
      console.log(formattedMessage);
      this._addToHistory(LOG_LEVELS.DEBUG, message);
    }
  }

  /**
   * Get log history
   */
  getHistory() {
    return [...this.logs];
  }

  /**
   * Clear log history
   */
  clearHistory() {
    this.logs = [];
  }

  /**
   * Create a child logger with a new prefix
   */
  child(childPrefix) {
    const newPrefix = this.prefix ? `${this.prefix}:${childPrefix}` : childPrefix;
    return new Logger(newPrefix);
  }
}

// Create default logger instance
const defaultLogger = new Logger();

module.exports = {
  Logger,
  LOG_LEVELS,
  LOG_SYMBOLS,
  default: defaultLogger,
  // Export convenience methods
  error: (...args) => defaultLogger.error(...args),
  warn: (...args) => defaultLogger.warn(...args),
  info: (...args) => defaultLogger.info(...args),
  success: (...args) => defaultLogger.success(...args),
  debug: (...args) => defaultLogger.debug(...args)
};

