/**
 * Main Application Component - URL Builder
 * Orchestrates the URL building feature with minimal logic.
 * Follows Single Responsibility: coordinate child components and services.
 * Pure presentation logic - all business logic delegated to services.
 */

import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HistoryComponent } from './features/history/history.component';
import { UrlPreviewComponent } from './features/url-builder/components/url-preview/url-preview.component';
import { DynamicParamsComponent } from './features/url-builder/components/dynamic-params/dynamic-params.component';
import { ToastNotificationComponent } from './shared/components/toast-notification/toast-notification.component';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle.component';
import { FormStateManagerService } from './core/services/form-state-manager.service';
import { ClipboardService } from './core/services/clipboard.service';
import { NotificationService } from './core/services/notification.service';
import { UrlBuildRepositoryService } from './core/services/url-build-repository.service';
import { UrlShortenerService } from './core/services/url-shortener.service';
import { UrlBuild } from './core/models/url-build.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HistoryComponent,
    UrlPreviewComponent,
    DynamicParamsComponent,
    ToastNotificationComponent,
    ThemeToggleComponent
  ],
  providers: [FormStateManagerService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  // Inject services using modern inject() function
  private readonly formManager = inject(FormStateManagerService);
  private readonly clipboard = inject(ClipboardService);
  private readonly notifications = inject(NotificationService);
  private readonly repository = inject(UrlBuildRepositoryService);
  private readonly urlShortener = inject(UrlShortenerService);

  // Expose form and computed signals for template
  readonly form = this.formManager.form;
  readonly constructedUrl = this.formManager.constructedUrl;
  readonly canSave = this.formManager.canSave;

  // URL shortening state
  readonly shorteningInProgress = signal<boolean>(false);
  readonly shortenedUrl = signal<string | null>(null);

  /**
   * Handles copy URL action.
   * Delegates to ClipboardService and shows notification.
   */
  async onCopyUrl(): Promise<void> {
    const urlData = this.constructedUrl();

    if (!urlData) {
      this.notifications.warning('No URL to copy');
      return;
    }

    const result = await this.clipboard.copyToClipboard(urlData.url);

    if (result.success) {
      this.notifications.success('URL copied to clipboard!');
    } else {
      this.notifications.error(result.error ?? 'Failed to copy URL');
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
      this.notifications.warning('Please complete the form before saving');
      return;
    }

    try {
      this.repository.save({
        finalUrl: urlData.url,
        form: formData
      });

      this.notifications.success('Build saved successfully!');
    } catch (error) {
      this.notifications.error('Failed to save build');
    }
  }

  /**
   * Handles loading a build from history.
   * Delegates to FormStateManager.
   */
  onLoadBuild(build: UrlBuild): void {
    this.formManager.loadFormData(build.form);
    this.notifications.info('Build loaded into form');

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
   */
  onShortenUrl(): void {
    const urlData = this.constructedUrl();

    if (!urlData) {
      this.notifications.warning('No URL to shorten');
      return;
    }

    // Set loading state
    this.shorteningInProgress.set(true);

    // Call URL shortener service
    this.urlShortener.shortenUrl(urlData.url).subscribe({
      next: (result) => {
        this.shorteningInProgress.set(false);

        if (result.success) {
          this.shortenedUrl.set(result.shortUrl);
          this.notifications.success(
            `URL shortened successfully using ${result.provider}!`
          );
        } else {
          this.handleShorteningError(result.error);
        }
      },
      error: (error) => {
        this.shorteningInProgress.set(false);
        console.error('URL shortening error:', error);
        this.notifications.error('Failed to shorten URL. Please try again.');
      }
    });
  }

  /**
   * Handles errors from URL shortening service.
   */
  private handleShorteningError(error: any): void {
    const errorType = error.type || 'UNKNOWN';

    switch (errorType) {
      case 'RATE_LIMIT':
        this.notifications.warning(error.message);
        break;
      case 'INVALID_URL':
        this.notifications.error('Invalid URL format');
        break;
      case 'NETWORK_ERROR':
        this.notifications.error(
          'Network error. Please check your connection.'
        );
        break;
      case 'API_ERROR':
        this.notifications.error(
          'Service temporarily unavailable. Please try again later.'
        );
        break;
      default:
        this.notifications.error('Failed to shorten URL. Please try again.');
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
}
