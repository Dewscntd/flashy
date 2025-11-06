/**
 * Unit tests for QrCodeGeneratorService
 * Tests QR code generation logic with validation and optimization.
 * Focus: Public methods, happy paths, business logic.
 */

import { TestBed } from '@angular/core/testing';
import { QrCodeGeneratorService } from './qr-code-generator.service';
import { QrCodeConfigurationService } from './qr-code-configuration.service';
import { ErrorCorrectionLevel, DEFAULT_QR_CODE_OPTIONS } from '../models/qr-code.model';
import { firstValueFrom } from 'rxjs';

describe('QrCodeGeneratorService', () => {
  let service: QrCodeGeneratorService;
  let configService: jasmine.SpyObj<QrCodeConfigurationService>;

  beforeEach(() => {
    const configServiceSpy = jasmine.createSpyObj('QrCodeConfigurationService', ['getUserPreferences']);

    TestBed.configureTestingModule({
      providers: [
        QrCodeGeneratorService,
        { provide: QrCodeConfigurationService, useValue: configServiceSpy }
      ]
    });

    service = TestBed.inject(QrCodeGeneratorService);
    configService = TestBed.inject(QrCodeConfigurationService) as jasmine.SpyObj<QrCodeConfigurationService>;

    // Default mock behavior
    configService.getUserPreferences.and.returnValue({
      defaultSize: 256,
      defaultErrorCorrection: ErrorCorrectionLevel.M,
      defaultFormat: 'png' as any,
      colorDark: '#000000',
      colorLight: '#FFFFFF'
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateQrCode', () => {
    it('should generate QR code for valid URL', async () => {
      const url = 'https://example.com';

      const result = await firstValueFrom(service.generateQrCode(url));

      expect(result.success).toBe(true);
      expect(result.data).toBe(url);
      expect(result.options).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should fail for empty data', async () => {
      const result = await firstValueFrom(service.generateQrCode(''));

      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should fail for whitespace-only data', async () => {
      const result = await firstValueFrom(service.generateQrCode('   '));

      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should fail for data exceeding maximum length', async () => {
      const longData = 'a'.repeat(5000);

      const result = await firstValueFrom(service.generateQrCode(longData));

      expect(result.success).toBe(false);
      expect(result.error).toContain('maximum length');
    });

    it('should merge user preferences with default options', async () => {
      configService.getUserPreferences.and.returnValue({
        defaultSize: 512,
        defaultErrorCorrection: ErrorCorrectionLevel.H,
        defaultFormat: 'png' as any,
        colorDark: '#FF0000',
        colorLight: '#00FF00'
      });

      const result = await firstValueFrom(service.generateQrCode('https://example.com'));

      expect(result.options.width).toBe(512);
      expect(result.options.errorCorrectionLevel).toBe(ErrorCorrectionLevel.H);
      expect(result.options.colorDark).toBe('#FF0000');
      expect(result.options.colorLight).toBe('#00FF00');
    });

    it('should allow custom options to override defaults', async () => {
      const customOptions = {
        width: 1024,
        errorCorrectionLevel: ErrorCorrectionLevel.Q
      };

      const result = await firstValueFrom(
        service.generateQrCode('https://example.com', customOptions)
      );

      expect(result.options.width).toBe(1024);
      expect(result.options.errorCorrectionLevel).toBe(ErrorCorrectionLevel.Q);
    });

    it('should optimize size based on data length', async () => {
      const shortData = 'short';
      const result = await firstValueFrom(service.generateQrCode(shortData));

      // Short data should get smaller recommended size
      expect(result.options.width).toBeLessThanOrEqual(256);
    });

    it('should include timestamp in result', async () => {
      const result = await firstValueFrom(service.generateQrCode('https://example.com'));

      expect(result.timestamp).toBeTruthy();
      expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('getRecommendedErrorCorrection', () => {
    it('should return H for QR codes with logos', () => {
      const result = service.getRecommendedErrorCorrection(100, true);

      expect(result).toBe(ErrorCorrectionLevel.H);
    });

    it('should return L for very long data', () => {
      const result = service.getRecommendedErrorCorrection(400);

      expect(result).toBe(ErrorCorrectionLevel.L);
    });

    it('should return M for typical URL length', () => {
      const result = service.getRecommendedErrorCorrection(150);

      expect(result).toBe(ErrorCorrectionLevel.M);
    });

    it('should prioritize logo over data length', () => {
      const result = service.getRecommendedErrorCorrection(400, true);

      // Logo requirement overrides long data recommendation
      expect(result).toBe(ErrorCorrectionLevel.H);
    });
  });
});
