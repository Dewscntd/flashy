/**
 * Pure validator functions for QR code data validation.
 * Follows Clean Architecture - no framework dependencies, easily testable.
 */

import { QrCodeValidationResult } from '../models/qr-code.model';

/**
 * QR code capacity limits based on version 40 (largest).
 */
const MAX_ALPHANUMERIC_CAPACITY = 4296; // Characters for QR version 40
const MAX_NUMERIC_CAPACITY = 7089;
const RECOMMENDED_URL_LENGTH = 200; // For optimal scanning

/**
 * Validates QR code data.
 * Pure function with no side effects.
 *
 * @param data - Data to validate
 * @returns Validation result with success flag and optional error reason
 */
export function validateQrCodeData(data: string): QrCodeValidationResult {
  if (!data || data.trim().length === 0) {
    return {
      valid: false,
      reason: 'QR code data cannot be empty'
    };
  }

  if (data.length > MAX_ALPHANUMERIC_CAPACITY) {
    return {
      valid: false,
      reason: `QR code data exceeds maximum length (${MAX_ALPHANUMERIC_CAPACITY} characters)`
    };
  }

  return { valid: true };
}

/**
 * Validates URL for QR code encoding with recommendations.
 * Pure function with no side effects.
 *
 * @param url - URL to validate
 * @returns Validation result with recommendations for long URLs
 */
export function validateQrCodeUrl(url: string): QrCodeValidationResult {
  const basicValidation = validateQrCodeData(url);
  if (!basicValidation.valid) {
    return basicValidation;
  }

  // Check if it's a valid URL
  try {
    new URL(url);
  } catch {
    return {
      valid: false,
      reason: 'Invalid URL format'
    };
  }

  // Provide recommendation for long URLs
  if (url.length > RECOMMENDED_URL_LENGTH) {
    return {
      valid: true,
      recommendation: 'URL is quite long. Consider using a shortened URL for a smaller, more scannable QR code.'
    };
  }

  return { valid: true };
}

/**
 * Checks if data length is within optimal range for scanning.
 * Pure function with no side effects.
 *
 * @param data - Data to check
 * @returns True if within optimal range
 */
export function isOptimalLength(data: string): boolean {
  return data.length <= RECOMMENDED_URL_LENGTH;
}

/**
 * Gets data capacity estimate for QR code version.
 * Pure function with no side effects.
 *
 * @param dataLength - Length of data
 * @returns Capacity info with estimated version and usage percentage
 */
export function getCapacityInfo(dataLength: number): {
  estimatedVersion: number;
  capacityUsed: number;
  isOptimal: boolean;
} {
  // Simplified version estimation (actual QR version depends on encoding mode)
  const estimatedVersion = Math.min(40, Math.ceil(dataLength / 100));
  const capacityUsed = Math.round((dataLength / MAX_ALPHANUMERIC_CAPACITY) * 100);
  const isOptimal = dataLength <= RECOMMENDED_URL_LENGTH;

  return {
    estimatedVersion,
    capacityUsed,
    isOptimal
  };
}

/**
 * Gets recommended QR code size based on data length.
 * Pure function with no side effects.
 *
 * @param dataLength - Length of data to encode
 * @returns Recommended size in pixels
 */
export function getRecommendedSize(dataLength: number): number {
  if (dataLength <= 50) return 128;  // Small
  if (dataLength <= 150) return 256;  // Medium
  if (dataLength <= 300) return 512;  // Large
  return 1024;  // XLarge
}
