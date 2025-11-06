/**
 * Service for managing QR code configuration and user preferences.
 * Follows Single Responsibility: only manages QR code settings.
 */

import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import {
  QrCodeOptions,
  QrCodePreferences,
  DEFAULT_QR_CODE_OPTIONS,
  DEFAULT_QR_CODE_PREFERENCES
} from '../models/qr-code.model';

const PREFERENCES_STORAGE_KEY = 'qr_code_preferences';

/**
 * Manages QR code configuration and user preferences.
 * Application layer service for settings orchestration.
 */
@Injectable({
  providedIn: 'root'
})
export class QrCodeConfigurationService {
  private readonly storage = inject(StorageService);

  /**
   * Gets default QR code options.
   * Pure function - returns new object each time.
   *
   * @returns Default options object
   */
  getDefaultOptions(): QrCodeOptions {
    return { ...DEFAULT_QR_CODE_OPTIONS };
  }

  /**
   * Gets user preferences from storage.
   * Falls back to defaults if none exist or if stored data is invalid.
   *
   * @returns User preferences or defaults
   */
  getUserPreferences(): QrCodePreferences {
    const stored = this.storage.getItem<QrCodePreferences>(PREFERENCES_STORAGE_KEY);

    if (stored && this.isValidPreferences(stored)) {
      return stored;
    }

    return { ...DEFAULT_QR_CODE_PREFERENCES };
  }

  /**
   * Saves user preferences to storage.
   * Validates preferences before saving.
   *
   * @param preferences - Preferences to save
   * @throws Error if preferences are invalid
   */
  saveUserPreferences(preferences: QrCodePreferences): void {
    if (!this.isValidPreferences(preferences)) {
      throw new Error('Invalid preferences object');
    }

    this.storage.setItem(PREFERENCES_STORAGE_KEY, preferences);
  }

  /**
   * Updates partial preferences.
   * Merges with existing preferences.
   *
   * @param partial - Partial preferences to update
   */
  updatePreferences(partial: Partial<QrCodePreferences>): void {
    const current = this.getUserPreferences();
    const updated = { ...current, ...partial };
    this.saveUserPreferences(updated);
  }

  /**
   * Resets preferences to defaults.
   * Removes stored preferences from localStorage.
   */
  resetToDefaults(): void {
    this.storage.removeItem(PREFERENCES_STORAGE_KEY);
  }

  /**
   * Validates preferences object structure.
   * Type guard function.
   *
   * @param prefs - Preferences to validate
   * @returns True if valid QrCodePreferences
   */
  private isValidPreferences(prefs: unknown): prefs is QrCodePreferences {
    return !!(
      prefs &&
      typeof prefs === 'object' &&
      'defaultSize' in prefs &&
      'defaultErrorCorrection' in prefs &&
      'defaultFormat' in prefs &&
      'colorDark' in prefs &&
      'colorLight' in prefs
    );
  }
}
