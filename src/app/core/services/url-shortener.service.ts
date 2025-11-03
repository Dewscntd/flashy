/**
 * URL Shortener Service
 * Main orchestration service for URL shortening functionality.
 * Follows Single Responsibility Principle - coordinates providers, cache, and rate limiting.
 * Implements Open/Closed Principle - extensible via provider interface.
 */

import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import {
  ShortenedUrlResult,
  UrlShortenerError,
  UrlShortenerErrorType
} from '../models/url-shortener.model';
import { UrlShortenerProvider } from '../interfaces/url-shortener-provider.interface';
import { TinyUrlProviderService } from '../../infrastructure/providers/tinyurl-provider.service';
import { IsGdProviderService } from '../../infrastructure/providers/isgd-provider.service';
import { RateLimiterService } from './rate-limiter.service';
import { UrlShortenerCacheService } from './url-shortener-cache.service';

/**
 * Main URL shortener service.
 * Coordinates multiple providers with caching and rate limiting.
 */
@Injectable({
  providedIn: 'root'
})
export class UrlShortenerService {
  // Inject dependencies
  private readonly cache = inject(UrlShortenerCacheService);
  private readonly rateLimiter = inject(RateLimiterService);
  private readonly tinyUrlProvider = inject(TinyUrlProviderService);
  private readonly isGdProvider = inject(IsGdProviderService);

  // Provider fallback chain
  private readonly providers: UrlShortenerProvider[] = [
    this.tinyUrlProvider,
    this.isGdProvider
  ];

  /**
   * Shortens a URL using the provider chain with caching and rate limiting.
   *
   * Process flow:
   * 1. Check cache for existing shortened URL
   * 2. Check rate limiter
   * 3. Try primary provider (TinyURL)
   * 4. Fall back to secondary provider (is.gd) if primary fails
   * 5. Cache successful result
   *
   * @param url - The URL to shorten
   * @returns Observable of ShortenedUrlResult
   */
  shortenUrl(url: string): Observable<ShortenedUrlResult> {
    // Step 1: Check cache first
    const cached = this.cache.get(url);
    if (cached) {
      return of({
        success: true,
        shortUrl: cached,
        provider: 'Cache'
      });
    }

    // Step 2: Check rate limiting
    if (!this.rateLimiter.canMakeRequest()) {
      const timeUntil = this.rateLimiter.getTimeUntilRefill();
      const minutesUntil = Math.ceil(timeUntil / 60000);

      return of({
        success: false,
        error: new UrlShortenerError(
          `Rate limit exceeded. Please try again in ${minutesUntil} minute(s). ` +
          `You have ${this.rateLimiter.getRemainingRequests()} requests remaining.`,
          UrlShortenerErrorType.RATE_LIMIT
        )
      });
    }

    // Step 3 & 4: Try providers with fallback
    return this.tryProvidersWithFallback(url, 0);
  }

  /**
   * Attempts to shorten URL using provider chain with recursive fallback.
   *
   * @param url - The URL to shorten
   * @param providerIndex - Current provider index in the chain
   * @returns Observable of ShortenedUrlResult
   */
  private tryProvidersWithFallback(
    url: string,
    providerIndex: number
  ): Observable<ShortenedUrlResult> {
    // No more providers to try
    if (providerIndex >= this.providers.length) {
      return of({
        success: false,
        error: new UrlShortenerError(
          'All URL shortening providers failed. Please try again later.',
          UrlShortenerErrorType.API_ERROR
        )
      });
    }

    const provider = this.providers[providerIndex];

    // Record the request attempt
    this.rateLimiter.recordRequest();

    return provider.shorten(url).pipe(
      // Use switchMap to check result and handle fallback for failed results
      switchMap((result) => {
        // If successful, cache and return
        if (result.success) {
          this.cache.set(url, result.shortUrl, result.provider);
          return of(result);
        }

        // If failed, log and try next provider
        console.warn(
          `Provider ${provider.name} failed, trying fallback...`,
          result.error
        );
        return this.tryProvidersWithFallback(url, providerIndex + 1);
      }),
      // Also handle thrown errors (not just failed results)
      catchError((error) => {
        console.warn(
          `Provider ${provider.name} threw error, trying fallback...`,
          error
        );

        // Try next provider in chain for thrown errors
        return this.tryProvidersWithFallback(url, providerIndex + 1);
      })
    );
  }

  /**
   * Gets rate limiting information.
   *
   * @returns Object with rate limit details
   */
  getRateLimitInfo(): {
    remaining: number;
    timeUntilRefill: number;
    canMakeRequest: boolean;
  } {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      timeUntilRefill: this.rateLimiter.getTimeUntilRefill(),
      canMakeRequest: this.rateLimiter.canMakeRequest()
    };
  }

  /**
   * Gets cache statistics.
   *
   * @returns Object with cache statistics
   */
  getCacheStats(): { size: number; validEntries: number; expiredEntries: number } {
    return this.cache.getStats();
  }

  /**
   * Clears the URL cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Resets the rate limiter (useful for testing).
   */
  resetRateLimiter(): void {
    this.rateLimiter.reset();
  }
}
