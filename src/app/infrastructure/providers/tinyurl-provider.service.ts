/**
 * TinyURL Provider Service
 * Implements URL shortening using TinyURL's public API.
 * Follows Single Responsibility Principle - only handles TinyURL API interaction.
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
 * TinyURL API provider implementation.
 * Uses the free TinyURL API (600 requests/day limit).
 */
@Injectable({
  providedIn: 'root'
})
export class TinyUrlProviderService implements UrlShortenerProvider {
  private readonly http = inject(HttpClient);
  private readonly API_URL = '/api/tinyurl';

  readonly name = 'TinyURL';

  /**
   * Shortens a URL using TinyURL API.
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

    // Make API request
    const apiUrl = `${this.API_URL}?url=${encodeURIComponent(url)}`;

    return this.http.get(apiUrl, { responseType: 'text' }).pipe(
      map((response: string): ShortenedUrlResult => {
        // TinyURL returns the short URL as plain text
        const shortUrl = response.trim();

        // Validate response
        if (!shortUrl || !this.isValidUrl(shortUrl)) {
          throw new UrlShortenerError(
            'Invalid response from TinyURL',
            UrlShortenerErrorType.API_ERROR
          );
        }

        return {
          success: true as const,
          shortUrl,
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
          'Network error: Unable to reach TinyURL service',
          UrlShortenerErrorType.NETWORK_ERROR,
          error
        );
      }

      // Rate limiting (429)
      if (error.status === 429) {
        return new UrlShortenerError(
          'Rate limit exceeded for TinyURL',
          UrlShortenerErrorType.RATE_LIMIT,
          error
        );
      }

      // API errors (4xx, 5xx)
      return new UrlShortenerError(
        `TinyURL API error: ${error.status} ${error.statusText}`,
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
