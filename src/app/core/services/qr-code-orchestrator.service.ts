/**
 * QR Code Orchestrator Service
 * Orchestrates the complete QR code workflow: generation, download, and clipboard operations.
 * Follows Single Responsibility: coordinates QR code-related services and manages state.
 * Extracted from AppComponent to adhere to SOLID principles.
 */

import { Injectable, inject, signal, Signal, ElementRef } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { QrCodeGeneratorService } from './qr-code-generator.service';
import { QrCodeDownloadService } from './qr-code-download.service';
import { NotificationService } from './notification.service';
import { QrCodeOptions, QrCodeExportFormat } from '../models/qr-code.model';
import { validateQrCodeUrl } from '../validators/qr-code.validator';

export interface QrCodeState {
  visible: boolean;
  generating: boolean;
  options: QrCodeOptions | null;
}

@Injectable({
  providedIn: 'root'
})
export class QrCodeOrchestratorService {
  private readonly qrCodeGenerator = inject(QrCodeGeneratorService);
  private readonly qrCodeDownloader = inject(QrCodeDownloadService);
  private readonly notifications = inject(NotificationService);

  // QR code state signals
  private readonly _visible = signal<boolean>(false);
  private readonly _generating = signal<boolean>(false);
  private readonly _options = signal<QrCodeOptions | null>(null);

  // Public readonly signals
  readonly visible: Signal<boolean> = this._visible.asReadonly();
  readonly generating: Signal<boolean> = this._generating.asReadonly();
  readonly options: Signal<QrCodeOptions | null> = this._options.asReadonly();

  /**
   * Generates a QR code for the given URL.
   * Validates URL, generates QR code configuration, and manages state.
   */
  async generateQrCode(url: string): Promise<void> {
    if (!url) {
      this.notifications.warning('notifications.noUrlForQrCode');
      return;
    }

    // Validate URL for QR code
    const validation = validateQrCodeUrl(url);
    if (!validation.valid) {
      this.notifications.error(validation.reason || 'notifications.invalidUrlForQrCode');
      return;
    }

    // Show recommendation if URL is long
    if (validation.recommendation) {
      this.notifications.info(validation.recommendation);
    }

    // Set generating state
    this._generating.set(true);

    try {
      // Generate QR code configuration with firstValueFrom for zoneless compatibility
      const result = await firstValueFrom(this.qrCodeGenerator.generateQrCode(url));

      if (result.success) {
        this._options.set(result.options);
        this._visible.set(true);
        this.notifications.success('notifications.qrCodeGenerated');
      } else {
        this.notifications.error(result.error || 'notifications.qrCodeGenerateFailed');
      }
    } catch (error) {
      console.error('QR code generation error:', error);
      this.notifications.error('notifications.qrCodeGenerateFailed');
    } finally {
      this._generating.set(false);
    }
  }

  /**
   * Downloads the QR code in the specified format.
   * Requires QR code canvas/SVG element references.
   */
  downloadQrCode(
    format: QrCodeExportFormat,
    url: string,
    canvasElement: HTMLCanvasElement | null,
    svgElement: SVGElement | null
  ): void {
    if (!url) {
      this.notifications.error('notifications.noUrlForQrCode');
      return;
    }

    if (!canvasElement) {
      this.notifications.error('notifications.qrCodeNotFound');
      return;
    }

    try {
      const filename = this.qrCodeDownloader.generateFilename(url);

      switch (format) {
        case QrCodeExportFormat.PNG:
          this.qrCodeDownloader.downloadAsPng(canvasElement, filename);
          this.notifications.success('notifications.qrCodeDownloadedPng');
          break;
        case QrCodeExportFormat.JPEG:
          this.qrCodeDownloader.downloadAsJpeg(canvasElement, filename);
          this.notifications.success('notifications.qrCodeDownloadedJpeg');
          break;
        case QrCodeExportFormat.SVG:
          if (svgElement) {
            this.qrCodeDownloader.downloadAsSvg(svgElement, filename);
            this.notifications.success('notifications.qrCodeDownloadedSvg');
          } else {
            this.notifications.error('notifications.qrCodeNotFound');
          }
          break;
      }
    } catch (error) {
      console.error('QR code download error:', error);
      this.notifications.error('notifications.qrCodeDownloadFailed');
    }
  }

  /**
   * Copies the QR code to clipboard as an image.
   * Requires QR code canvas element reference.
   */
  async copyQrCodeToClipboard(canvasElement: HTMLCanvasElement | null): Promise<void> {
    if (!canvasElement) {
      this.notifications.error('notifications.qrCodeNotFound');
      return;
    }

    try {
      await this.qrCodeDownloader.copyImageToClipboard(canvasElement);
      this.notifications.success('notifications.qrCodeCopied');
    } catch (error) {
      console.error('QR code copy error:', error);
      this.notifications.error('notifications.qrCodeCopyFailed');
    }
  }

  /**
   * Updates QR code options.
   * Merges partial options with current state.
   */
  updateOptions(partialOptions: Partial<QrCodeOptions>): void {
    const current = this._options();
    if (current) {
      this._options.set({ ...current, ...partialOptions });
    }
  }

  /**
   * Resets QR code state.
   * Useful when clearing form or navigating away.
   */
  reset(): void {
    this._visible.set(false);
    this._generating.set(false);
    this._options.set(null);
  }
}
