import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

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
 * Checks if a control at path has errors and is touched.
 */
export function hasError(group: FormGroup, controlName: string): boolean {
  const control = group.get(controlName);
  return !!(control?.invalid && control?.touched);
}

/**
 * Gets error message for a control.
 */
export function getErrorMessage(group: FormGroup, controlName: string): string {
  const control = group.get(controlName);

  if (!control || !control.errors) {
    return '';
  }

  if (control.errors['required']) {
    return `${controlName} is required`;
  }

  if (control.errors['invalidKey']) {
    return control.errors['invalidKey'].message;
  }

  return 'Invalid value';
}
