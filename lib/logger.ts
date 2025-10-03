/**
 * Structured Logging Utility
 * Provides consistent logging across the application
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  userType?: string;
  requestId?: string;
  ip?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      environment: process.env.NODE_ENV,
    });
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    const formatted = this.formatLog(entry);

    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.debug(formatted);
        break;
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, context, error);
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, context?: LogContext) {
    this.info(`API Request: ${method} ${path}`, {
      ...context,
      method,
      path,
    });
  }

  /**
   * Log API response
   */
  apiResponse(method: string, path: string, status: number, durationMs: number, context?: LogContext) {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    this.log(level, `API Response: ${method} ${path} ${status} (${durationMs}ms)`, {
      ...context,
      method,
      path,
      status,
      durationMs,
    });
  }

  /**
   * Log authentication event
   */
  auth(event: string, userId?: string, context?: LogContext) {
    this.info(`Auth: ${event}`, {
      ...context,
      userId,
      event,
    });
  }

  /**
   * Log security event
   */
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext) {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    this.log(level, `Security: ${event}`, {
      ...context,
      event,
      severity,
    });
  }

  /**
   * Log database query
   */
  database(operation: string, table: string, durationMs?: number, context?: LogContext) {
    if (this.isDevelopment) {
      this.debug(`DB: ${operation} ${table}${durationMs ? ` (${durationMs}ms)` : ''}`, {
        ...context,
        operation,
        table,
        durationMs,
      });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logError = (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);