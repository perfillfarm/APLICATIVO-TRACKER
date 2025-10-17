import { logger } from './logger';

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = true,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        logger.error(`[Retry] Failed after ${maxAttempts} attempts`, error);
        throw error;
      }

      const delay = backoff ? delayMs * attempt : delayMs;
      logger.warn(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms`, error);

      if (onRetry) {
        onRetry(attempt, error);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function isNetworkError(error: any): boolean {
  const networkErrorMessages = [
    'network request failed',
    'failed to fetch',
    'network error',
    'timeout',
    'connection refused',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
  ];

  const errorMessage = error?.message?.toLowerCase() || '';
  return networkErrorMessages.some((msg) => errorMessage.includes(msg));
}

export function isFirebaseNetworkError(error: any): boolean {
  const firebaseNetworkCodes = [
    'auth/network-request-failed',
    'unavailable',
    'deadline-exceeded',
  ];

  const errorCode = error?.code?.toLowerCase() || '';
  return firebaseNetworkCodes.some((code) => errorCode.includes(code));
}
