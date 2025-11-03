/**
 * Service for managing application theme state.
 * Follows Single Responsibility Principle: manages theme state only.
 * Uses Angular signals for reactive state management.
 */

import { Injectable, signal, effect, inject } from '@angular/core';
import { StorageService } from './storage.service';

/**
 * Available theme options
 */
export type Theme = 'light' | 'dark';

/**
 * Storage key for theme preference
 */
const THEME_STORAGE_KEY = 'app-theme';

/**
 * Manages application theme state with localStorage persistence.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storage = inject(StorageService);

  /**
   * Current theme as a reactive signal
   */
  readonly currentTheme = signal<Theme>(this.loadThemePreference());

  /**
   * Whether dark mode is currently active
   */
  readonly isDarkMode = signal<boolean>(this.loadThemePreference() === 'dark');

  constructor() {
    // Apply theme to document on initialization
    this.applyTheme(this.currentTheme());

    // Watch for theme changes and apply them
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      this.saveThemePreference(theme);
      this.isDarkMode.set(theme === 'dark');
    });
  }

  /**
   * Toggles between light and dark theme
   */
  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
  }

  /**
   * Sets theme explicitly
   *
   * @param theme - Theme to set
   */
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  /**
   * Loads theme preference from localStorage.
   * Defaults to 'light' if no preference is saved or if invalid.
   *
   * @returns Saved theme or default
   */
  private loadThemePreference(): Theme {
    const saved = this.storage.getItem<string>(THEME_STORAGE_KEY);
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  }

  /**
   * Saves theme preference to localStorage
   *
   * @param theme - Theme to save
   */
  private saveThemePreference(theme: Theme): void {
    this.storage.setItem(THEME_STORAGE_KEY, theme);
  }

  /**
   * Applies theme to document by setting data attribute
   *
   * @param theme - Theme to apply
   */
  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
