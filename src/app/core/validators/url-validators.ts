/**
 * Reusable validator factory functions for URL building forms.
 * Following functional programming principles - pure functions with no side effects.
 */

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that a string is a valid absolute URL.
 * More robust than simple pattern matching.
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
      const url = new URL(value);
      // Ensure it's an absolute URL with a protocol
      if (!url.protocol || !url.hostname) {
        return { absoluteUrl: { value, message: 'URL must include protocol and hostname' } };
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
