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
 * Custom error for when a user is not found
 */
export class UserNotFoundError extends Error {
  userId: string;

  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
    this.userId = userId;
  }
}

/**
 * Custom error for when a timeline entry is not found
 */
export class EntryNotFoundError extends Error {
  entryId: string;

  constructor(entryId: string) {
    super(`Timeline entry not found: ${entryId}`);
    this.name = 'EntryNotFoundError';
    this.entryId = entryId;
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
 * Custom error for validation failures when adding or updating entries
 */
export class EntryValidationError extends Error {
  entry: Partial<TimelineEntry>;
  fieldErrors: Record<string, string>;

  constructor(message: string, entry: Partial<TimelineEntry>, fieldErrors: Record<string, string>) {
    super(message);
    this.name = 'EntryValidationError';
    this.entry = entry;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Custom error for authentication issues
 */
export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Custom error for permission issues
 */
export class PermissionError extends Error {
  constructor(message = 'Insufficient permissions to perform this action') {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Custom error for network connectivity issues
 */
export class NetworkError extends Error {
  constructor(message = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}
