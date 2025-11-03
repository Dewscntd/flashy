/**
 * Unit tests for URL Shortener Service
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { UrlShortenerService } from './url-shortener.service';
import { TinyUrlProviderService } from '../../infrastructure/providers/tinyurl-provider.service';
import { IsGdProviderService } from '../../infrastructure/providers/isgd-provider.service';
import { RateLimiterService } from './rate-limiter.service';
import { UrlShortenerCacheService } from './url-shortener-cache.service';
import { UrlShortenerErrorType, UrlShortenerError } from '../models/url-shortener.model';

describe('UrlShortenerService', () => {
  let service: UrlShortenerService;
  let cacheService: jasmine.SpyObj<UrlShortenerCacheService>;
  let rateLimiter: jasmine.SpyObj<RateLimiterService>;
  let tinyUrlProvider: jasmine.SpyObj<TinyUrlProviderService>;
  let isGdProvider: jasmine.SpyObj<IsGdProviderService>;

  beforeEach(() => {
    const cacheSpy = jasmine.createSpyObj('UrlShortenerCacheService', [
      'get',
      'set',
      'clear',
      'getStats'
    ]);
    const rateLimiterSpy = jasmine.createSpyObj('RateLimiterService', [
      'canMakeRequest',
      'recordRequest',
      'getRemainingRequests',
      'getTimeUntilRefill',
      'reset'
    ]);
    const tinyUrlSpy = jasmine.createSpyObj('TinyUrlProviderService', ['shorten'], {
      name: 'TinyURL'
    });
    const isGdSpy = jasmine.createSpyObj('IsGdProviderService', ['shorten'], {
      name: 'is.gd'
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UrlShortenerService,
        { provide: UrlShortenerCacheService, useValue: cacheSpy },
        { provide: RateLimiterService, useValue: rateLimiterSpy },
        { provide: TinyUrlProviderService, useValue: tinyUrlSpy },
        { provide: IsGdProviderService, useValue: isGdSpy }
      ]
    });

    service = TestBed.inject(UrlShortenerService);
    cacheService = TestBed.inject(UrlShortenerCacheService) as jasmine.SpyObj<UrlShortenerCacheService>;
    rateLimiter = TestBed.inject(RateLimiterService) as jasmine.SpyObj<RateLimiterService>;
    tinyUrlProvider = TestBed.inject(TinyUrlProviderService) as jasmine.SpyObj<TinyUrlProviderService>;
    isGdProvider = TestBed.inject(IsGdProviderService) as jasmine.SpyObj<IsGdProviderService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('shortenUrl', () => {
    const testUrl = 'https://example.com/very/long/url';
    const shortUrl = 'https://tinyurl.com/abc123';

    it('should return cached result if available', (done) => {
      cacheService.get.and.returnValue(shortUrl);

      service.shortenUrl(testUrl).subscribe(result => {
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.shortUrl).toBe(shortUrl);
          expect(result.provider).toBe('Cache');
        }
        expect(rateLimiter.canMakeRequest).not.toHaveBeenCalled();
        expect(tinyUrlProvider.shorten).not.toHaveBeenCalled();
        done();
      });
    });

    it('should check rate limiter if not cached', (done) => {
      cacheService.get.and.returnValue(null);
      rateLimiter.canMakeRequest.and.returnValue(false);
      rateLimiter.getTimeUntilRefill.and.returnValue(30 * 60 * 1000); // 30 minutes
      rateLimiter.getRemainingRequests.and.returnValue(0);

      service.shortenUrl(testUrl).subscribe(result => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe(UrlShortenerErrorType.RATE_LIMIT);
        }
        expect(tinyUrlProvider.shorten).not.toHaveBeenCalled();
        done();
      });
    });

    it('should use primary provider if cache miss and rate limit ok', (done) => {
      cacheService.get.and.returnValue(null);
      rateLimiter.canMakeRequest.and.returnValue(true);
      tinyUrlProvider.shorten.and.returnValue(
        of({ success: true, shortUrl, provider: 'TinyURL' })
      );

      service.shortenUrl(testUrl).subscribe(result => {
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.shortUrl).toBe(shortUrl);
          expect(result.provider).toBe('TinyURL');
        }
        expect(rateLimiter.recordRequest).toHaveBeenCalled();
        expect(cacheService.set).toHaveBeenCalledWith(testUrl, shortUrl, 'TinyURL');
        done();
      });
    });

    it('should fallback to secondary provider if primary fails', (done) => {
      cacheService.get.and.returnValue(null);
      rateLimiter.canMakeRequest.and.returnValue(true);

      const error = new UrlShortenerError(
        'Primary failed',
        UrlShortenerErrorType.API_ERROR
      );
      tinyUrlProvider.shorten.and.returnValue(
        of({ success: false, error })
      );

      const fallbackShortUrl = 'https://is.gd/abc123';
      isGdProvider.shorten.and.returnValue(
        of({ success: true, shortUrl: fallbackShortUrl, provider: 'is.gd' })
      );

      service.shortenUrl(testUrl).subscribe(result => {
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.shortUrl).toBe(fallbackShortUrl);
          expect(result.provider).toBe('is.gd');
        }
        expect(tinyUrlProvider.shorten).toHaveBeenCalled();
        expect(isGdProvider.shorten).toHaveBeenCalled();
        expect(cacheService.set).toHaveBeenCalledWith(
          testUrl,
          fallbackShortUrl,
          'is.gd'
        );
        done();
      });
    });

    it('should return error if all providers fail', (done) => {
      cacheService.get.and.returnValue(null);
      rateLimiter.canMakeRequest.and.returnValue(true);

      const error = new UrlShortenerError(
        'Provider failed',
        UrlShortenerErrorType.API_ERROR
      );
      tinyUrlProvider.shorten.and.returnValue(
        of({ success: false, error })
      );
      isGdProvider.shorten.and.returnValue(
        of({ success: false, error })
      );

      service.shortenUrl(testUrl).subscribe(result => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe(UrlShortenerErrorType.API_ERROR);
          expect(result.error.message).toContain('All URL shortening providers failed');
        }
        expect(cacheService.set).not.toHaveBeenCalled();
        done();
      });
    });

    it('should record request for each provider attempt', (done) => {
      cacheService.get.and.returnValue(null);
      rateLimiter.canMakeRequest.and.returnValue(true);

      const error = new UrlShortenerError(
        'Failed',
        UrlShortenerErrorType.API_ERROR
      );
      tinyUrlProvider.shorten.and.returnValue(
        of({ success: false, error })
      );
      isGdProvider.shorten.and.returnValue(
        of({ success: false, error })
      );

      service.shortenUrl(testUrl).subscribe(() => {
        expect(rateLimiter.recordRequest).toHaveBeenCalledTimes(2);
        done();
      });
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return rate limit information', () => {
      rateLimiter.getRemainingRequests.and.returnValue(45);
      rateLimiter.getTimeUntilRefill.and.returnValue(30 * 60 * 1000);
      rateLimiter.canMakeRequest.and.returnValue(true);

      const info = service.getRateLimitInfo();

      expect(info.remaining).toBe(45);
      expect(info.timeUntilRefill).toBe(30 * 60 * 1000);
      expect(info.canMakeRequest).toBe(true);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const mockStats = {
        size: 10,
        validEntries: 8,
        expiredEntries: 2
      };
      cacheService.getStats.and.returnValue(mockStats);

      const stats = service.getCacheStats();

      expect(stats).toEqual(mockStats);
      expect(cacheService.getStats).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', () => {
      service.clearCache();
      expect(cacheService.clear).toHaveBeenCalled();
    });
  });

  describe('resetRateLimiter', () => {
    it('should reset the rate limiter', () => {
      service.resetRateLimiter();
      expect(rateLimiter.reset).toHaveBeenCalled();
    });
  });
});
