/**
 * Domain models for URL shortening functionality.
 * These models represent the ubiquitous language of the URL Shortener domain.
 * Following SOLID principles with clear value objects and error types.
 */

/**
 * Represents the result of a URL shortening operation.
 * This is a discriminated union for type-safe error handling.
 */
export type ShortenedUrlResult =
  | { success: true; shortUrl: string; provider: string }
  | { success: false; error: UrlShortenerError };

/**
 * Typed error class for URL shortening failures.
 * Provides clear categorization of error types for better handling.
 */
export class UrlShortenerError extends Error {
  constructor(
    message: string,
    public readonly type: UrlShortenerErrorType,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'UrlShortenerError';

    // Maintains proper stack trace in V8 environments
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, UrlShortenerError);
    }
  }
}

/**
 * Categorization of URL shortener error types.
 * Enables specific error handling strategies.
 */
export enum UrlShortenerErrorType {
  INVALID_URL = 'INVALID_URL',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Value object representing a cached URL entry.
 * Includes TTL metadata for cache expiration.
 */
export interface CachedUrl {
  readonly originalUrl: string;
  readonly shortUrl: string;
  readonly provider: string;
  readonly timestamp: number;
  readonly ttl: number; // Time to live in milliseconds
}

/**
 * Type guard to check if a result is a success.
 */
export function isSuccessResult(result: ShortenedUrlResult): result is { success: true; shortUrl: string; provider: string } {
  return result.success === true;
}

/**
 * Type guard to check if a result is an error.
 */
export function isErrorResult(result: ShortenedUrlResult): result is { success: false; error: UrlShortenerError } {
  return result.success === false;
}
