/**
 * Rate Limiter Service
 * Implements token bucket algorithm for API request rate limiting.
 * Follows Single Responsibility Principle - only handles rate limiting logic.
 */

import { Injectable } from '@angular/core';

/**
 * Configuration for rate limiting
 */
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Token bucket state persisted to localStorage
 */
interface TokenBucketState {
  tokens: number;
  lastRefill: number;
}

/**
 * Rate limiter using token bucket algorithm.
 * Limits requests to 50 per hour with localStorage persistence.
 */
@Injectable({
  providedIn: 'root'
})
export class RateLimiterService {
  private readonly STORAGE_KEY = 'url-shortener-rate-limit';
  private readonly config: RateLimitConfig = {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000 // 1 hour
  };

  /**
   * Checks if a request can be made within rate limits.
   *
   * @returns true if request is allowed, false if rate limited
   */
  canMakeRequest(): boolean {
    const state = this.getState();
    this.refillTokens(state);

    return state.tokens > 0;
  }

  /**
   * Records a request and decrements available tokens.
   * Should only be called after canMakeRequest() returns true.
   */
  recordRequest(): void {
    const state = this.getState();
    this.refillTokens(state);

    if (state.tokens > 0) {
      state.tokens--;
      this.saveState(state);
    }
  }

  /**
   * Gets the number of remaining requests available.
   *
   * @returns Number of requests remaining
   */
  getRemainingRequests(): number {
    const state = this.getState();
    this.refillTokens(state);
    return Math.max(0, state.tokens);
  }

  /**
   * Gets the time in milliseconds until the next token refill.
   *
   * @returns Milliseconds until next refill
   */
  getTimeUntilRefill(): number {
    const state = this.getState();
    const elapsed = Date.now() - state.lastRefill;
    const remaining = this.config.windowMs - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Resets the rate limiter (useful for testing).
   */
  reset(): void {
    const state: TokenBucketState = {
      tokens: this.config.maxRequests,
      lastRefill: Date.now()
    };
    this.saveState(state);
  }

  /**
   * Refills tokens based on elapsed time.
   * Implements token bucket algorithm logic.
   */
  private refillTokens(state: TokenBucketState): void {
    const now = Date.now();
    const elapsed = now - state.lastRefill;

    // If window has passed, refill completely
    if (elapsed >= this.config.windowMs) {
      state.tokens = this.config.maxRequests;
      state.lastRefill = now;
      this.saveState(state);
    }
    // Tokens refill gradually over the window
    else {
      const refillAmount = Math.floor(
        (elapsed / this.config.windowMs) * this.config.maxRequests
      );
      if (refillAmount > 0) {
        state.tokens = Math.min(
          this.config.maxRequests,
          state.tokens + refillAmount
        );
        state.lastRefill = now;
        this.saveState(state);
      }
    }
  }

  /**
   * Retrieves rate limit state from localStorage.
   * Initializes if not present.
   */
  private getState(): TokenBucketState {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored) as TokenBucketState;
        // Validate state structure
        if (
          typeof state.tokens === 'number' &&
          typeof state.lastRefill === 'number'
        ) {
          return state;
        }
      }
    } catch (error) {
      console.error('Error reading rate limit state:', error);
    }

    // Return default state
    return {
      tokens: this.config.maxRequests,
      lastRefill: Date.now()
    };
  }

  /**
   * Persists rate limit state to localStorage.
   */
  private saveState(state: TokenBucketState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving rate limit state:', error);
    }
  }
}
