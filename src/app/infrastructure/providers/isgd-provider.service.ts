/**
 * is.gd Provider Service
 * Implements URL shortening using is.gd's public API.
 * Follows Single Responsibility Principle - only handles is.gd API interaction.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UrlShortenerProvider } from '../../core/interfaces/url-shortener-provider.interface';
import {
  ShortenedUrlResult,
  UrlShortenerError,
  UrlShortenerErrorType
} from '../../core/models/url-shortener.model';

/**
 * Response structure from is.gd API
 */
interface IsGdResponse {
  shorturl?: string;
  errormessage?: string;
}

/**
 * is.gd API provider implementation.
 * Uses the free is.gd API as a fallback provider.
 */
@Injectable({
  providedIn: 'root'
})
export class IsGdProviderService implements UrlShortenerProvider {
  private readonly http = inject(HttpClient);
  private readonly API_URL = '/api/isgd';

  readonly name = 'is.gd';

  /**
   * Shortens a URL using is.gd API.
   *
   * @param url - The URL to shorten
   * @returns Observable of ShortenedUrlResult
   */
  shorten(url: string): Observable<ShortenedUrlResult> {
    // Validate URL format
    if (!this.isValidUrl(url)) {
      return of({
        success: false,
        error: new UrlShortenerError(
          'Invalid URL format',
          UrlShortenerErrorType.INVALID_URL
        )
      });
    }

    // Make API request with JSON format
    const apiUrl = `${this.API_URL}?format=json&url=${encodeURIComponent(url)}`;

    return this.http.get<IsGdResponse>(apiUrl).pipe(
      map((response: IsGdResponse): ShortenedUrlResult => {
        // Check for error in response
        if (response.errormessage) {
          throw new UrlShortenerError(
            `is.gd error: ${response.errormessage}`,
            UrlShortenerErrorType.API_ERROR
          );
        }

        // Validate short URL
        if (!response.shorturl || !this.isValidUrl(response.shorturl)) {
          throw new UrlShortenerError(
            'Invalid response from is.gd',
            UrlShortenerErrorType.API_ERROR
          );
        }

        return {
          success: true as const,
          shortUrl: response.shorturl,
          provider: this.name
        };
      }),
      catchError((error: unknown): Observable<ShortenedUrlResult> => {
        return of({
          success: false as const,
          error: this.handleError(error)
        });
      })
    );
  }

  /**
   * Validates URL format using browser's URL constructor.
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Converts HTTP errors to domain-specific errors.
   */
  private handleError(error: unknown): UrlShortenerError {
    if (error instanceof UrlShortenerError) {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      // Network errors
      if (error.status === 0) {
        return new UrlShortenerError(
          'Network error: Unable to reach is.gd service',
          UrlShortenerErrorType.NETWORK_ERROR,
          error
        );
      }

      // Rate limiting (429)
      if (error.status === 429) {
        return new UrlShortenerError(
          'Rate limit exceeded for is.gd',
          UrlShortenerErrorType.RATE_LIMIT,
          error
        );
      }

      // API errors (4xx, 5xx)
      return new UrlShortenerError(
        `is.gd API error: ${error.status} ${error.statusText}`,
        UrlShortenerErrorType.API_ERROR,
        error
      );
    }

    // Unknown errors
    return new UrlShortenerError(
      'Unknown error occurred while shortening URL',
      UrlShortenerErrorType.UNKNOWN,
      error
    );
  }
}
