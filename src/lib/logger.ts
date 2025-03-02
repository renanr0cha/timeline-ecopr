/**
 * Logger utility for standardized logging across the application
 * Provides different log levels and structured logging capabilities
 */

// Global declaration for __DEV__ from React Native
declare const __DEV__: boolean;

interface LogContext {
  [key: string]: any;
}

/**
 * Formats a log message with context data
 *
 * @param message - Log message
 * @param context - Additional context data
 * @returns Formatted message string
 */
const formatMessage = (message: string, context?: LogContext): string => {
  if (!context || Object.keys(context).length === 0) {
    return message;
  }

  try {
    return `${message} ${JSON.stringify(context)}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return `${message} [Error serializing context]`;
  }
};

/**
 * Logger service for consistent application logging
 */
export const logger = {
  /**
   * Log a debug message
   *
   * @param message - Debug message
   * @param context - Optional context data
   */
  debug(message: string, context?: LogContext): void {
    if (__DEV__) {
      console.debug(`[DEBUG] ${formatMessage(message, context)}`);
    }
  },

  /**
   * Log an info message
   *
   * @param message - Info message
   * @param context - Optional context data
   */
  info(message: string, context?: LogContext): void {
    console.info(`[INFO] ${formatMessage(message, context)}`);
  },

  /**
   * Log a warning message
   *
   * @param message - Warning message
   * @param context - Optional context data
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${formatMessage(message, context)}`);
  },

  /**
   * Log an error message
   *
   * @param message - Error message
   * @param context - Optional context data
   */
  error(message: string, context?: LogContext): void {
    console.error(`[ERROR] ${formatMessage(message, context)}`);
  },

  /**
   * Create a child logger with predefined context
   *
   * @param baseContext - Base context to include in all logs
   * @returns A new logger instance with the base context
   */
  createChildLogger(baseContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        this.debug(message, { ...baseContext, ...context }),

      info: (message: string, context?: LogContext) =>
        this.info(message, { ...baseContext, ...context }),

      warn: (message: string, context?: LogContext) =>
        this.warn(message, { ...baseContext, ...context }),

      error: (message: string, context?: LogContext) =>
        this.error(message, { ...baseContext, ...context }),
    };
  },
};
