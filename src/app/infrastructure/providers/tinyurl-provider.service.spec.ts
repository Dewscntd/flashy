/**
 * Unit tests for TinyURL Provider Service
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TinyUrlProviderService } from './tinyurl-provider.service';
import { UrlShortenerErrorType } from '../../core/models/url-shortener.model';

describe('TinyUrlProviderService', () => {
  let service: TinyUrlProviderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TinyUrlProviderService]
    });

    service = TestBed.inject(TinyUrlProviderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.name).toBe('TinyURL');
  });

  describe('shorten', () => {
    it('should successfully shorten a valid URL', (done) => {
      const testUrl = 'https://example.com/very/long/url';
      const shortUrl = 'https://tinyurl.com/abc123';

      service.shorten(testUrl).subscribe(result => {
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.shortUrl).toBe(shortUrl);
          expect(result.provider).toBe('TinyURL');
        }
        done();
      });

      const req = httpMock.expectOne(
        `/api/tinyurl?url=${encodeURIComponent(testUrl)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(shortUrl);
    });

    it('should return error for invalid URL format', (done) => {
      const invalidUrl = 'not-a-valid-url';

      service.shorten(invalidUrl).subscribe(result => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe(UrlShortenerErrorType.INVALID_URL);
          expect(result.error.message).toContain('Invalid URL format');
        }
        done();
      });

      httpMock.expectNone(`/api/tinyurl?url=${encodeURIComponent(invalidUrl)}`);
    });

    it('should handle network errors', (done) => {
      const testUrl = 'https://example.com';

      service.shorten(testUrl).subscribe(result => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe(UrlShortenerErrorType.NETWORK_ERROR);
          expect(result.error.message).toContain('Network error');
        }
        done();
      });

      const req = httpMock.expectOne(
        `/api/tinyurl?url=${encodeURIComponent(testUrl)}`
      );
      req.error(new ProgressEvent('error'), { status: 0 });
    });

    it('should handle rate limit errors', (done) => {
      const testUrl = 'https://example.com';

      service.shorten(testUrl).subscribe(result => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe(UrlShortenerErrorType.RATE_LIMIT);
          expect(result.error.message).toContain('Rate limit exceeded');
        }
        done();
      });

      const req = httpMock.expectOne(
        `/api/tinyurl?url=${encodeURIComponent(testUrl)}`
      );
      req.error(new ProgressEvent('error'), { status: 429 });
    });

    it('should handle API errors', (done) => {
      const testUrl = 'https://example.com';

      service.shorten(testUrl).subscribe(result => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe(UrlShortenerErrorType.API_ERROR);
          expect(result.error.message).toContain('API error');
        }
        done();
      });

      const req = httpMock.expectOne(
        `/api/tinyurl?url=${encodeURIComponent(testUrl)}`
      );
      req.error(new ProgressEvent('error'), { status: 500 });
    });

    it('should handle invalid response from API', (done) => {
      const testUrl = 'https://example.com';

      service.shorten(testUrl).subscribe(result => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe(UrlShortenerErrorType.API_ERROR);
        }
        done();
      });

      const req = httpMock.expectOne(
        `/api/tinyurl?url=${encodeURIComponent(testUrl)}`
      );
      req.flush('not-a-url');
    });

    it('should trim whitespace from response', (done) => {
      const testUrl = 'https://example.com';
      const shortUrl = 'https://tinyurl.com/abc123';

      service.shorten(testUrl).subscribe(result => {
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.shortUrl).toBe(shortUrl);
        }
        done();
      });

      const req = httpMock.expectOne(
        `/api/tinyurl?url=${encodeURIComponent(testUrl)}`
      );
      req.flush(`  ${shortUrl}  `);
    });

    it('should only accept http or https URLs', (done) => {
      const ftpUrl = 'ftp://example.com';

      service.shorten(ftpUrl).subscribe(result => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe(UrlShortenerErrorType.INVALID_URL);
        }
        done();
      });
    });
  });
});
