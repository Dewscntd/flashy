/**
 * Unit tests for UrlBuilderService
 * Tests URL construction, parsing, and edge cases
 */

import { TestBed } from '@angular/core/testing';
import { UrlBuilderService } from './url-builder.service';
import { UrlBuildForm, QueryParameter } from '../models/url-build.model';

describe('UrlBuilderService', () => {
  let service: UrlBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UrlBuilderService]
    });
    service = TestBed.inject(UrlBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('buildUrl', () => {
    describe('basic URL construction', () => {
      it('should build URL with only base URL', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com'
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toBe('https://example.com/');
        expect(result?.characterCount).toBe(20);
        expect(result?.parameterCount).toBe(0);
      });

      it('should build URL with base URL and path', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com/page'
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toBe('https://example.com/page');
        expect(result?.parameterCount).toBe(0);
      });

      it('should return null for missing base URL', () => {
        const formData: Partial<UrlBuildForm> = {};

        const result = service.buildUrl(formData);

        expect(result).toBeNull();
      });

      it('should return null for invalid base URL', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'not a url'
        };

        const result = service.buildUrl(formData);

        expect(result).toBeNull();
      });

      it('should return null for empty base URL', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: ''
        };

        const result = service.buildUrl(formData);

        expect(result).toBeNull();
      });
    });

    describe('UTM parameters', () => {
      it('should add UTM source parameter', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          utmSource: 'google'
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toBe('https://example.com/?utm_source=google');
        expect(result?.parameterCount).toBe(1);
      });

      it('should add UTM medium parameter', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          utmMedium: 'cpc'
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toBe('https://example.com/?utm_medium=cpc');
        expect(result?.parameterCount).toBe(1);
      });

      it('should add UTM campaign parameter', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          utmCampaign: 'spring-sale'
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toBe('https://example.com/?utm_campaign=spring-sale');
        expect(result?.parameterCount).toBe(1);
      });

      it('should add all UTM parameters', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          utmSource: 'google',
          utmMedium: 'cpc',
          utmCampaign: 'spring-sale'
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toContain('utm_source=google');
        expect(result?.url).toContain('utm_medium=cpc');
        expect(result?.url).toContain('utm_campaign=spring-sale');
        expect(result?.parameterCount).toBe(3);
      });

      it('should trim whitespace from UTM values', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          utmSource: '  google  '
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toBe('https://example.com/?utm_source=google');
      });

      it('should ignore empty UTM values', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          utmSource: '',
          utmMedium: 'cpc'
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toBe('https://example.com/?utm_medium=cpc');
        expect(result?.parameterCount).toBe(1);
      });

      it('should ignore whitespace-only UTM values', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          utmSource: '   ',
          utmMedium: 'cpc'
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toBe('https://example.com/?utm_medium=cpc');
        expect(result?.parameterCount).toBe(1);
      });
    });

    describe('custom parameters', () => {
      it('should add single custom parameter', () => {
        const params: QueryParameter[] = [
          { key: 'color', value: 'blue' }
        ];

        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          params
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toBe('https://example.com/?color=blue');
        expect(result?.parameterCount).toBe(1);
      });

      it('should add multiple custom parameters', () => {
        const params: QueryParameter[] = [
          { key: 'color', value: 'blue' },
          { key: 'size', value: 'large' },
          { key: 'quantity', value: '5' }
        ];

        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          params
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toContain('color=blue');
        expect(result?.url).toContain('size=large');
        expect(result?.url).toContain('quantity=5');
        expect(result?.parameterCount).toBe(3);
      });

      it('should trim whitespace from parameter keys and values', () => {
        const params: QueryParameter[] = [
          { key: '  color  ', value: '  blue  ' }
        ];

        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          params
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toBe('https://example.com/?color=blue');
      });

      it('should handle empty params array', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          params: []
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toBe('https://example.com/');
        expect(result?.parameterCount).toBe(0);
      });

      it('should handle missing params array', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com'
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.parameterCount).toBe(0);
      });

      it('should ignore parameters with empty key', () => {
        const params: QueryParameter[] = [
          { key: '', value: 'blue' },
          { key: 'size', value: 'large' }
        ];

        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          params
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toBe('https://example.com/?size=large');
        expect(result?.parameterCount).toBe(1);
      });

      it('should ignore parameters with empty value', () => {
        const params: QueryParameter[] = [
          { key: 'color', value: '' },
          { key: 'size', value: 'large' }
        ];

        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          params
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toBe('https://example.com/?size=large');
        expect(result?.parameterCount).toBe(1);
      });
    });

    describe('combined parameters', () => {
      it('should add both UTM and custom parameters', () => {
        const params: QueryParameter[] = [
          { key: 'color', value: 'blue' },
          { key: 'size', value: 'large' }
        ];

        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          utmSource: 'google',
          utmMedium: 'cpc',
          params
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toContain('utm_source=google');
        expect(result?.url).toContain('utm_medium=cpc');
        expect(result?.url).toContain('color=blue');
        expect(result?.url).toContain('size=large');
        expect(result?.parameterCount).toBe(4);
      });

      it('should handle complex URL with all parameters', () => {
        const params: QueryParameter[] = [
          { key: 'product_id', value: '12345' },
          { key: 'category', value: 'electronics' }
        ];

        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://shop.example.com/products',
          utmSource: 'newsletter',
          utmMedium: 'email',
          utmCampaign: 'monthly-digest',
          params
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toContain('utm_source=newsletter');
        expect(result?.url).toContain('utm_medium=email');
        expect(result?.url).toContain('utm_campaign=monthly-digest');
        expect(result?.url).toContain('product_id=12345');
        expect(result?.url).toContain('category=electronics');
        expect(result?.parameterCount).toBe(5);
      });
    });

    describe('URL encoding', () => {
      it('should handle special characters in parameter values', () => {
        const params: QueryParameter[] = [
          { key: 'message', value: 'hello world' }
        ];

        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          params
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toContain('message=hello+world');
      });

      it('should handle Unicode characters', () => {
        const params: QueryParameter[] = [
          { key: 'name', value: 'José García' }
        ];

        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          params
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toContain('name=');
        // URL will encode Unicode characters
      });
    });

    describe('edge cases', () => {
      it('should handle base URL with existing query parameters', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com?existing=param',
          utmSource: 'google'
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toContain('existing=param');
        expect(result?.url).toContain('utm_source=google');
      });

      it('should calculate character count correctly', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com',
          utmSource: 'google'
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.characterCount).toBe(result?.url.length);
      });

      it('should handle base URL with port number', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com:8080'
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toContain(':8080');
      });

      it('should handle base URL with hash fragment', () => {
        const formData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com#section'
        };

        const result = service.buildUrl(formData);

        expect(result).not.toBeNull();
        expect(result?.url).toContain('#section');
      });
    });
  });

  describe('parseUrl', () => {
    describe('basic parsing', () => {
      it('should parse URL with no parameters', () => {
        const url = 'https://example.com';

        const result = service.parseUrl(url);

        expect(result).not.toBeNull();
        expect(result?.baseUrl).toBe('https://example.com/');
        expect(result?.params).toEqual([]);
        expect(result?.utmSource).toBeUndefined();
        expect(result?.utmMedium).toBeUndefined();
        expect(result?.utmCampaign).toBeUndefined();
      });

      it('should parse URL with path', () => {
        const url = 'https://example.com/path/to/page';

        const result = service.parseUrl(url);

        expect(result).not.toBeNull();
        expect(result?.baseUrl).toBe('https://example.com/path/to/page');
      });

      it('should return null for invalid URL', () => {
        const url = 'not a url';

        const result = service.parseUrl(url);

        expect(result).toBeNull();
      });

      it('should return null for empty string', () => {
        const url = '';

        const result = service.parseUrl(url);

        expect(result).toBeNull();
      });
    });

    describe('UTM parameter parsing', () => {
      it('should parse utm_source parameter', () => {
        const url = 'https://example.com?utm_source=google';

        const result = service.parseUrl(url);

        expect(result).not.toBeNull();
        expect(result?.utmSource).toBe('google');
        expect(result?.params).toEqual([]);
      });

      it('should parse utm_medium parameter', () => {
        const url = 'https://example.com?utm_medium=cpc';

        const result = service.parseUrl(url);

        expect(result).not.toBeNull();
        expect(result?.utmMedium).toBe('cpc');
      });

      it('should parse utm_campaign parameter', () => {
        const url = 'https://example.com?utm_campaign=spring-sale';

        const result = service.parseUrl(url);

        expect(result).not.toBeNull();
        expect(result?.utmCampaign).toBe('spring-sale');
      });

      it('should parse all UTM parameters', () => {
        const url = 'https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=spring-sale';

        const result = service.parseUrl(url);

        expect(result).not.toBeNull();
        expect(result?.utmSource).toBe('google');
        expect(result?.utmMedium).toBe('cpc');
        expect(result?.utmCampaign).toBe('spring-sale');
        expect(result?.params).toEqual([]);
      });
    });

    describe('custom parameter parsing', () => {
      it('should parse single custom parameter', () => {
        const url = 'https://example.com?color=blue';

        const result = service.parseUrl(url);

        expect(result).not.toBeNull();
        expect(result?.params).toEqual([
          { key: 'color', value: 'blue' }
        ]);
      });

      it('should parse multiple custom parameters', () => {
        const url = 'https://example.com?color=blue&size=large&quantity=5';

        const result = service.parseUrl(url);

        expect(result).not.toBeNull();
        expect(result?.params?.length).toBe(3);
        expect(result?.params).toEqual(jasmine.arrayContaining([
          { key: 'color', value: 'blue' },
          { key: 'size', value: 'large' },
          { key: 'quantity', value: '5' }
        ]));
      });
    });

    describe('combined parameter parsing', () => {
      it('should parse both UTM and custom parameters', () => {
        const url = 'https://example.com?utm_source=google&color=blue&utm_medium=cpc&size=large';

        const result = service.parseUrl(url);

        expect(result).not.toBeNull();
        expect(result?.utmSource).toBe('google');
        expect(result?.utmMedium).toBe('cpc');
        expect(result?.params?.length).toBe(2);
        expect(result?.params).toEqual(jasmine.arrayContaining([
          { key: 'color', value: 'blue' },
          { key: 'size', value: 'large' }
        ]));
      });

      it('should parse complex URL with all components', () => {
        const url = 'https://shop.example.com:8080/products?utm_source=newsletter&utm_medium=email&product_id=12345&category=electronics';

        const result = service.parseUrl(url);

        expect(result).not.toBeNull();
        expect(result?.baseUrl).toBe('https://shop.example.com:8080/products');
        expect(result?.utmSource).toBe('newsletter');
        expect(result?.utmMedium).toBe('email');
        expect(result?.params?.length).toBe(2);
        expect(result?.params).toEqual(jasmine.arrayContaining([
          { key: 'product_id', value: '12345' },
          { key: 'category', value: 'electronics' }
        ]));
      });
    });

    describe('URL decoding', () => {
      it('should decode encoded spaces', () => {
        const url = 'https://example.com?message=hello+world';

        const result = service.parseUrl(url);

        expect(result).not.toBeNull();
        expect(result?.params).toEqual(jasmine.arrayContaining([
          { key: 'message', value: 'hello world' }
        ]));
      });

      it('should decode percent-encoded characters', () => {
        const url = 'https://example.com?message=hello%20world';

        const result = service.parseUrl(url);

        expect(result).not.toBeNull();
        expect(result?.params).toEqual(jasmine.arrayContaining([
          { key: 'message', value: 'hello world' }
        ]));
      });
    });

    describe('round-trip consistency', () => {
      it('should maintain consistency when building and parsing', () => {
        const params: QueryParameter[] = [
          { key: 'color', value: 'blue' },
          { key: 'size', value: 'large' }
        ];

        const originalFormData: Partial<UrlBuildForm> = {
          baseUrl: 'https://example.com/page',
          utmSource: 'google',
          utmMedium: 'cpc',
          utmCampaign: 'spring-sale',
          params
        };

        const built = service.buildUrl(originalFormData);
        expect(built).not.toBeNull();

        const parsed = service.parseUrl(built!.url);
        expect(parsed).not.toBeNull();
        expect(parsed?.utmSource).toBe('google');
        expect(parsed?.utmMedium).toBe('cpc');
        expect(parsed?.utmCampaign).toBe('spring-sale');
        expect(parsed?.params?.length).toBe(2);
      });
    });
  });
});
