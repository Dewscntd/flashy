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

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { TuiButton } from '@taiga-ui/core/components/button';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TuiButton],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  /**
   * Expose theme state to template
   */
  readonly isDarkMode = this.themeService.isDarkMode;
  readonly currentTheme = this.themeService.currentTheme;

  /**
   * Handles theme toggle action
   */
  onToggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Accessible label for screen readers
   */
  get ariaLabel(): string {
    return this.isDarkMode()
      ? 'Switch to light mode'
      : 'Switch to dark mode';
  }
}
