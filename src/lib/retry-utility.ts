/**
 * Shared retry utility for API calls
 * Provides consistent retry logic across all services
 */

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

/**
 * Default retry predicate - don't retry on client errors (4xx)
 */
const defaultShouldRetry = (error: any): boolean => {
  const status = error?.status || error?.response?.status || error?.statusCode;
  // Don't retry on client errors (4xx)
  if (status && status >= 400 && status < 500) {
    return false;
  }
  return true;
};

/**
 * Retry wrapper for async operations with exponential backoff
 * 
 * @param operation - The async operation to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves when the operation succeeds or all retries are exhausted
 * 
 * @example
 * ```ts
 * const result = await retryWithBackoff(
 *   () => api.get('/data'),
 *   { maxRetries: 3, retryDelay: 1000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't wait after the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff: delay * 2^attempt
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

