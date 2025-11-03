/**
 * Unit tests for is.gd Provider Service
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IsGdProviderService } from './isgd-provider.service';
import { UrlShortenerErrorType } from '../../core/models/url-shortener.model';

describe('IsGdProviderService', () => {
  let service: IsGdProviderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IsGdProviderService]
    });

    service = TestBed.inject(IsGdProviderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.name).toBe('is.gd');
  });

  describe('shorten', () => {
    it('should successfully shorten a valid URL', (done) => {
      const testUrl = 'https://example.com/very/long/url';
      const shortUrl = 'https://is.gd/abc123';

      service.shorten(testUrl).subscribe(result => {
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.shortUrl).toBe(shortUrl);
          expect(result.provider).toBe('is.gd');
        }
        done();
      });

      const req = httpMock.expectOne(
        `/api/isgd?format=json&url=${encodeURIComponent(testUrl)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ shorturl: shortUrl });
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

      httpMock.expectNone(`/api/isgd?format=json&url=${encodeURIComponent(invalidUrl)}`);
    });

    it('should handle API error responses', (done) => {
      const testUrl = 'https://example.com';

      service.shorten(testUrl).subscribe(result => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe(UrlShortenerErrorType.API_ERROR);
          expect(result.error.message).toContain('Error from API');
        }
        done();
      });

      const req = httpMock.expectOne(
        `/api/isgd?format=json&url=${encodeURIComponent(testUrl)}`
      );
      req.flush({ errormessage: 'Error from API' });
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
        `/api/isgd?format=json&url=${encodeURIComponent(testUrl)}`
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
        `/api/isgd?format=json&url=${encodeURIComponent(testUrl)}`
      );
      req.error(new ProgressEvent('error'), { status: 429 });
    });

    it('should handle invalid response structure', (done) => {
      const testUrl = 'https://example.com';

      service.shorten(testUrl).subscribe(result => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe(UrlShortenerErrorType.API_ERROR);
        }
        done();
      });

      const req = httpMock.expectOne(
        `/api/isgd?format=json&url=${encodeURIComponent(testUrl)}`
      );
      req.flush({ shorturl: 'not-a-url' });
    });

    it('should handle missing shorturl in response', (done) => {
      const testUrl = 'https://example.com';

      service.shorten(testUrl).subscribe(result => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe(UrlShortenerErrorType.API_ERROR);
        }
        done();
      });

      const req = httpMock.expectOne(
        `/api/isgd?format=json&url=${encodeURIComponent(testUrl)}`
      );
      req.flush({});
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
