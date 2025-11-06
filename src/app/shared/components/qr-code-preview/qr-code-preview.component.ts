/**
 * QR Code Preview Component
 * Displays QR code with controls for customization and download.
 * Follows Single Responsibility: only displays and controls QR code.
 */

import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
import {
  QrCodeOptions,
  QrCodeExportFormat,
  ErrorCorrectionLevel,
  QrCodeSizePreset,
  DEFAULT_QR_CODE_OPTIONS
} from '../../../core/models/qr-code.model';

/**
 * Standalone component for QR code display and interaction.
 * Pure presentation - all business logic delegated to services.
 */
@Component({
  selector: 'app-qr-code-preview',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './qr-code-preview.component.html',
  styleUrl: './qr-code-preview.component.scss'
})
export class QrCodePreviewComponent {
  // ===== Inputs =====
  /** The data to encode in the QR code (URL, text, etc.) */
  readonly qrData = input.required<string>();

  /** QR code generation options */
  readonly options = input<QrCodeOptions>(DEFAULT_QR_CODE_OPTIONS);

  /** Loading state for generation */
  readonly isLoading = input<boolean>(false);

  /** Show/hide customization controls */
  readonly showControls = input<boolean>(true);

  // ===== Outputs =====
  /** Emitted when user requests download in specific format */
  readonly downloadRequested = output<QrCodeExportFormat>();

  /** Emitted when user requests copy to clipboard */
  readonly copyRequested = output<void>();

  /** Emitted when user changes QR code options */
  readonly optionsChanged = output<Partial<QrCodeOptions>>();

  // ===== Local State =====
  /** Currently selected size */
  readonly selectedSize = signal<number>(QrCodeSizePreset.MEDIUM);

  /** Currently selected error correction level */
  readonly selectedErrorCorrection = signal<ErrorCorrectionLevel>(ErrorCorrectionLevel.M);

  // ===== Computed State =====
  /** Current options with local overrides */
  readonly currentOptions = computed<QrCodeOptions>(() => ({
    ...this.options(),
    width: this.selectedSize(),
    errorCorrectionLevel: this.selectedErrorCorrection()
  }));

  // ===== Enum References for Template =====
  readonly QrCodeSizePreset = QrCodeSizePreset;
  readonly ErrorCorrectionLevel = ErrorCorrectionLevel;
  readonly QrCodeExportFormat = QrCodeExportFormat;

  // ===== Event Handlers =====
  /**
   * Handles size change from selector.
   * Updates local state and notifies parent.
   *
   * @param size - New size in pixels
   */
  onSizeChange(size: number): void {
    this.selectedSize.set(size);
    this.optionsChanged.emit({ width: size });
  }

  /**
   * Handles error correction level change.
   * Updates local state and notifies parent.
   *
   * @param level - New error correction level
   */
  onErrorCorrectionChange(level: ErrorCorrectionLevel): void {
    this.selectedErrorCorrection.set(level);
    this.optionsChanged.emit({ errorCorrectionLevel: level });
  }

  /**
   * Handles download button click.
   * Delegates to parent via event.
   *
   * @param format - Requested export format
   */
  onDownload(format: QrCodeExportFormat): void {
    this.downloadRequested.emit(format);
  }

  /**
   * Handles copy button click.
   * Delegates to parent via event.
   */
  onCopy(): void {
    this.copyRequested.emit();
  }
}
