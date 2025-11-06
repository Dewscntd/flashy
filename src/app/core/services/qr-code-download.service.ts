/**
 * Service for downloading and exporting QR codes.
 * Infrastructure layer - handles browser file download APIs.
 * Follows Single Responsibility: only manages QR code downloads.
 */

import { Injectable } from '@angular/core';
import { QrCodeExportFormat } from '../models/qr-code.model';

/**
 * Handles QR code export and file downloads.
 * Infrastructure service for browser File API interactions.
 */
@Injectable({
  providedIn: 'root'
})
export class QrCodeDownloadService {
  /**
   * Downloads QR code as PNG image.
   * Uses canvas.toDataURL for image generation.
   *
   * @param canvas - The canvas element containing the QR code
   * @param filename - Desired filename (without extension)
   */
  downloadAsPng(canvas: HTMLCanvasElement, filename: string): void {
    const dataUrl = canvas.toDataURL('image/png');
    this.triggerDownload(dataUrl, `${filename}.png`);
  }

  /**
   * Downloads QR code as JPEG image.
   * Adds white background (JPEG doesn't support transparency).
   *
   * @param canvas - The canvas element containing the QR code
   * @param filename - Desired filename (without extension)
   * @param quality - JPEG quality (0-1, default 0.92)
   */
  downloadAsJpeg(
    canvas: HTMLCanvasElement,
    filename: string,
    quality = 0.92
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Create temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      throw new Error('Temporary canvas context not available');
    }

    // Fill white background (JPEG doesn't support transparency)
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw QR code on top
    tempCtx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/jpeg', quality);
    this.triggerDownload(dataUrl, `${filename}.jpeg`);
  }

  /**
   * Downloads QR code as SVG file.
   * Serializes SVG element to XML string.
   *
   * @param svgElement - The SVG element containing the QR code
   * @param filename - Desired filename (without extension)
   */
  downloadAsSvg(svgElement: SVGElement, filename: string): void {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    this.triggerDownload(url, `${filename}.svg`);

    // Clean up object URL after short delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Gets data URL from canvas element.
   * Utility method for getting base64 encoded image.
   *
   * @param canvas - The canvas element
   * @param format - Export format ('png' or 'jpeg')
   * @returns Data URL string
   */
  getDataUrl(canvas: HTMLCanvasElement, format: QrCodeExportFormat): string {
    if (format === QrCodeExportFormat.JPEG) {
      return canvas.toDataURL('image/jpeg', 0.92);
    }
    return canvas.toDataURL('image/png');
  }

  /**
   * Copies QR code image to clipboard.
   * Uses modern Clipboard API with blob support.
   *
   * @param canvas - The canvas element containing the QR code
   * @returns Promise that resolves when copy is complete
   * @throws Error if Clipboard API is not supported
   */
  async copyImageToClipboard(canvas: HTMLCanvasElement): Promise<void> {
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error('Clipboard API not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }

        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 'image/png');
    });
  }

  /**
   * Generates a filename for QR code based on URL/data.
   * Extracts domain from URL or uses generic name.
   *
   * @param data - The data encoded in the QR code
   * @returns Sanitized filename (without extension)
   */
  generateFilename(data: string): string {
    try {
      // Try to extract domain from URL
      const url = new URL(data);
      const domain = url.hostname.replace(/^www\./, '');
      const timestamp = new Date().toISOString().slice(0, 10);
      return `qrcode-${domain}-${timestamp}`;
    } catch {
      // Not a URL, use generic name with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      return `qrcode-${timestamp}`;
    }
  }

  /**
   * Triggers browser download of a file.
   * Uses anchor element click to initiate download.
   *
   * @param dataUrl - Data URL or blob URL
   * @param filename - Filename with extension
   */
  private triggerDownload(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
