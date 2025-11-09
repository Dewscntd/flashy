/**
 * Main Application Component - URL Builder
 * Orchestrates the URL building feature with minimal logic.
 * Follows Single Responsibility: coordinate child components and services.
 * Pure presentation logic - all business logic delegated to services.
 */

import { Component, inject, signal, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HistoryComponent } from './features/history/history.component';
import { UrlPreviewComponent } from './features/url-builder/components/url-preview/url-preview.component';
import { DynamicParamsComponent } from './features/url-builder/components/dynamic-params/dynamic-params.component';
import { ToastNotificationComponent } from './shared/components/toast-notification/toast-notification.component';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle.component';
import { LanguageSwitcherComponent } from './shared/components/language-switcher/language-switcher.component';
import { TranslatePipe } from './core/pipes/translate.pipe';
import { FormStateManagerService } from './core/services/form-state-manager.service';
import { ClipboardService } from './core/services/clipboard.service';
import { NotificationService } from './core/services/notification.service';
import { UrlBuildRepositoryService } from './core/services/url-build-repository.service';
import { UrlShortenerService } from './core/services/url-shortener.service';
import { UrlBuild } from './core/models/url-build.model';
import { TuiRoot } from '@taiga-ui/core/components/root';
import { TuiHintDirective } from '@taiga-ui/core/directives/hint';
import { QrCodeOrchestratorService } from './core/services/qr-code-orchestrator.service';
import { QrCodeExportFormat, QrCodeOptions } from './core/models/qr-code.model';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TuiRoot,
    TuiHintDirective,
    HistoryComponent,
    UrlPreviewComponent,
    DynamicParamsComponent,
    ToastNotificationComponent,
    ThemeToggleComponent,
    LanguageSwitcherComponent,
    TranslatePipe
  ],
  providers: [FormStateManagerService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  // Inject services using modern inject() function
  private readonly formManager = inject(FormStateManagerService);
  private readonly clipboard = inject(ClipboardService);
  private readonly notifications = inject(NotificationService);
  private readonly repository = inject(UrlBuildRepositoryService);
  private readonly urlShortener = inject(UrlShortenerService);
  private readonly qrCodeOrchestrator = inject(QrCodeOrchestratorService);

  // ViewChild references for QR code DOM elements (Angular best practice)
  @ViewChild('qrCodeCanvas', { read: ElementRef }) qrCodeCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('qrCodeSvg', { read: ElementRef }) qrCodeSvgRef?: ElementRef<SVGElement>;

  // Expose form and computed signals for template
  readonly form = this.formManager.form;
  readonly constructedUrl = this.formManager.constructedUrl;
  readonly canSave = this.formManager.canSave;

  // URL shortening state
  readonly shorteningInProgress = signal<boolean>(false);
  readonly shortenedUrl = signal<string | null>(null);

  // QR code state (delegated to orchestrator service)
  readonly qrCodeVisible = this.qrCodeOrchestrator.visible;
  readonly qrCodeGenerating = this.qrCodeOrchestrator.generating;
  readonly qrCodeOptions = this.qrCodeOrchestrator.options;

  /**
   * Handles copy URL action.
   * Delegates to ClipboardService and shows notification.
   */
  async onCopyUrl(): Promise<void> {
    const urlData = this.constructedUrl();

    if (!urlData) {
      this.notifications.warning('notifications.noUrlToCopy');
      return;
    }

    const result = await this.clipboard.copyToClipboard(urlData.url);

    if (result.success) {
      this.notifications.success('notifications.urlCopied');
    } else {
      this.notifications.error('notifications.urlCopyFailed');
    }
  }

  /**
   * Handles save build action.
   * Delegates to Repository and shows notification.
   */
  onSaveBuild(): void {
    const urlData = this.constructedUrl();
    const formData = this.formManager.getFormData();

    if (!urlData || !formData) {
      this.notifications.warning('notifications.completeFormBeforeSaving');
      return;
    }

    try {
      this.repository.save({
        finalUrl: urlData.url,
        form: formData
      });

      this.notifications.success('notifications.buildSaved');
    } catch (error) {
      this.notifications.error('notifications.buildSaveFailed');
    }
  }

  /**
   * Handles loading a build from history.
   * Delegates to FormStateManager.
   */
  onLoadBuild(build: UrlBuild): void {
    this.formManager.loadFormData(build.form);
    this.notifications.info('notifications.buildLoaded');

    // Load shortened URL if available
    if (build.shortenedUrl) {
      this.shortenedUrl.set(build.shortenedUrl);
    } else {
      this.shortenedUrl.set(null);
    }
  }

  /**
   * Handles URL shortening action.
   * Delegates to UrlShortenerService and shows notification.
   * Uses async/await pattern for zoneless change detection compatibility.
   */
  async onShortenUrl(): Promise<void> {
    const urlData = this.constructedUrl();

    if (!urlData) {
      this.notifications.warning('notifications.noUrlToShorten');
      return;
    }

    // Set loading state
    this.shorteningInProgress.set(true);

    try {
      // Call URL shortener service with firstValueFrom for zoneless compatibility
      const result = await firstValueFrom(this.urlShortener.shortenUrl(urlData.url));

      if (result.success) {
        this.shortenedUrl.set(result.shortUrl);
        this.notifications.success(
          'notifications.urlShortened',
          { provider: result.provider }
        );
      } else {
        this.handleShorteningError(result.error);
      }
    } catch (error) {
      console.error('URL shortening error:', error);
      this.notifications.error('notifications.urlShortenFailed');
    } finally {
      this.shorteningInProgress.set(false);
    }
  }

  /**
   * Handles errors from URL shortening service.
   */
  private handleShorteningError(error: unknown): void {
    const errorType = (error && typeof error === 'object' && 'type' in error)
      ? (error as { type: string }).type
      : 'UNKNOWN';

    switch (errorType) {
      case 'RATE_LIMIT':
        this.notifications.warning('notifications.rateLimitExceeded');
        break;
      case 'INVALID_URL':
        this.notifications.error('notifications.invalidUrlFormat');
        break;
      case 'NETWORK_ERROR':
        this.notifications.error('notifications.networkError');
        break;
      case 'API_ERROR':
        this.notifications.error('notifications.serviceUnavailable');
        break;
      default:
        this.notifications.error('notifications.urlShortenFailed');
    }
  }

  /**
   * Handles adding a parameter.
   * Delegates to FormStateManager.
   */
  onAddParameter(): void {
    this.formManager.addParameter();
  }

  /**
   * Handles removing a parameter.
   * Delegates to FormStateManager.
   */
  onRemoveParameter(index: number): void {
    this.formManager.removeParameter(index);
  }

  /**
   * Gets the params FormArray for template binding.
   */
  get params() {
    return this.formManager.params;
  }

  /**
   * Handles QR code generation request.
   * Delegates to QrCodeOrchestratorService.
   */
  async onGenerateQrCode(): Promise<void> {
    const url = this.shortenedUrl() || this.constructedUrl()?.url;
    if (url) {
      await this.qrCodeOrchestrator.generateQrCode(url);
    }
  }

  /**
   * Handles QR code download request.
   * Delegates to QrCodeOrchestratorService with ViewChild references.
   */
  onDownloadQrCode(format: QrCodeExportFormat): void {
    const url = this.shortenedUrl() || this.constructedUrl()?.url;
    if (!url) return;

    // Use ViewChild references instead of document.querySelector
    const canvasElement = this.getQrCodeCanvas();
    const svgElement = this.getQrCodeSvg();

    this.qrCodeOrchestrator.downloadQrCode(format, url, canvasElement, svgElement);
  }

  /**
   * Handles QR code copy to clipboard request.
   * Delegates to QrCodeOrchestratorService with ViewChild reference.
   */
  async onCopyQrCode(): Promise<void> {
    const canvasElement = this.getQrCodeCanvas();
    await this.qrCodeOrchestrator.copyQrCodeToClipboard(canvasElement);
  }

  /**
   * Handles QR code options change.
   * Delegates to QrCodeOrchestratorService.
   */
  onQrCodeOptionsChange(options: Partial<QrCodeOptions>): void {
    this.qrCodeOrchestrator.updateOptions(options);
  }

  /**
   * Helper method to get QR code canvas element.
   * Falls back to DOM query if ViewChild is not available.
   */
  private getQrCodeCanvas(): HTMLCanvasElement | null {
    // Try ViewChild first (preferred)
    if (this.qrCodeCanvasRef?.nativeElement) {
      return this.qrCodeCanvasRef.nativeElement;
    }
    // Fallback to DOM query for backward compatibility
    return document.querySelector('qrcode canvas') as HTMLCanvasElement;
  }

  /**
   * Helper method to get QR code SVG element.
   * Falls back to DOM query if ViewChild is not available.
   */
  private getQrCodeSvg(): SVGElement | null {
    // Try ViewChild first (preferred)
    if (this.qrCodeSvgRef?.nativeElement) {
      return this.qrCodeSvgRef.nativeElement;
    }
    // Fallback to DOM query for backward compatibility
    return document.querySelector('qrcode svg') as SVGElement;
  }
}
