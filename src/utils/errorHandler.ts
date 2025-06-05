
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  originalError?: any;
}

export class ErrorHandler {
  private static isDevelopment = import.meta.env.DEV;

  static createError(type: ErrorType, message: string, originalError?: any): AppError {
    const userMessages = {
      [ErrorType.NETWORK]: 'Unable to connect to the service. Please check your internet connection and try again.',
      [ErrorType.API]: 'The service is temporarily unavailable. Please try again in a moment.',
      [ErrorType.VALIDATION]: 'Please check your input and try again.',
      [ErrorType.RATE_LIMIT]: 'Too many requests. Please wait a moment before trying again.',
      [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.'
    };

    const error: AppError = {
      type,
      message,
      userMessage: userMessages[type],
      originalError
    };

    // Only log detailed errors in development
    if (this.isDevelopment) {
      console.error('Application Error:', error);
    } else {
      // In production, only log error type and sanitized message
      console.error(`Error [${type}]: ${userMessages[type]}`);
    }

    return error;
  }

  static handleApiError(error: any): AppError {
    if (!error) {
      return this.createError(ErrorType.UNKNOWN, 'Unknown error occurred');
    }

    // Check for network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.createError(ErrorType.NETWORK, 'Network request failed', error);
    }

    // Check for rate limiting
    if (error.status === 429) {
      return this.createError(ErrorType.RATE_LIMIT, 'Rate limit exceeded', error);
    }

    // Check for API errors
    if (error.status >= 400 && error.status < 500) {
      return this.createError(ErrorType.API, `API error: ${error.status}`, error);
    }

    if (error.status >= 500) {
      return this.createError(ErrorType.API, 'Server error occurred', error);
    }

    return this.createError(ErrorType.UNKNOWN, 'Unexpected error', error);
  }
}
