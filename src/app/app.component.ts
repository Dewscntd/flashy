/**
 * Main Application Component - URL Builder
 * Orchestrates the URL building feature with minimal logic.
 * Follows Single Responsibility: coordinate child components and services.
 * Pure presentation logic - all business logic delegated to services.
 */

import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HistoryComponent } from './features/history/history.component';
import { UrlPreviewComponent } from './features/url-builder/components/url-preview/url-preview.component';
import { DynamicParamsComponent } from './features/url-builder/components/dynamic-params/dynamic-params.component';
import { ToastNotificationComponent } from './shared/components/toast-notification/toast-notification.component';
import { FormStateManagerService } from './core/services/form-state-manager.service';
import { ClipboardService } from './core/services/clipboard.service';
import { NotificationService } from './core/services/notification.service';
import { UrlBuildRepositoryService } from './core/services/url-build-repository.service';
import { UrlBuild } from './core/models/url-build.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HistoryComponent,
    UrlPreviewComponent,
    DynamicParamsComponent,
    ToastNotificationComponent
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

  // Expose form and computed signals for template
  readonly form = this.formManager.form;
  readonly constructedUrl = this.formManager.constructedUrl;
  readonly canSave = this.formManager.canSave;

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
