/**
 * ThemeToggleComponent - Standalone component for toggling theme
 *
 * Single Responsibility: Provide UI for theme switching
 * Fully accessible with keyboard navigation and ARIA labels
 * Uses signals for reactive state
 *
 * @example
 * ```html
 * <app-theme-toggle />
 * ```
 */

import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);
  private readonly translation = inject(TranslationService);

  /**
   * Expose theme state to template
   */
  readonly isDarkMode = this.themeService.isDarkMode;
  readonly currentTheme = this.themeService.currentTheme;

  readonly ariaLabel = computed(() =>
    this.translation.instant(
      this.isDarkMode() ? 'theme.toggle.switchToLight' : 'theme.toggle.switchToDark'
    )
  );

  /**
   * Handles theme toggle action
   */
  onToggleTheme(): void {
    this.themeService.toggleTheme();
  }

}
