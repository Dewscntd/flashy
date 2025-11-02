/**
 * URL Preview Component - displays the constructed URL with metadata.
 * Follows Single Responsibility: only displays URL preview and actions.
 * Fully declarative and composable.
 */

import { Component, input, output } from '@angular/core';
import { ConstructedUrl } from '../../../../core/models/url-build.model';

@Component({
  selector: 'app-url-preview',
  standalone: true,
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
   * Emitted when user clicks copy button.
   */
  readonly copyClicked = output<void>();

  /**
   * Emitted when user clicks save button.
   */
  readonly saveClicked = output<void>();

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
}
