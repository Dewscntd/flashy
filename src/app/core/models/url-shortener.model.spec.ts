/**
 * Unit tests for URL Shortener domain models
 */

import {
  UrlShortenerError,
  UrlShortenerErrorType,
  isSuccessResult,
  isErrorResult,
  ShortenedUrlResult
} from './url-shortener.model';

describe('UrlShortenerError', () => {
  it('should create error with message and type', () => {
    const error = new UrlShortenerError(
      'Test error',
      UrlShortenerErrorType.API_ERROR
    );

    expect(error.message).toBe('Test error');
    expect(error.type).toBe(UrlShortenerErrorType.API_ERROR);
    expect(error.name).toBe('UrlShortenerError');
  });

  it('should store original error', () => {
    const originalError = new Error('Original');
    const error = new UrlShortenerError(
      'Wrapped error',
      UrlShortenerErrorType.NETWORK_ERROR,
      originalError
    );

    expect(error.originalError).toBe(originalError);
  });

  it('should be instance of Error', () => {
    const error = new UrlShortenerError(
      'Test',
      UrlShortenerErrorType.UNKNOWN
    );

    expect(error instanceof Error).toBe(true);
    expect(error instanceof UrlShortenerError).toBe(true);
  });
});

describe('Type Guards', () => {
  describe('isSuccessResult', () => {
    it('should return true for success result', () => {
      const result: ShortenedUrlResult = {
        success: true,
        shortUrl: 'https://tinyurl.com/test',
        provider: 'TinyURL'
      };

      expect(isSuccessResult(result)).toBe(true);
    });

    it('should return false for error result', () => {
      const result: ShortenedUrlResult = {
        success: false,
        error: new UrlShortenerError('Error', UrlShortenerErrorType.API_ERROR)
      };

      expect(isSuccessResult(result)).toBe(false);
    });
  });

  describe('isErrorResult', () => {
    it('should return true for error result', () => {
      const result: ShortenedUrlResult = {
        success: false,
        error: new UrlShortenerError('Error', UrlShortenerErrorType.API_ERROR)
      };

      expect(isErrorResult(result)).toBe(true);
    });

    it('should return false for success result', () => {
      const result: ShortenedUrlResult = {
        success: true,
        shortUrl: 'https://tinyurl.com/test',
        provider: 'TinyURL'
      };

      expect(isErrorResult(result)).toBe(false);
    });
  });
});
