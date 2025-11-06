/**
 * Unit tests for QrCodeDownloadService
 * Tests QR code download and export functionality.
 * Focus: Public methods, happy paths, file operations.
 */

import { TestBed } from '@angular/core/testing';
import { QrCodeDownloadService } from './qr-code-download.service';
import { QrCodeExportFormat } from '../models/qr-code.model';

describe('QrCodeDownloadService', () => {
  let service: QrCodeDownloadService;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QrCodeDownloadService]
    });
    service = TestBed.inject(QrCodeDownloadService);

    // Create mock canvas
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 256;
    mockCanvas.height = 256;
    mockContext = mockCanvas.getContext('2d')!;

    // Mock canvas methods
    spyOn(mockCanvas, 'toDataURL').and.returnValue('data:image/png;base64,mock');
    spyOn(mockCanvas, 'toBlob').and.callFake((callback: BlobCallback) => {
      const blob = new Blob(['mock'], { type: 'image/png' });
      callback(blob);
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('downloadAsPng', () => {
    it('should trigger PNG download with correct filename', () => {
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      const mockLink = document.createElement('a');
      spyOn(document, 'createElement').and.returnValue(mockLink);
      spyOn(mockLink, 'click');

      service.downloadAsPng(mockCanvas, 'test-qr');

      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
      expect(mockLink.download).toBe('test-qr.png');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should use canvas data URL for download', () => {
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      const mockLink = document.createElement('a');
      spyOn(document, 'createElement').and.returnValue(mockLink);

      service.downloadAsPng(mockCanvas, 'test');

      expect(mockLink.href).toBe('data:image/png;base64,mock');
    });
  });

  describe('downloadAsJpeg', () => {
    it('should trigger JPEG download with correct filename', () => {
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      const mockLink = document.createElement('a');
      spyOn(document, 'createElement').and.returnValue(mockLink);
      spyOn(mockLink, 'click');

      service.downloadAsJpeg(mockCanvas, 'test-qr');

      expect(mockLink.download).toBe('test-qr.jpeg');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should throw error if canvas context is not available', () => {
      spyOn(mockCanvas, 'getContext').and.returnValue(null);

      expect(() => {
        service.downloadAsJpeg(mockCanvas, 'test');
      }).toThrowError('Canvas context not available');
    });

    it('should use custom quality parameter', () => {
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      spyOn(document, 'createElement').and.returnValue(document.createElement('a'));

      const tempCanvas = document.createElement('canvas');
      spyOn(tempCanvas, 'toDataURL').and.returnValue('data:image/jpeg;base64,mock');
      spyOn(document, 'createElement').and.returnValue(tempCanvas);

      service.downloadAsJpeg(mockCanvas, 'test', 0.8);

      expect(tempCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);
    });
  });

  describe('downloadAsSvg', () => {
    it('should serialize SVG and trigger download', () => {
      const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      const mockLink = document.createElement('a');
      spyOn(document, 'createElement').and.returnValue(mockLink);
      spyOn(mockLink, 'click');

      service.downloadAsSvg(mockSvg, 'test-qr');

      expect(mockLink.download).toBe('test-qr.svg');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('getDataUrl', () => {
    it('should return PNG data URL for PNG format', () => {
      const result = service.getDataUrl(mockCanvas, QrCodeExportFormat.PNG);

      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
      expect(result).toBe('data:image/png;base64,mock');
    });

    it('should return JPEG data URL for JPEG format', () => {
      (mockCanvas.toDataURL as jasmine.Spy).and.returnValue('data:image/jpeg;base64,mock');

      const result = service.getDataUrl(mockCanvas, QrCodeExportFormat.JPEG);

      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.92);
      expect(result).toBe('data:image/jpeg;base64,mock');
    });
  });

  describe('copyImageToClipboard', () => {
    it('should copy canvas image to clipboard', async () => {
      const mockClipboard = {
        write: jasmine.createSpy('write').and.returnValue(Promise.resolve())
      };
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true,
        configurable: true
      });
      Object.defineProperty(window, 'ClipboardItem', {
        value: class {
          constructor(public data: any) {}
        },
        writable: true,
        configurable: true
      });

      await service.copyImageToClipboard(mockCanvas);

      expect(mockClipboard.write).toHaveBeenCalled();
    });

    it('should throw error if Clipboard API is not supported', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true
      });

      await expectAsync(
        service.copyImageToClipboard(mockCanvas)
      ).toBeRejectedWithError('Clipboard API not supported in this browser');
    });

    it('should throw error if ClipboardItem is not supported', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {},
        writable: true,
        configurable: true
      });
      Object.defineProperty(window, 'ClipboardItem', {
        value: undefined,
        writable: true,
        configurable: true
      });

      await expectAsync(
        service.copyImageToClipboard(mockCanvas)
      ).toBeRejectedWithError('Clipboard API not supported in this browser');
    });
  });

  describe('generateFilename', () => {
    it('should extract domain from valid URL', () => {
      const result = service.generateFilename('https://www.example.com/path');

      expect(result).toContain('qrcode-example.com-');
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}$/);
    });

    it('should remove www prefix from domain', () => {
      const result = service.generateFilename('https://www.test.com');

      expect(result).toContain('test.com');
      expect(result).not.toContain('www');
    });

    it('should use generic name for invalid URL', () => {
      const result = service.generateFilename('not a url');

      expect(result).toMatch(/^qrcode-\d{4}-\d{2}-\d{2}$/);
    });

    it('should include current date in filename', () => {
      const result = service.generateFilename('https://example.com');
      const today = new Date().toISOString().slice(0, 10);

      expect(result).toContain(today);
    });
  });
});
