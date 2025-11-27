/**
 * React Hook for Error Handling
 * Provides easy error handling in React components
 */

import { useCallback } from 'react';
import { handleError, showErrorToast, getUserFriendlyMessage, extractErrorInfo, safeAsync } from '@/utils/errorHandler';

/**
 * Hook for handling errors in React components
 * 
 * @example
 * ```tsx
 * const { handleError, showError } = useErrorHandler();
 * 
 * const fetchData = async () => {
 *   try {
 *     await api.get('/data');
 *   } catch (error) {
 *     handleError(error, 'fetchData');
 *   }
 * };
 * ```
 */
export function useErrorHandler(context?: string) {
  const handle = useCallback(
    (error: unknown, showToast: boolean = true) => {
      return handleError(error, context, showToast);
    },
    [context]
  );

  const showError = useCallback((error: unknown, customMessage?: string) => {
    showErrorToast(error, customMessage);
  }, []);

  const getMessage = useCallback((error: unknown) => {
    return getUserFriendlyMessage(error);
  }, []);

  const getErrorInfo = useCallback((error: unknown) => {
    return extractErrorInfo(error);
  }, []);

  const safe = useCallback(
    <T,>(
      fn: () => Promise<T>,
      onError?: (errorInfo: ReturnType<typeof extractErrorInfo>) => void,
      showToast: boolean = true
    ) => {
      return safeAsync(fn, onError, showToast);
    },
    []
  );

  return {
    handleError: handle,
    showError,
    getMessage,
    getErrorInfo,
    safeAsync: safe,
  };
}


