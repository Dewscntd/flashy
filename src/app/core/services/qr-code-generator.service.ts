/**
 * Core QR code generation service.
 * Domain layer - orchestrates QR code generation with validation and configuration.
 * Follows Single Responsibility: only generates QR code configurations.
 */

import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  QrCodeOptions,
  QrCodeResult,
  ErrorCorrectionLevel,
  DEFAULT_QR_CODE_OPTIONS
} from '../models/qr-code.model';
import { QrCodeConfigurationService } from './qr-code-configuration.service';
import {
  validateQrCodeData,
  getRecommendedSize
} from '../validators/qr-code.validator';

/**
 * Service for QR code generation logic.
 * Pure domain service - returns configurations, doesn't render QR codes.
 */
@Injectable({
  providedIn: 'root'
})
export class QrCodeGeneratorService {
  private readonly configService = inject(QrCodeConfigurationService);

  /**
   * Generates QR code configuration for given data.
   * Validates input, applies smart defaults, merges user preferences.
   *
   * @param data - The data to encode (URL, text, etc.)
   * @param options - Optional custom options to override defaults
   * @returns Observable of QrCodeResult with success status and configuration
   */
  generateQrCode(
    data: string,
    options?: Partial<QrCodeOptions>
  ): Observable<QrCodeResult> {
    // Validate input data
    const validation = validateQrCodeData(data);
    if (!validation.valid) {
      return of({
        success: false,
        data,
        options: DEFAULT_QR_CODE_OPTIONS,
        error: validation.reason || 'Invalid QR code data',
        timestamp: new Date().toISOString()
      });
    }

    // Get user preferences and merge with defaults
    const userPreferences = this.configService.getUserPreferences();
    const mergedOptions: QrCodeOptions = {
      ...DEFAULT_QR_CODE_OPTIONS,
      width: userPreferences.defaultSize,
      errorCorrectionLevel: userPreferences.defaultErrorCorrection,
      colorDark: userPreferences.colorDark,
      colorLight: userPreferences.colorLight,
      ...options
    };

    // Apply smart defaults based on data length
    const optimizedOptions = this.optimizeOptionsForData(data, mergedOptions);

    return of({
      success: true,
      data,
      options: optimizedOptions,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Gets recommended error correction level based on data length.
   * Pure function with business logic.
   *
   * @param dataLength - Length of data to encode
   * @param hasLogo - Whether QR code will have a logo overlay
   * @returns Recommended error correction level
   */
  getRecommendedErrorCorrection(
    dataLength: number,
    hasLogo = false
  ): ErrorCorrectionLevel {
    // Higher error correction for logos (they obscure part of the QR code)
    if (hasLogo) return ErrorCorrectionLevel.H;

    // Lower error correction for very long data (reduces QR code complexity)
    if (dataLength > 300) return ErrorCorrectionLevel.L;

    // Medium is optimal for most URL use cases
    return ErrorCorrectionLevel.M;
  }

  /**
   * Optimizes QR code options based on data characteristics.
   * Pure function - applies business rules for optimal settings.
   *
   * @param data - The data to encode
   * @param options - Current options
   * @returns Optimized options
   */
  private optimizeOptionsForData(
    data: string,
    options: QrCodeOptions
  ): QrCodeOptions {
    const recommendedSize = getRecommendedSize(data.length);
    const recommendedEC = this.getRecommendedErrorCorrection(data.length);

    // Only apply recommendations if user hasn't specified custom values
    return {
      ...options,
      width: options.width || recommendedSize,
      errorCorrectionLevel: options.errorCorrectionLevel || recommendedEC
    };
  }
}
