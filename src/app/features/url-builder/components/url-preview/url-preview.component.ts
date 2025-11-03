/**
 * URL Preview Component - displays the constructed URL with metadata.
 * Follows Single Responsibility: only displays URL preview and actions.
 * Fully declarative and composable.
 */

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConstructedUrl } from '../../../../core/models/url-build.model';

@Component({
  selector: 'app-url-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './url-preview.component.html',
  styleUrl: './url-preview.component.css'
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
}
