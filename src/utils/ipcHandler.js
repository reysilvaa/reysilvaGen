/**
 * IPC Handler Utility
 * Provides consistent error handling and response formatting for IPC handlers
 * @module utils/ipc-handler
 */

/**
 * Wraps an IPC handler function with standardized error handling
 * @param {Function} handler - The handler function to wrap
 * @param {Object} options - Options for the wrapper
 * @param {boolean} options.logErrors - Whether to log errors (default: true)
 * @returns {Function} Wrapped handler function
 */
function wrapHandler(handler, options = {}) {
  const { logErrors = true } = options;
  
  return async (...args) => {
    try {
      const result = await handler(...args);
      return result;
    } catch (error) {
      if (logErrors) {
        console.error(`❌ IPC Handler Error:`, error);
      }
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
        error: error.name
      };
    }
  };
}

/**
 * Creates a success response
 * @param {*} data - Data to include in response
 * @param {string} message - Optional success message
 * @returns {Object} Success response object
 */
function successResponse(data = {}, message = null) {
  const response = { success: true, ...data };
  if (message) {
    response.message = message;
  }
  return response;
}

/**
 * Creates an error response
 * @param {string} message - Error message
 * @param {*} additionalData - Additional data to include
 * @returns {Object} Error response object
 */
function errorResponse(message, additionalData = {}) {
  return {
    success: false,
    message,
    ...additionalData
  };
}

/**
 * Validates required parameters
 * @param {Object} params - Parameters to validate
 * @param {string[]} required - Required parameter names
 * @throws {Error} If validation fails
 */
function validateParams(params, required) {
  for (const param of required) {
    if (params[param] === undefined || params[param] === null) {
      throw new Error(`Missing required parameter: ${param}`);
    }
  }
}

/**
 * Creates a lazy-initialized handler that ensures a service exists
 * @param {Function} serviceGetter - Function that returns or creates the service
 * @param {Function} handler - Handler function that uses the service
 * @param {string} errorMessage - Error message if service is unavailable
 * @returns {Function} Wrapped handler
 */
function lazyServiceHandler(serviceGetter, handler, errorMessage = 'Service not available') {
  return async (...args) => {
    const service = await serviceGetter();
    if (!service) {
      return errorResponse(errorMessage);
    }
    return handler(service, ...args);
  };
}

module.exports = {
  wrapHandler,
  successResponse,
  errorResponse,
  validateParams,
  lazyServiceHandler
};

