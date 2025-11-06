/**
 * Unit tests for TranslationService
 * Tests i18n functionality with signal-based reactivity.
 * Focus: Public methods, locale switching, translation retrieval.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslationService } from './translation.service';
import { StorageService } from './storage.service';
import { DEFAULT_LOCALE, Translation } from '../models/i18n.model';

describe('TranslationService', () => {
  let service: TranslationService;
  let httpMock: HttpTestingController;
  let storageService: jasmine.SpyObj<StorageService>;

  const mockEnglishTranslations: Translation = {
    common: {
      buttons: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete'
      },
      messages: {
        success: 'Success!',
        error: 'Error occurred',
        welcome: 'Welcome, {{name}}'
      }
    },
    urlBuilder: {
      title: 'URL Builder',
      placeholder: 'Enter URL'
    }
  };

  const mockHebrewTranslations: Translation = {
    common: {
      buttons: {
        save: 'שמור',
        cancel: 'בטל',
        delete: 'מחק'
      }
    }
  };

  beforeEach(() => {
    const storageServiceSpy = jasmine.createSpyObj('StorageService', [
      'getItem',
      'setItem'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TranslationService,
        { provide: StorageService, useValue: storageServiceSpy }
      ]
    });

    service = TestBed.inject(TranslationService);
    httpMock = TestBed.inject(HttpTestingController);
    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;

    // Default: no stored locale preference
    storageService.getItem.and.returnValue(null);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialize', () => {
    it('should load default locale translations', async () => {
      const initPromise = service.initialize();

      const req = httpMock.expectOne(`/assets/i18n/${DEFAULT_LOCALE}.json`);
      req.flush(mockEnglishTranslations);

      await initPromise;

      expect(service.locale$()).toBe(DEFAULT_LOCALE);
    });

    it('should load stored locale preference', async () => {
      storageService.getItem.and.returnValue('he');

      const newService = TestBed.inject(TranslationService);
      const initPromise = newService.initialize();

      const req = httpMock.expectOne('/assets/i18n/he.json');
      req.flush(mockHebrewTranslations);

      await initPromise;

      expect(newService.locale$()).toBe('he');
    });
  });

  describe('translate', () => {
    beforeEach(async () => {
      const initPromise = service.initialize();
      const req = httpMock.expectOne(`/assets/i18n/${DEFAULT_LOCALE}.json`);
      req.flush(mockEnglishTranslations);
      await initPromise;
    });

    it('should return translation signal for valid key', () => {
      const signal = service.translate('common.buttons.save');

      expect(signal()).toBe('Save');
    });

    it('should return nested translation', () => {
      const signal = service.translate('urlBuilder.title');

      expect(signal()).toBe('URL Builder');
    });

    it('should return key if translation not found', () => {
      const signal = service.translate('nonexistent.key');

      expect(signal()).toBe('nonexistent.key');
    });

    it('should interpolate parameters', () => {
      const signal = service.translate('common.messages.welcome', { name: 'John' });

      expect(signal()).toBe('Welcome, John');
    });

    it('should handle multiple parameters', () => {
      const mockTranslations: Translation = {
        greeting: 'Hello {{name}}, you have {{count}} messages'
      };

      const initPromise = service.setLocale('en');
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.flush(mockTranslations);

      const signal = service.translate('greeting', { name: 'Alice', count: 5 });

      expect(signal()).toBe('Hello Alice, you have 5 messages');
    });
  });

  describe('instant', () => {
    beforeEach(async () => {
      const initPromise = service.initialize();
      const req = httpMock.expectOne(`/assets/i18n/${DEFAULT_LOCALE}.json`);
      req.flush(mockEnglishTranslations);
      await initPromise;
    });

    it('should return instant translation for valid key', () => {
      const result = service.instant('common.buttons.cancel');

      expect(result).toBe('Cancel');
    });

    it('should return key if translation not found', () => {
      const result = service.instant('missing.key');

      expect(result).toBe('missing.key');
    });

    it('should interpolate parameters', () => {
      const result = service.instant('common.messages.welcome', { name: 'Bob' });

      expect(result).toBe('Welcome, Bob');
    });

    it('should handle deeply nested keys', () => {
      const result = service.instant('common.buttons.delete');

      expect(result).toBe('Delete');
    });
  });

  describe('setLocale', () => {
    beforeEach(async () => {
      const initPromise = service.initialize();
      const req = httpMock.expectOne(`/assets/i18n/${DEFAULT_LOCALE}.json`);
      req.flush(mockEnglishTranslations);
      await initPromise;
    });

    it('should change locale and load translations', async () => {
      const setLocalePromise = service.setLocale('he');

      const req = httpMock.expectOne('/assets/i18n/he.json');
      req.flush(mockHebrewTranslations);

      await setLocalePromise;

      expect(service.locale$()).toBe('he');
    });

    it('should save locale preference to storage', async () => {
      const setLocalePromise = service.setLocale('he');

      const req = httpMock.expectOne('/assets/i18n/he.json');
      req.flush(mockHebrewTranslations);

      await setLocalePromise;

      expect(storageService.setItem).toHaveBeenCalledWith('app-locale', 'he');
    });

    it('should not reload if locale is already current', async () => {
      await service.setLocale('en');

      // No HTTP request should be made
      httpMock.expectNone('/assets/i18n/en.json');
    });

    it('should fallback to English on load error', async () => {
      const setLocalePromise = service.setLocale('he');

      const req = httpMock.expectOne('/assets/i18n/he.json');
      req.error(new ProgressEvent('error'));

      // Should fallback to English
      const fallbackReq = httpMock.expectOne('/assets/i18n/en.json');
      fallbackReq.flush(mockEnglishTranslations);

      await setLocalePromise;

      expect(service.locale$()).toBe('en');
    });
  });

  describe('localeMetadata', () => {
    it('should return metadata for current locale', () => {
      const metadata = service.localeMetadata();

      expect(metadata.code).toBe('en');
      expect(metadata.direction).toBe('ltr');
    });

    it('should update when locale changes', async () => {
      const setLocalePromise = service.setLocale('he');

      const req = httpMock.expectOne('/assets/i18n/he.json');
      req.flush(mockHebrewTranslations);

      await setLocalePromise;

      const metadata = service.localeMetadata();
      expect(metadata.code).toBe('he');
      expect(metadata.direction).toBe('rtl');
    });
  });

  describe('supportedLocales', () => {
    it('should return list of supported locales', () => {
      const locales = service.supportedLocales;

      expect(locales.length).toBe(2);
      expect(locales[0].code).toBe('en');
      expect(locales[1].code).toBe('he');
    });
  });
});
