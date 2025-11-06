/**
 * URL Preview Component - displays the constructed URL with metadata.
 * Follows Single Responsibility: only displays URL preview and actions.
 * Fully declarative and composable.
 */

import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConstructedUrl } from '../../../../core/models/url-build.model';
import { TuiButton } from '@taiga-ui/core/components/button';
import { QrCodePreviewComponent } from '../../../../shared/components/qr-code-preview/qr-code-preview.component';
import { QrCodeOptions, QrCodeExportFormat } from '../../../../core/models/qr-code.model';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-url-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TuiButton, QrCodePreviewComponent, TranslatePipe],
  templateUrl: './url-preview.component.html',
  styleUrl: './url-preview.component.scss'
})
export class UrlPreviewComponent {
  /**
   * The constructed URL data to display.
   */
  readonly urlData = input<ConstructedUrl | null>(null);

  /**
   * Whether the save button should be disabled.
   */
  readonly saveDisabled = input<boolean>(false);

  /**
   * Whether URL shortening is in progress.
   */
  readonly shorteningInProgress = input<boolean>(false);

  /**
   * The shortened URL if available.
   */
  readonly shortenedUrl = input<string | null>(null);

  /**
   * Whether QR code section is visible.
   */
  readonly qrCodeVisible = input<boolean>(false);

  /**
   * Whether QR code is generating.
   */
  readonly qrCodeGenerating = input<boolean>(false);

  /**
   * QR code generation options.
   */
  readonly qrCodeOptions = input<QrCodeOptions | null>(null);

  /**
   * Emitted when user clicks copy button.
   */
  readonly copyClicked = output<void>();

  /**
   * Emitted when user clicks save button.
   */
  readonly saveClicked = output<void>();

  /**
   * Emitted when user clicks shorten URL button.
   */
  readonly shortenClicked = output<void>();

  /**
   * Emitted when user requests QR code generation.
   */
  readonly qrCodeRequested = output<void>();

  /**
   * Emitted when user requests QR code download.
   */
  readonly qrCodeDownloadRequested = output<QrCodeExportFormat>();

  /**
   * Emitted when user requests QR code copy.
   */
  readonly qrCodeCopyRequested = output<void>();

  /**
   * Emitted when user changes QR code options.
   */
  readonly qrCodeOptionsChanged = output<Partial<QrCodeOptions>>();

  /**
   * Handles copy button click.
   */
  onCopy(): void {
    this.copyClicked.emit();
  }

  /**
   * Handles save button click.
   */
  onSave(): void {
    if (!this.saveDisabled()) {
      this.saveClicked.emit();
    }
  }

  /**
   * Handles shorten URL button click.
   */
  onShorten(): void {
    if (!this.shorteningInProgress()) {
      this.shortenClicked.emit();
    }
  }

  /**
   * Handles QR code generation button click.
   */
  onQrCodeGenerate(): void {
    this.qrCodeRequested.emit();
  }

  /**
   * Handles QR code download request.
   */
  onQrCodeDownload(format: QrCodeExportFormat): void {
    this.qrCodeDownloadRequested.emit(format);
  }

  /**
   * Handles QR code copy request.
   */
  onQrCodeCopy(): void {
    this.qrCodeCopyRequested.emit();
  }

  /**
   * Handles QR code options change.
   */
  onQrCodeOptionsChange(options: Partial<QrCodeOptions>): void {
    this.qrCodeOptionsChanged.emit(options);
  }

  /**
   * Gets URL for QR code generation.
   * Prefers shortened URL if available, otherwise uses original URL.
   */
  getQrCodeUrl(): string {
    return this.shortenedUrl() || this.urlData()?.url || '';
  }
}
