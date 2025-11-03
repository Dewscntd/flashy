/**
 * Provider interface for URL shortening services.
 * Follows Interface Segregation Principle - single focused responsibility.
 * Implements Strategy Pattern for provider interchangeability.
 */

import { Observable } from 'rxjs';
import { ShortenedUrlResult } from '../models/url-shortener.model';

/**
 * Contract for URL shortening service providers.
 * Any implementation must adhere to this interface (Liskov Substitution Principle).
 */
export interface UrlShortenerProvider {
  /**
   * The name of the provider (e.g., 'TinyURL', 'is.gd').
   * Used for identification and logging.
   */
  readonly name: string;

  /**
   * Shortens a given URL using the provider's API.
   *
   * @param url - The full URL to shorten
   * @returns Observable that emits the shortened URL result
   *
   * Implementation notes:
   * - Must validate URL before making API call
   * - Must handle all errors and return proper error types
   * - Must not throw exceptions (use Observable error handling)
   * - Must be idempotent (same URL returns same short URL)
   */
  shorten(url: string): Observable<ShortenedUrlResult>;
}
