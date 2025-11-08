/**
 * Reusable validator factory functions for URL building forms.
 * Following functional programming principles - pure functions with no side effects.
 */

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that a string is a valid absolute URL.
 * More robust than simple pattern matching.
 * Accepts URLs with or without protocol - will auto-prepend https:// if missing.
 *
 * Validation Logic:
 * - User can type domain without protocol: "example.com" → valid
 * - User can type with http://: "http://example.com" → valid (will be converted to https://)
 * - User can type with https://: "https://example.com" → valid
 * - Localhost is allowed: "localhost:4200" → valid
 * - Must have valid hostname with dot OR be localhost
 *
 * @returns ValidatorFn that returns null if valid, or ValidationErrors if invalid
 */
export function absoluteUrlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Let required validator handle empty values
    }

    try {
      // Trim whitespace for validation
      const trimmedValue = value.trim();

      if (trimmedValue.length === 0) {
        return null; // Empty after trim - let required validator handle
      }

      // Remove any existing protocol for consistent validation
      const valueWithoutProtocol = trimmedValue.replace(/^https?:\/\//i, '');

      // Validate with https:// prepended
      const urlToValidate = `https://${valueWithoutProtocol}`;
      const url = new URL(urlToValidate);

      // Ensure it has a valid hostname
      if (!url.hostname || url.hostname.length === 0) {
        return { absoluteUrl: { value, message: 'URL must include a valid domain' } };
      }

      // Basic hostname validation - must have at least one dot or be localhost
      if (!url.hostname.includes('.') && url.hostname !== 'localhost') {
        return { absoluteUrl: { value, message: 'URL must include a valid domain (e.g., example.com)' } };
      }

      return null;
    } catch {
      return { absoluteUrl: { value, message: 'Invalid URL format' } };
    }
  };
}

/**
 * Validates that parameter keys are unique within a FormArray.
 * Prevents duplicate query parameter keys.
 *
 * @returns ValidatorFn for FormArray validation
 */
export function uniqueKeysValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || !Array.isArray(control.value)) {
      return null;
    }

    const keys = control.value
      .map((param: { key?: string }) => param.key)
      .filter((key): key is string => !!key && key.trim().length > 0);

    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);

    if (duplicates.length > 0) {
      return {
        duplicateKeys: {
          duplicates: Array.from(new Set(duplicates)),
          message: 'Parameter keys must be unique'
        }
      };
    }

    return null;
  };
}

/**
 * Validates that a key doesn't contain reserved URL characters.
 *
 * @returns ValidatorFn that checks for invalid characters
 */
export function validKeyValidator(): ValidatorFn {
  const invalidCharsPattern = /[=&?#\/\\]/;

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    if (invalidCharsPattern.test(value)) {
      return {
        invalidKey: {
          value,
          message: 'Key cannot contain =, &, ?, #, /, or \\'
        }
      };
    }

    return null;
  };
}

/**
 * Validates that UTM parameter names follow naming conventions.
 *
 * @returns ValidatorFn for UTM field validation
 */
export function utmFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || value.trim().length === 0) {
      return null; // Optional field
    }

    // UTM values should not contain special URL characters
    const invalidPattern = /[<>'"]/;
    if (invalidPattern.test(value)) {
      return {
        utmFormat: {
          value,
          message: 'UTM parameter contains invalid characters'
        }
      };
    }

    return null;
  };
}
