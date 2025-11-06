/**
 * Unit tests for QrCodeConfigurationService
 * Tests QR code configuration and user preferences management.
 * Focus: Public methods, storage interactions, validation.
 */

import { TestBed } from '@angular/core/testing';
import { QrCodeConfigurationService } from './qr-code-configuration.service';
import { StorageService } from './storage.service';
import {
  ErrorCorrectionLevel,
  QrCodeExportFormat,
  QrCodeSizePreset,
  DEFAULT_QR_CODE_PREFERENCES
} from '../models/qr-code.model';

describe('QrCodeConfigurationService', () => {
  let service: QrCodeConfigurationService;
  let storageService: jasmine.SpyObj<StorageService>;

  beforeEach(() => {
    const storageServiceSpy = jasmine.createSpyObj('StorageService', [
      'getItem',
      'setItem',
      'removeItem'
    ]);

    TestBed.configureTestingModule({
      providers: [
        QrCodeConfigurationService,
        { provide: StorageService, useValue: storageServiceSpy }
      ]
    });

    service = TestBed.inject(QrCodeConfigurationService);
    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDefaultOptions', () => {
    it('should return default QR code options', () => {
      const result = service.getDefaultOptions();

      expect(result.width).toBe(256);
      expect(result.errorCorrectionLevel).toBe(ErrorCorrectionLevel.M);
      expect(result.colorDark).toBe('#000000');
      expect(result.colorLight).toBe('#FFFFFF');
    });

    it('should return new object each time', () => {
      const result1 = service.getDefaultOptions();
      const result2 = service.getDefaultOptions();

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });

  describe('getUserPreferences', () => {
    it('should return stored preferences', () => {
      const storedPrefs = {
        defaultSize: 512,
        defaultErrorCorrection: ErrorCorrectionLevel.H,
        defaultFormat: QrCodeExportFormat.PNG,
        colorDark: '#FF0000',
        colorLight: '#00FF00'
      };
      storageService.getItem.and.returnValue(storedPrefs);

      const result = service.getUserPreferences();

      expect(result).toEqual(storedPrefs);
    });

    it('should return defaults if no stored preferences', () => {
      storageService.getItem.and.returnValue(null);

      const result = service.getUserPreferences();

      expect(result).toEqual(DEFAULT_QR_CODE_PREFERENCES);
    });

    it('should return defaults if stored data is invalid', () => {
      storageService.getItem.and.returnValue({ invalid: 'data' });

      const result = service.getUserPreferences();

      expect(result).toEqual(DEFAULT_QR_CODE_PREFERENCES);
    });

    it('should validate all required preference fields', () => {
      const incompletePrefs = {
        defaultSize: 512,
        defaultErrorCorrection: ErrorCorrectionLevel.H
        // Missing other required fields
      };
      storageService.getItem.and.returnValue(incompletePrefs);

      const result = service.getUserPreferences();

      expect(result).toEqual(DEFAULT_QR_CODE_PREFERENCES);
    });
  });

  describe('saveUserPreferences', () => {
    it('should save valid preferences', () => {
      const prefs = {
        defaultSize: 512,
        defaultErrorCorrection: ErrorCorrectionLevel.Q,
        defaultFormat: QrCodeExportFormat.SVG,
        colorDark: '#000000',
        colorLight: '#FFFFFF'
      };

      service.saveUserPreferences(prefs);

      expect(storageService.setItem).toHaveBeenCalledWith('qr_code_preferences', prefs);
    });

    it('should throw error for invalid preferences', () => {
      const invalidPrefs = { invalid: 'data' } as any;

      expect(() => {
        service.saveUserPreferences(invalidPrefs);
      }).toThrowError('Invalid preferences object');
    });

    it('should throw error for preferences missing required fields', () => {
      const incompletePrefs = {
        defaultSize: 512
      } as any;

      expect(() => {
        service.saveUserPreferences(incompletePrefs);
      }).toThrowError('Invalid preferences object');
    });
  });

  describe('updatePreferences', () => {
    it('should merge partial preferences with existing ones', () => {
      const existingPrefs = {
        defaultSize: 256,
        defaultErrorCorrection: ErrorCorrectionLevel.M,
        defaultFormat: QrCodeExportFormat.PNG,
        colorDark: '#000000',
        colorLight: '#FFFFFF'
      };
      storageService.getItem.and.returnValue(existingPrefs);

      service.updatePreferences({ defaultSize: 512 });

      expect(storageService.setItem).toHaveBeenCalledWith('qr_code_preferences', {
        ...existingPrefs,
        defaultSize: 512
      });
    });

    it('should update color preferences', () => {
      storageService.getItem.and.returnValue(DEFAULT_QR_CODE_PREFERENCES);

      service.updatePreferences({
        colorDark: '#FF0000',
        colorLight: '#00FF00'
      });

      expect(storageService.setItem).toHaveBeenCalledWith('qr_code_preferences', {
        ...DEFAULT_QR_CODE_PREFERENCES,
        colorDark: '#FF0000',
        colorLight: '#00FF00'
      });
    });
  });

  describe('resetToDefaults', () => {
    it('should remove stored preferences', () => {
      service.resetToDefaults();

      expect(storageService.removeItem).toHaveBeenCalledWith('qr_code_preferences');
    });

    it('should allow getUserPreferences to return defaults after reset', () => {
      storageService.getItem.and.returnValue(null);

      service.resetToDefaults();
      const result = service.getUserPreferences();

      expect(result).toEqual(DEFAULT_QR_CODE_PREFERENCES);
    });
  });
});
