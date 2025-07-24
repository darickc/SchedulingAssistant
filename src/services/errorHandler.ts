// Comprehensive error handling service

export enum ErrorType {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  CALENDAR = 'CALENDAR',
  SMS = 'SMS',
  FILE_SYSTEM = 'FILE_SYSTEM',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  details?: any;
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
}

export interface ErrorHandlerOptions {
  showToUser?: boolean;
  logError?: boolean;
  retryable?: boolean;
  maxRetries?: number;
}

class ErrorHandlerService {
  private errorLog: AppError[] = [];
  private readonly maxLogSize = 100;

  // Generate unique error ID
  private generateErrorId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Create structured error
  createError(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    userMessage: string,
    details?: any,
    context?: Record<string, any>
  ): AppError {
    const error: AppError = {
      id: this.generateErrorId(),
      type,
      severity,
      message,
      userMessage,
      details,
      context,
      timestamp: new Date(),
      stack: new Error().stack,
    };

    return error;
  }

  // Log error to internal storage
  private logError(error: AppError): void {
    this.errorLog.unshift(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log to console in development
    if (__DEV__) {
      console.error('AppError:', {
        id: error.id,
        type: error.type,
        severity: error.severity,
        message: error.message,
        details: error.details,
        context: error.context,
        stack: error.stack,
      });
    }
  }

  // Handle different types of errors
  handleDatabaseError(
    error: any,
    operation: string,
    context?: Record<string, any>
  ): AppError {
    const appError = this.createError(
      ErrorType.DATABASE,
      ErrorSeverity.HIGH,
      `Database error during ${operation}: ${error.message || error}`,
      'There was a problem accessing your data. Please try again.',
      error,
      { operation, ...context }
    );

    this.logError(appError);
    return appError;
  }

  handleNetworkError(
    error: any,
    endpoint?: string,
    context?: Record<string, any>
  ): AppError {
    const appError = this.createError(
      ErrorType.NETWORK,
      ErrorSeverity.MEDIUM,
      `Network error${endpoint ? ` for ${endpoint}` : ''}: ${error.message || error}`,
      'Please check your internet connection and try again.',
      error,
      { endpoint, ...context }
    );

    this.logError(appError);
    return appError;
  }

  handleValidationError(
    errors: string[],
    context?: Record<string, any>
  ): AppError {
    const appError = this.createError(
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      `Validation failed: ${errors.join(', ')}`,
      errors.length === 1 ? errors[0] : 'Please check your input and try again.',
      { validationErrors: errors },
      context
    );

    this.logError(appError);
    return appError;
  }

  handleAuthenticationError(
    error: any,
    context?: Record<string, any>
  ): AppError {
    const appError = this.createError(
      ErrorType.AUTHENTICATION,
      ErrorSeverity.HIGH,
      `Authentication error: ${error.message || error}`,
      'Please sign in again to continue.',
      error,
      context
    );

    this.logError(appError);
    return appError;
  }

  handleCalendarError(
    error: any,
    operation: string,
    context?: Record<string, any>
  ): AppError {
    const appError = this.createError(
      ErrorType.CALENDAR,
      ErrorSeverity.MEDIUM,
      `Calendar error during ${operation}: ${error.message || error}`,
      'There was a problem with your calendar. Please check your Google Calendar permissions.',
      error,
      { operation, ...context }
    );

    this.logError(appError);
    return appError;
  }

  handleSMSError(
    error: any,
    phoneNumber?: string,
    context?: Record<string, any>
  ): AppError {
    const appError = this.createError(
      ErrorType.SMS,
      ErrorSeverity.MEDIUM,
      `SMS error${phoneNumber ? ` for ${phoneNumber}` : ''}: ${error.message || error}`,
      'Unable to send SMS message. Please check the phone number and try again.',
      error,
      { phoneNumber, ...context }
    );

    this.logError(appError);
    return appError;
  }

  handleFileSystemError(
    error: any,
    operation: string,
    filePath?: string,
    context?: Record<string, any>
  ): AppError {
    const appError = this.createError(
      ErrorType.FILE_SYSTEM,
      ErrorSeverity.MEDIUM,
      `File system error during ${operation}${filePath ? ` for ${filePath}` : ''}: ${error.message || error}`,
      'There was a problem accessing the file. Please try again.',
      error,
      { operation, filePath, ...context }
    );

    this.logError(appError);
    return appError;
  }

  handleUnknownError(
    error: any,
    context?: Record<string, any>
  ): AppError {
    const appError = this.createError(
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      `Unknown error: ${error.message || error}`,
      'An unexpected error occurred. Please try again.',
      error,
      context
    );

    this.logError(appError);
    return appError;
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: AppError[];
  } {
    const byType = {} as Record<ErrorType, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;

    // Initialize counters
    Object.values(ErrorType).forEach(type => byType[type] = 0);
    Object.values(ErrorSeverity).forEach(severity => bySeverity[severity] = 0);

    // Count errors
    this.errorLog.forEach(error => {
      byType[error.type]++;
      bySeverity[error.severity]++;
    });

    return {
      total: this.errorLog.length,
      byType,
      bySeverity,
      recent: this.errorLog.slice(0, 10), // Last 10 errors
    };
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
  }

  // Get errors by type
  getErrorsByType(type: ErrorType): AppError[] {
    return this.errorLog.filter(error => error.type === type);
  }

  // Get errors by severity
  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errorLog.filter(error => error.severity === severity);
  }

  // Check if error is retryable
  isRetryable(error: AppError): boolean {
    const retryableTypes = [
      ErrorType.NETWORK,
      ErrorType.CALENDAR,
      ErrorType.SMS,
    ];

    return retryableTypes.includes(error.type);
  }

  // Format error for user display
  formatUserError(error: AppError): string {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return `Critical Error: ${error.userMessage}`;
      case ErrorSeverity.HIGH:
        return `Error: ${error.userMessage}`;
      case ErrorSeverity.MEDIUM:
        return error.userMessage;
      case ErrorSeverity.LOW:
        return error.userMessage;
      default:
        return error.userMessage;
    }
  }

  // Export error log for debugging
  exportErrorLog(): string {
    return JSON.stringify(this.errorLog, null, 2);
  }
}

// Create singleton instance
export const ErrorHandler = new ErrorHandlerService();

// Utility functions for common error scenarios
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorType: ErrorType,
  operationName: string,
  context?: Record<string, any>
): Promise<{ data?: T; error?: AppError }> => {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    let appError: AppError;

    switch (errorType) {
      case ErrorType.DATABASE:
        appError = ErrorHandler.handleDatabaseError(error, operationName, context);
        break;
      case ErrorType.NETWORK:
        appError = ErrorHandler.handleNetworkError(error, operationName, context);
        break;
      case ErrorType.CALENDAR:
        appError = ErrorHandler.handleCalendarError(error, operationName, context);
        break;
      case ErrorType.SMS:
        appError = ErrorHandler.handleSMSError(error, context?.phoneNumber, context);
        break;
      case ErrorType.FILE_SYSTEM:
        appError = ErrorHandler.handleFileSystemError(error, operationName, context?.filePath, context);
        break;
      default:
        appError = ErrorHandler.handleUnknownError(error, context);
    }

    return { error: appError };
  }
};

// Retry mechanism
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError;
};