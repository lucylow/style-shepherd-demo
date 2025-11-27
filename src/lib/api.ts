/**
 * Centralized API Client
 * 
 * Uses environment variable VITE_API_BASE_URL for base URL configuration.
 * Falls back to /api for same-origin requests or localhost for development.
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from './api-config';

const baseURL = getApiBaseUrl();

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
  if (!error.response) {
    // Network errors are retryable
    return true;
  }

  const status = error.response.status;
  // Retry on 5xx errors and 429 (rate limit)
  return status >= 500 || status === 429;
}

/**
 * Get delay for retry (exponential backoff)
 */
function getRetryDelay(retryCount: number): number {
  return RETRY_DELAY * Math.pow(2, retryCount);
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add retry count if not present
    const retryConfig = config as RetryConfig;
    if (!retryConfig._retryCount) {
      retryConfig._retryCount = 0;
    }

    // Log request in dev mode
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
    }

    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;

    // If no config, we can't retry
    if (!config) {
      return Promise.reject(error);
    }

    // Don't retry if already retried or not retryable
    if (config._retry || !isRetryableError(error)) {
      return handleError(error);
    }

    // Increment retry count
    config._retryCount = (config._retryCount || 0) + 1;

    // Check if we should retry
    if (config._retryCount <= MAX_RETRIES) {
      config._retry = true;

      // Wait before retrying (exponential backoff)
      const delay = getRetryDelay(config._retryCount - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry the request
      return api(config);
    }

    // Max retries reached
    return handleError(error);
  }
);

/**
 * Handle and format errors for consistent error responses
 */
function handleError(error: AxiosError): Promise<never> {
  let errorMessage = 'An unexpected error occurred';
  let errorCode = 'UNKNOWN_ERROR';
  let statusCode = 500;

  if (error.response) {
    // Server responded with error status
    statusCode = error.response.status;
    const data = error.response.data as any;

    // Try to extract error message from response
    if (data?.error) {
      errorMessage = data.error.message || data.error.code || errorMessage;
      errorCode = data.error.code || errorCode;
    } else if (typeof data === 'string') {
      errorMessage = data;
    } else if (data?.message) {
      errorMessage = data.message;
    }

    // Map common status codes to user-friendly messages
    if (statusCode === 401) {
      errorMessage = 'Authentication required. Please log in.';
      errorCode = 'UNAUTHORIZED';
    } else if (statusCode === 403) {
      errorMessage = 'You do not have permission to perform this action.';
      errorCode = 'FORBIDDEN';
    } else if (statusCode === 404) {
      errorMessage = 'The requested resource was not found.';
      errorCode = 'NOT_FOUND';
    } else if (statusCode === 429) {
      errorMessage = 'Too many requests. Please try again later.';
      errorCode = 'RATE_LIMIT_EXCEEDED';
    } else if (statusCode >= 500) {
      errorMessage = 'Server error. Please try again later.';
      errorCode = 'SERVER_ERROR';
    }
  } else if (error.request) {
    // Request was made but no response received
    errorMessage = 'Network error. Please check your connection.';
    errorCode = 'NETWORK_ERROR';
    statusCode = 0;
  } else {
    // Error setting up request
    errorMessage = error.message || errorMessage;
  }

  // Log error
  if (import.meta.env.DEV) {
    console.error(
      `[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} failed:`,
      {
        status: statusCode,
        code: errorCode,
        message: errorMessage,
        response: error.response?.data,
      }
    );
  }

  // Create enhanced error object
  const enhancedError = new Error(errorMessage) as any;
  enhancedError.isAxiosError = true;
  enhancedError.code = errorCode;
  enhancedError.statusCode = statusCode;
  enhancedError.originalError = error;
  enhancedError.response = error.response;
  enhancedError.config = error.config;

  return Promise.reject(enhancedError);
}

export default api;

