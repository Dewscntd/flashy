/**
 * Unit tests for URL Shortener Cache Service
 */

import { TestBed } from '@angular/core/testing';
import { UrlShortenerCacheService } from './url-shortener-cache.service';

describe('UrlShortenerCacheService', () => {
  let service: UrlShortenerCacheService;
  const STORAGE_KEY = 'url-shortener-cache';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UrlShortenerCacheService]
    });
    localStorage.clear();
    service = TestBed.inject(UrlShortenerCacheService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {
    it('should return null for non-existent URL', () => {
      expect(service.get('https://example.com')).toBeNull();
    });

    it('should return cached short URL', () => {
      const url = 'https://example.com';
      const shortUrl = 'https://tinyurl.com/abc';

      service.set(url, shortUrl, 'TinyURL');
      expect(service.get(url)).toBe(shortUrl);
    });

    it('should return null for expired entries', () => {
      const url = 'https://example.com';
      const shortUrl = 'https://tinyurl.com/abc';

      service.set(url, shortUrl, 'TinyURL');

      // Manipulate the timestamp to make it expired
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      stored[url].timestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      expect(service.get(url)).toBeNull();
    });

    it('should load from localStorage on cache miss', () => {
      const url = 'https://example.com';
      const shortUrl = 'https://tinyurl.com/abc';

      // Set directly in localStorage (simulating persistence)
      const cached = {
        originalUrl: url,
        shortUrl,
        provider: 'TinyURL',
        timestamp: Date.now(),
        ttl: 24 * 60 * 60 * 1000
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ [url]: cached }));

      expect(service.get(url)).toBe(shortUrl);
    });
  });

  describe('set', () => {
    it('should cache a shortened URL', () => {
      const url = 'https://example.com';
      const shortUrl = 'https://tinyurl.com/abc';

      service.set(url, shortUrl, 'TinyURL');
      expect(service.get(url)).toBe(shortUrl);
    });

    it('should persist to localStorage', () => {
      const url = 'https://example.com';
      const shortUrl = 'https://tinyurl.com/abc';

      service.set(url, shortUrl, 'TinyURL');

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();

      if (stored) {
        const entries = JSON.parse(stored);
        expect(entries[url]).toBeDefined();
        expect(entries[url].shortUrl).toBe(shortUrl);
        expect(entries[url].provider).toBe('TinyURL');
      }
    });

    it('should store with correct TTL', () => {
      const url = 'https://example.com';
      const shortUrl = 'https://tinyurl.com/abc';

      service.set(url, shortUrl, 'TinyURL');

      const entries = service.getAllEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].ttl).toBe(24 * 60 * 60 * 1000);
    });

    it('should overwrite existing cache entry', () => {
      const url = 'https://example.com';
      const shortUrl1 = 'https://tinyurl.com/abc';
      const shortUrl2 = 'https://tinyurl.com/xyz';

      service.set(url, shortUrl1, 'TinyURL');
      expect(service.get(url)).toBe(shortUrl1);

      service.set(url, shortUrl2, 'is.gd');
      expect(service.get(url)).toBe(shortUrl2);
    });
  });

  describe('delete', () => {
    it('should remove entry from cache', () => {
      const url = 'https://example.com';
      const shortUrl = 'https://tinyurl.com/abc';

      service.set(url, shortUrl, 'TinyURL');
      expect(service.get(url)).toBe(shortUrl);

      service.delete(url);
      expect(service.get(url)).toBeNull();
    });

    it('should remove entry from localStorage', () => {
      const url = 'https://example.com';
      const shortUrl = 'https://tinyurl.com/abc';

      service.set(url, shortUrl, 'TinyURL');
      service.delete(url);

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const entries = JSON.parse(stored);
        expect(entries[url]).toBeUndefined();
      }
    });

    it('should not error on non-existent URL', () => {
      expect(() => service.delete('https://nonexistent.com')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      service.set('https://example1.com', 'https://tinyurl.com/1', 'TinyURL');
      service.set('https://example2.com', 'https://tinyurl.com/2', 'TinyURL');
      service.set('https://example3.com', 'https://tinyurl.com/3', 'TinyURL');

      expect(service.getAllEntries().length).toBe(3);

      service.clear();
      expect(service.getAllEntries().length).toBe(0);
    });

    it('should clear localStorage', () => {
      service.set('https://example.com', 'https://tinyurl.com/abc', 'TinyURL');
      service.clear();

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeNull();
    });
  });

  describe('getAllEntries', () => {
    it('should return empty array initially', () => {
      expect(service.getAllEntries()).toEqual([]);
    });

    it('should return all cached entries', () => {
      service.set('https://example1.com', 'https://tinyurl.com/1', 'TinyURL');
      service.set('https://example2.com', 'https://tinyurl.com/2', 'is.gd');

      const entries = service.getAllEntries();
      expect(entries.length).toBe(2);
      expect(entries[0].shortUrl).toBeTruthy();
      expect(entries[1].shortUrl).toBeTruthy();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      service.set('https://example1.com', 'https://tinyurl.com/1', 'TinyURL');
      service.set('https://example2.com', 'https://tinyurl.com/2', 'TinyURL');

      const stats = service.getStats();
      expect(stats.size).toBe(2);
      expect(stats.validEntries).toBe(2);
      expect(stats.expiredEntries).toBe(0);
    });

    it('should count expired entries correctly', () => {
      const url1 = 'https://example1.com';
      const url2 = 'https://example2.com';

      service.set(url1, 'https://tinyurl.com/1', 'TinyURL');
      service.set(url2, 'https://tinyurl.com/2', 'TinyURL');

      // Expire one entry
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      stored[url1].timestamp = Date.now() - (25 * 60 * 60 * 1000);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      // Force reload from storage
      const newService = new UrlShortenerCacheService();
      const stats = newService.getStats();

      expect(stats.size).toBe(1);
      expect(stats.validEntries).toBe(1);
    });
  });

  describe('localStorage persistence', () => {
    it('should load cache from localStorage on creation', () => {
      const url = 'https://example.com';
      const cached = {
        originalUrl: url,
        shortUrl: 'https://tinyurl.com/abc',
        provider: 'TinyURL',
        timestamp: Date.now(),
        ttl: 24 * 60 * 60 * 1000
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ [url]: cached }));

      const newService = new UrlShortenerCacheService();
      expect(newService.get(url)).toBe(cached.shortUrl);
    });

    it('should filter expired entries on load', () => {
      const url1 = 'https://example1.com';
      const url2 = 'https://example2.com';

      const cached1 = {
        originalUrl: url1,
        shortUrl: 'https://tinyurl.com/1',
        provider: 'TinyURL',
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // Expired
        ttl: 24 * 60 * 60 * 1000
      };

      const cached2 = {
        originalUrl: url2,
        shortUrl: 'https://tinyurl.com/2',
        provider: 'TinyURL',
        timestamp: Date.now(), // Valid
        ttl: 24 * 60 * 60 * 1000
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ [url1]: cached1, [url2]: cached2 })
      );

      const newService = new UrlShortenerCacheService();
      expect(newService.get(url1)).toBeNull();
      expect(newService.get(url2)).toBe(cached2.shortUrl);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');
      expect(() => new UrlShortenerCacheService()).not.toThrow();
    });

    it('should handle missing localStorage data', () => {
      const newService = new UrlShortenerCacheService();
      expect(newService.getAllEntries()).toEqual([]);
    });
  });
});
