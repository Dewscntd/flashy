/**
 * URL Shortener Cache Service
 * Implements two-tier caching (in-memory + localStorage) for shortened URLs.
 * Follows Single Responsibility Principle - only handles caching logic.
 */

import { Injectable } from '@angular/core';
import { CachedUrl } from '../models/url-shortener.model';

/**
 * Two-tier cache service for shortened URLs.
 * Layer 1: In-memory Map for fast access
 * Layer 2: localStorage for persistence across sessions
 * TTL: 24 hours for cache entries
 */
@Injectable({
  providedIn: 'root'
})
export class UrlShortenerCacheService {
  private readonly STORAGE_KEY = 'url-shortener-cache';
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly cache = new Map<string, CachedUrl>();

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Retrieves a cached shortened URL if available and not expired.
   *
   * @param url - The original URL to look up
   * @returns The shortened URL if cached and valid, null otherwise
   */
  get(url: string): string | null {
    // Check memory cache first (Layer 1)
    let cached = this.cache.get(url);

    // If not in memory, check localStorage (Layer 2)
    if (!cached) {
      const storedCached = this.getFromStorage(url);
      if (storedCached) {
        cached = storedCached;
        // Promote to memory cache
        this.cache.set(url, cached);
      }
    }

    // Validate TTL
    if (cached && !this.isExpired(cached)) {
      return cached.shortUrl;
    }

    // Remove expired entry
    if (cached) {
      this.delete(url);
    }

    return null;
  }

  /**
   * Stores a shortened URL in the cache.
   *
   * @param url - The original URL
   * @param shortUrl - The shortened URL
   * @param provider - The provider that shortened the URL
   */
  set(url: string, shortUrl: string, provider: string): void {
    const cached: CachedUrl = {
      originalUrl: url,
      shortUrl,
      provider,
      timestamp: Date.now(),
      ttl: this.TTL_MS
    };

    // Store in both layers
    this.cache.set(url, cached);
    this.saveToStorage(url, cached);
  }

  /**
   * Removes a URL from the cache.
   *
   * @param url - The original URL to remove
   */
  delete(url: string): void {
    this.cache.delete(url);
    this.removeFromStorage(url);
  }

  /**
   * Clears all cached entries.
   */
  clear(): void {
    this.cache.clear();
    this.clearStorage();
  }

  /**
   * Gets all cached entries (useful for debugging).
   *
   * @returns Array of all cached entries
   */
  getAllEntries(): CachedUrl[] {
    return Array.from(this.cache.values());
  }

  /**
   * Gets cache statistics.
   *
   * @returns Object with cache statistics
   */
  getStats(): { size: number; validEntries: number; expiredEntries: number } {
    const entries = this.getAllEntries();
    return {
      size: entries.length,
      validEntries: entries.filter(e => !this.isExpired(e)).length,
      expiredEntries: entries.filter(e => this.isExpired(e)).length
    };
  }

  /**
   * Checks if a cached entry has expired.
   */
  private isExpired(cached: CachedUrl): boolean {
    const age = Date.now() - cached.timestamp;
    return age > cached.ttl;
  }

  /**
   * Loads cache from localStorage into memory.
   */
  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return;
      }

      const entries = JSON.parse(stored) as Record<string, CachedUrl>;

      // Load all entries, filtering expired ones
      Object.entries(entries).forEach(([url, cached]) => {
        if (!this.isExpired(cached)) {
          this.cache.set(url, cached);
        }
      });

      // Clean up expired entries from localStorage
      this.saveAllToStorage();
    } catch (error) {
      console.error('Error loading cache from storage:', error);
      this.clearStorage();
    }
  }

  /**
   * Retrieves a single entry from localStorage.
   */
  private getFromStorage(url: string): CachedUrl | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const entries = JSON.parse(stored) as Record<string, CachedUrl>;
      return entries[url] || null;
    } catch (error) {
      console.error('Error reading from cache storage:', error);
      return null;
    }
  }

  /**
   * Saves a single entry to localStorage.
   */
  private saveToStorage(url: string, cached: CachedUrl): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const entries = stored ? JSON.parse(stored) : {};
      entries[url] = cached;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving to cache storage:', error);
    }
  }

  /**
   * Saves all in-memory cache entries to localStorage.
   */
  private saveAllToStorage(): void {
    try {
      const entries: Record<string, CachedUrl> = {};
      this.cache.forEach((cached, url) => {
        if (!this.isExpired(cached)) {
          entries[url] = cached;
        }
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving cache to storage:', error);
    }
  }

  /**
   * Removes a single entry from localStorage.
   */
  private removeFromStorage(url: string): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return;
      }

      const entries = JSON.parse(stored) as Record<string, CachedUrl>;
      delete entries[url];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error removing from cache storage:', error);
    }
  }

  /**
   * Clears all entries from localStorage.
   */
  private clearStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing cache storage:', error);
    }
  }
}
