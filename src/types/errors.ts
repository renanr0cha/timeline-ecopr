/**
 * Custom error classes for the Timeline-ecoPR application
 *
 * These error classes provide more specific error handling
 * capabilities and improve error messaging throughout the app.
 */

/**
 * Base error class for all application errors
 */
export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApplicationError';
    Object.setPrototypeOf(this, ApplicationError.prototype);
  }
}

/**
 * Error thrown when a database operation fails
 */
export class DatabaseError extends ApplicationError {
  code?: string;
  details?: string;
  hint?: string;

  constructor(message: string, options?: { code?: string; details?: string; hint?: string }) {
    super(message);
    this.name = 'DatabaseError';
    this.code = options?.code;
    this.details = options?.details;
    this.hint = options?.hint;
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Error thrown when a device is not found
 */
export class DeviceNotFoundError extends ApplicationError {
  deviceId: string;

  constructor(deviceId: string) {
    super(`Device not found: ${deviceId}`);
    this.name = 'DeviceNotFoundError';
    this.deviceId = deviceId;
    Object.setPrototypeOf(this, DeviceNotFoundError.prototype);
  }
}

/**
 * Error thrown when a timeline entry is not found
 */
export class EntryNotFoundError extends ApplicationError {
  entryId: string;

  constructor(entryId: string) {
    super(`Timeline entry not found: ${entryId}`);
    this.name = 'EntryNotFoundError';
    this.entryId = entryId;
    Object.setPrototypeOf(this, EntryNotFoundError.prototype);
  }
}

/**
 * Error thrown when required parameters are missing
 */
export class ValidationError extends ApplicationError {
  field: string;

  constructor(field: string) {
    super(`Required field is missing: ${field}`);
    this.name = 'ValidationError';
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when network connection issues occur
 */
export class NetworkError extends ApplicationError {
  originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
