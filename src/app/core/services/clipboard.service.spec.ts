/**
 * Unit tests for ClipboardService
 * Tests clipboard operations with fallback mechanisms
 */

import { TestBed } from '@angular/core/testing';
import { ClipboardService } from './clipboard.service';

describe('ClipboardService', () => {
  let service: ClipboardService;
  let mockClipboard: any;

  beforeEach(() => {
    // Mock navigator.clipboard
    mockClipboard = {
      writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve()),
      readText: jasmine.createSpy('readText').and.returnValue(Promise.resolve('test'))
    };

    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true
    });

    TestBed.configureTestingModule({
      providers: [ClipboardService]
    });
    service = TestBed.inject(ClipboardService);
  });

  afterEach(() => {
    // Clean up any created elements
    const textAreas = document.querySelectorAll('textarea');
    textAreas.forEach(ta => ta.remove());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('copyToClipboard', () => {
    describe('using Clipboard API', () => {
      it('should copy text using Clipboard API', async () => {
        const text = 'https://example.com?utm_source=test';

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
        expect(mockClipboard.writeText).toHaveBeenCalledWith(text);
      });

      it('should handle empty string', async () => {
        const text = '';

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(false);
        expect(result.error).toBe('No text provided to copy');
        expect(mockClipboard.writeText).not.toHaveBeenCalled();
      });

      it('should handle whitespace-only string', async () => {
        const text = '   ';

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(false);
        expect(result.error).toBe('No text provided to copy');
        expect(mockClipboard.writeText).not.toHaveBeenCalled();
      });

      it('should copy long text', async () => {
        const text = 'https://example.com?' + 'a'.repeat(1000);

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(true);
        expect(mockClipboard.writeText).toHaveBeenCalledWith(text);
      });

      it('should copy text with special characters', async () => {
        const text = 'https://example.com?param=value&special=!@#$%^&*()';

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(true);
        expect(mockClipboard.writeText).toHaveBeenCalledWith(text);
      });

      it('should copy text with Unicode characters', async () => {
        const text = 'https://example.com?name=José García';

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(true);
        expect(mockClipboard.writeText).toHaveBeenCalledWith(text);
      });

      it('should copy multiline text', async () => {
        const text = 'Line 1\nLine 2\nLine 3';

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(true);
        expect(mockClipboard.writeText).toHaveBeenCalledWith(text);
      });
    });

    describe('Clipboard API error handling', () => {
      it('should use fallback when Clipboard API throws error', async () => {
        mockClipboard.writeText.and.returnValue(Promise.reject(new Error('Permission denied')));
        spyOn(document, 'execCommand').and.returnValue(true);

        const text = 'test text';

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('copy');
      });

      it('should handle permission denied error', async () => {
        mockClipboard.writeText.and.returnValue(Promise.reject(new DOMException('Permission denied', 'NotAllowedError')));
        spyOn(document, 'execCommand').and.returnValue(true);

        const text = 'test text';

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(true);
      });
    });

    describe('fallback method', () => {
      beforeEach(() => {
        // Remove clipboard API to test fallback
        Object.defineProperty(navigator, 'clipboard', {
          value: undefined,
          writable: true,
          configurable: true
        });
      });

      it('should copy text using fallback when Clipboard API unavailable', async () => {
        spyOn(document, 'execCommand').and.returnValue(true);

        const text = 'test text';

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('copy');
      });

      it('should create and remove textarea element', async () => {
        spyOn(document, 'execCommand').and.returnValue(true);
        const appendChildSpy = spyOn(document.body, 'appendChild').and.callThrough();
        const removeChildSpy = spyOn(document.body, 'removeChild').and.callThrough();

        const text = 'test text';

        await service.copyToClipboard(text);

        expect(appendChildSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();

        // Verify textarea was removed
        const textAreas = document.querySelectorAll('textarea');
        expect(textAreas.length).toBe(0);
      });

      it('should position textarea off-screen', async () => {
        spyOn(document, 'execCommand').and.returnValue(true);
        let capturedTextArea: HTMLTextAreaElement | null = null;

        const originalAppendChild = document.body.appendChild.bind(document.body);
        spyOn(document.body, 'appendChild').and.callFake(<T extends Node>(node: T): T => {
          if ((node as unknown as HTMLElement).tagName === 'TEXTAREA') {
            capturedTextArea = node as unknown as HTMLTextAreaElement;
          }
          return originalAppendChild(node) as T;
        });

        await service.copyToClipboard('test');

        expect(capturedTextArea).not.toBeNull();
        expect(capturedTextArea!.style.position).toBe('fixed');
        expect(capturedTextArea!.style.left).toBe('-9999px');
        expect(capturedTextArea!.style.top).toBe('-9999px');
      });

      it('should return error when execCommand fails', async () => {
        spyOn(document, 'execCommand').and.returnValue(false);

        const text = 'test text';

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Copy command failed');
      });

      it('should handle execCommand throwing error', async () => {
        spyOn(document, 'execCommand').and.throwError('Command not supported');

        const text = 'test text';

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Command not supported');
      });

      it('should handle generic Error objects', async () => {
        spyOn(document, 'execCommand').and.throwError(new Error('Custom error'));

        const text = 'test text';

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Custom error');
      });

      it('should handle non-Error objects', async () => {
        spyOn(document, 'execCommand').and.callFake(() => {
          throw 'String error';
        });

        const text = 'test text';

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown error occurred');
      });
    });

    describe('edge cases', () => {
      it('should handle null input (coerced to string)', async () => {
        const text = null as any;

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(false);
      });

      it('should handle undefined input', async () => {
        const text = undefined as any;

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(false);
      });

      it('should handle very long text', async () => {
        const text = 'a'.repeat(100000);

        const result = await service.copyToClipboard(text);

        expect(result.success).toBe(true);
      });
    });
  });

  describe('readFromClipboard', () => {
    describe('successful reading', () => {
      it('should read text from clipboard', async () => {
        const expectedText = 'clipboard content';
        mockClipboard.readText.and.returnValue(Promise.resolve(expectedText));

        const result = await service.readFromClipboard();

        expect(result).toBe(expectedText);
        expect(mockClipboard.readText).toHaveBeenCalled();
      });

      it('should read empty string from clipboard', async () => {
        mockClipboard.readText.and.returnValue(Promise.resolve(''));

        const result = await service.readFromClipboard();

        expect(result).toBe('');
      });

      it('should read long text from clipboard', async () => {
        const longText = 'a'.repeat(10000);
        mockClipboard.readText.and.returnValue(Promise.resolve(longText));

        const result = await service.readFromClipboard();

        expect(result).toBe(longText);
      });
    });

    describe('error handling', () => {
      it('should return null when clipboard API unavailable', async () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: undefined,
          writable: true,
          configurable: true
        });

        const result = await service.readFromClipboard();

        expect(result).toBeNull();
      });

      it('should return null when readText is unavailable', async () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: {},
          writable: true,
          configurable: true
        });

        const result = await service.readFromClipboard();

        expect(result).toBeNull();
      });

      it('should return null when permission denied', async () => {
        mockClipboard.readText.and.returnValue(Promise.reject(new DOMException('Permission denied', 'NotAllowedError')));

        const result = await service.readFromClipboard();

        expect(result).toBeNull();
      });

      it('should return null when readText throws error', async () => {
        mockClipboard.readText.and.returnValue(Promise.reject(new Error('Read error')));

        const result = await service.readFromClipboard();

        expect(result).toBeNull();
      });
    });
  });

  describe('integration scenarios', () => {
    it('should support write and read round-trip', async () => {
      const text = 'test content';
      let writtenText = '';

      mockClipboard.writeText.and.callFake((t: string) => {
        writtenText = t;
        return Promise.resolve();
      });

      mockClipboard.readText.and.callFake(() => {
        return Promise.resolve(writtenText);
      });

      const writeResult = await service.copyToClipboard(text);
      const readResult = await service.readFromClipboard();

      expect(writeResult.success).toBe(true);
      expect(readResult).toBe(text);
    });

    it('should handle multiple copy operations', async () => {
      const text1 = 'first text';
      const text2 = 'second text';

      const result1 = await service.copyToClipboard(text1);
      const result2 = await service.copyToClipboard(text2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(2);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(text1);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(text2);
    });
  });
});
