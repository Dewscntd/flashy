/**
 * Domain models for internationalization (i18n).
 * Follows Clean Architecture - framework-agnostic business entities.
 */

/**
 * Supported locales in the application
 */
export type Locale = 'en' | 'he';

/**
 * Translation parameters for dynamic content
 */
export interface TranslationParams {
  readonly [key: string]: string | number;
}

/**
 * Translation data structure
 * Nested object with dot-notation key support
 */
export interface Translation {
  readonly [key: string]: string | Translation;
}

/**
 * Locale metadata
 */
export interface LocaleMetadata {
  readonly code: Locale;
  readonly name: string;
  readonly nativeName: string;
  readonly dateFormat: string;
  readonly direction: 'ltr' | 'rtl';
}

/**
 * Available locale configurations
 */
export const SUPPORTED_LOCALES: readonly LocaleMetadata[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dateFormat: 'MM/dd/yyyy',
    direction: 'ltr'
  },
  {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    dateFormat: 'dd/MM/yyyy',
    direction: 'rtl'
  }
] as const;

/**
 * Default locale
 */
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Storage key for locale preference
 */
export const LOCALE_STORAGE_KEY = 'app-locale';
