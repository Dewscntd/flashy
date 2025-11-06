/**
 * Translation Service
 * Manages application translations with signal-based reactivity.
 * Follows Single Responsibility Principle: manages translations only.
 */

import { Injectable, inject, signal, computed, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { StorageService } from './storage.service';
import {
  Locale,
  Translation,
  TranslationParams,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LocaleMetadata,
  LOCALE_STORAGE_KEY
} from '../models/i18n.model';

/**
 * Translation Service
 * Core i18n service with signal-based reactive translations.
 */
@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);

  // Signal for current locale
  private readonly currentLocale = signal<Locale>(this.loadLocalePreference());

  // Signal for loaded translations
  private readonly translations = signal<Translation>({});

  // Loading state
  private readonly loading = signal<boolean>(false);

  // Track initialization promise
  private initializationPromise: Promise<void> | null = null;

  /**
   * Public read-only signals
   */
  readonly locale$ = this.currentLocale.asReadonly();
  readonly isLoading$ = this.loading.asReadonly();

  /**
   * Computed locale metadata
   */
  readonly localeMetadata = computed(() => {
    const locale = this.currentLocale();
    return SUPPORTED_LOCALES.find(l => l.code === locale) || SUPPORTED_LOCALES[0];
  });

  /**
   * Available locales
   */
  readonly supportedLocales = SUPPORTED_LOCALES;

  /**
   * Initializes the translation service by loading initial translations.
   * Should be called by APP_INITIALIZER to ensure translations are ready before app starts.
   *
   * @returns Promise that resolves when translations are loaded
   */
  initialize(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = this.loadTranslations(this.currentLocale());
    }
    return this.initializationPromise;
  }

  /**
   * Gets a translated string by key.
   * Returns a computed signal that updates when locale changes.
   *
   * @param key - Dot-notation translation key (e.g., 'common.buttons.save')
   * @param params - Optional parameters for interpolation
   * @returns Signal<string> containing translated text
   */
  translate(key: string, params?: TranslationParams): Signal<string> {
    return computed(() => {
      const translation = this.getTranslation(key);
      return params ? this.interpolate(translation, params) : translation;
    });
  }

  /**
   * Gets an instant translation (non-reactive).
   * Use sparingly - prefer translate() for reactive updates.
   *
   * @param key - Translation key
   * @param params - Optional parameters
   * @returns Translated string
   */
  instant(key: string, params?: TranslationParams): string {
    const translation = this.getTranslation(key);
    return params ? this.interpolate(translation, params) : translation;
  }

  /**
   * Sets the current locale and loads its translations.
   *
   * @param locale - Locale to set
   * @returns Promise that resolves when translations are loaded
   */
  async setLocale(locale: Locale): Promise<void> {
    if (locale === this.currentLocale()) {
      return;
    }

    this.currentLocale.set(locale);
    this.saveLocalePreference(locale);
    await this.loadTranslations(locale);

    // Update document attributes for i18n
    this.updateDocumentLocale(locale);
  }

  /**
   * Loads translations for a specific locale.
   *
   * @param locale - Locale to load
   */
  private async loadTranslations(locale: Locale): Promise<void> {
    this.loading.set(true);

    try {
      // Use relative path to work with base-href in production
      const translation = await firstValueFrom(
        this.http.get<Translation>(`assets/i18n/${locale}.json`)
      );

      this.translations.set(translation);
      this.updateDocumentLocale(locale);
    } catch (error) {
      console.error(`Failed to load translations for ${locale}`, error);

      // Fallback to English if not default
      if (locale !== DEFAULT_LOCALE) {
        console.warn(`Falling back to ${DEFAULT_LOCALE} locale`);
        this.currentLocale.set(DEFAULT_LOCALE);
        await this.loadTranslations(DEFAULT_LOCALE);
      }
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Gets a translation value by dot-notation key.
   *
   * @param key - Translation key
   * @returns Translated string or key if not found
   */
  private getTranslation(key: string): string {
    const keys = key.split('.');
    let value: string | Translation = this.translations();

    for (const k of keys) {
      if (typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return key as fallback
      }
    }

    return typeof value === 'string' ? value : key;
  }

  /**
   * Interpolates parameters into translation string.
   *
   * @param text - Translation text with {{param}} placeholders
   * @param params - Parameters to interpolate
   * @returns Interpolated string
   */
  private interpolate(text: string, params: TranslationParams): string {
    return Object.entries(params).reduce(
      (result, [key, value]) =>
        result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value)),
      text
    );
  }

  /**
   * Loads locale preference from storage.
   */
  private loadLocalePreference(): Locale {
    const saved = this.storage.getItem<Locale>(LOCALE_STORAGE_KEY);
    return saved && SUPPORTED_LOCALES.some(l => l.code === saved)
      ? saved
      : DEFAULT_LOCALE;
  }

  /**
   * Saves locale preference to storage.
   */
  private saveLocalePreference(locale: Locale): void {
    this.storage.setItem(LOCALE_STORAGE_KEY, locale);
  }

  /**
   * Updates document locale attributes.
   */
  private updateDocumentLocale(locale: Locale): void {
    const metadata = SUPPORTED_LOCALES.find(l => l.code === locale);
    if (metadata) {
      document.documentElement.setAttribute('lang', locale);
      document.documentElement.setAttribute('dir', metadata.direction);
    }
  }
}
