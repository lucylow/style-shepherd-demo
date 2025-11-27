/**
 * Error Handling Utilities
 * Provides consistent error handling across the frontend application
 */

import { AxiosError } from 'axios';
import { toast } from 'sonner';

export interface ErrorInfo {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

/**
 * Extract error information from various error types
 */
export function extractErrorInfo(error: unknown): ErrorInfo {
  // Axios errors
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;
    const response = axiosError.response;
    
    return {
      message: (response?.data as any)?.error?.message || 
              (response?.data as any)?.message || 
              axiosError.message || 
              'An error occurred',
      code: (response?.data as any)?.error?.code || 
            (error as any).code || 
            'UNKNOWN_ERROR',
      statusCode: response?.status || (error as any).statusCode,
      details: response?.data,
    };
  }

  // Standard Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as any).code,
      statusCode: (error as any).statusCode,
    };
  }

  // String errors
  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  // Unknown error type
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  const errorInfo = extractErrorInfo(error);

  // Map common error codes to user-friendly messages
  const messageMap: Record<string, string> = {
    NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
    UNAUTHORIZED: 'Please log in to continue.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again in a moment.',
    SERVER_ERROR: 'Server error. Please try again later.',
    TIMEOUT: 'Request timed out. Please try again.',
  };

  // Check if we have a mapped message
  if (errorInfo.code && messageMap[errorInfo.code]) {
    return messageMap[errorInfo.code];
  }

  // Check status codes
  if (errorInfo.statusCode) {
    if (errorInfo.statusCode === 401) {
      return 'Please log in to continue.';
    }
    if (errorInfo.statusCode === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (errorInfo.statusCode === 404) {
      return 'The requested resource was not found.';
    }
    if (errorInfo.statusCode === 429) {
      return 'Too many requests. Please try again in a moment.';
    }
    if (errorInfo.statusCode >= 500) {
      return 'Server error. Please try again later.';
    }
  }

  // Return the error message if available, otherwise default
  return errorInfo.message || 'An unexpected error occurred';
}

/**
 * Show error toast notification
 */
export function showErrorToast(error: unknown, customMessage?: string): void {
  const message = customMessage || getUserFriendlyMessage(error);
  toast.error(message, {
    duration: 5000,
  });
}

/**
 * Handle error with logging and user notification
 */
export function handleError(
  error: unknown,
  context?: string,
  showToast: boolean = true
): ErrorInfo {
  const errorInfo = extractErrorInfo(error);

  // Log error with context
  const logMessage = context
    ? `[${context}] Error: ${errorInfo.message}`
    : `Error: ${errorInfo.message}`;

  if (errorInfo.statusCode && errorInfo.statusCode >= 500) {
    console.error(logMessage, error);
  } else {
    console.warn(logMessage, error);
  }

  // Show toast if requested
  if (showToast) {
    showErrorToast(error);
  }

  return errorInfo;
}

/**
 * Safe async wrapper that handles errors
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  onError?: (error: ErrorInfo) => void,
  showToast: boolean = true
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const errorInfo = handleError(error, undefined, showToast);
    if (onError) {
      onError(errorInfo);
    }
    return null;
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const errorInfo = extractErrorInfo(error);

  // Network errors are retryable
  if (errorInfo.code === 'NETWORK_ERROR' || !errorInfo.statusCode) {
    return true;
  }

  // 5xx errors are retryable (except 501, 505)
  if (errorInfo.statusCode >= 500 && errorInfo.statusCode !== 501 && errorInfo.statusCode !== 505) {
    return true;
  }

  // 429 (rate limit) is retryable
  if (errorInfo.statusCode === 429) {
    return true;
  }

  // 408 (timeout) is retryable
  if (errorInfo.statusCode === 408) {
    return true;
  }

  return false;
}


