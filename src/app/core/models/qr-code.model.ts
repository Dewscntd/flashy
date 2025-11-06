/**
 * Domain models for QR code generation.
 * Follows Clean Architecture - framework-agnostic business entities.
 */

/**
 * Error correction levels for QR codes.
 * Higher levels allow more damage tolerance but increase QR code size.
 */
export enum ErrorCorrectionLevel {
  /** Low - 7% of codewords can be restored */
  L = 'L',
  /** Medium - 15% of codewords can be restored (recommended for URLs) */
  M = 'M',
  /** Quartile - 25% of codewords can be restored */
  Q = 'Q',
  /** High - 30% of codewords can be restored (recommended with logos) */
  H = 'H'
}

/**
 * Rendering type for QR code display.
 */
export enum QrCodeRenderType {
  /** Canvas rendering (faster, default) */
  CANVAS = 'canvas',
  /** SVG rendering (scalable, better for print) */
  SVG = 'svg'
}

/**
 * Export format for QR code downloads.
 */
export enum QrCodeExportFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  SVG = 'svg'
}

/**
 * Size presets for QR codes.
 */
export enum QrCodeSizePreset {
  SMALL = 128,
  MEDIUM = 256,
  LARGE = 512,
  XLARGE = 1024
}

/**
 * Configuration options for QR code generation.
 * Encapsulates all customization parameters.
 */
export interface QrCodeOptions {
  readonly width: number;
  readonly errorCorrectionLevel: ErrorCorrectionLevel;
  readonly margin: number;
  readonly colorDark: string;
  readonly colorLight: string;
  readonly renderType: QrCodeRenderType;
  readonly cssClass?: string;
  readonly alt?: string;
  readonly ariaLabel?: string;
}

/**
 * User preferences for QR code generation.
 * Stored in localStorage for persistence.
 */
export interface QrCodePreferences {
  readonly defaultSize: number;
  readonly defaultErrorCorrection: ErrorCorrectionLevel;
  readonly defaultFormat: QrCodeExportFormat;
  readonly colorDark: string;
  readonly colorLight: string;
}

/**
 * Result of QR code generation operation.
 */
export interface QrCodeResult {
  readonly success: boolean;
  readonly data: string;
  readonly options: QrCodeOptions;
  readonly error?: string;
  readonly timestamp: string;
}

/**
 * Validation result for QR code data.
 */
export interface QrCodeValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
  readonly recommendation?: string;
}

/**
 * Default QR code configuration.
 * Optimized for URL scanning with mobile devices.
 */
export const DEFAULT_QR_CODE_OPTIONS: QrCodeOptions = {
  width: QrCodeSizePreset.MEDIUM,
  errorCorrectionLevel: ErrorCorrectionLevel.M,
  margin: 4,
  colorDark: '#000000',
  colorLight: '#FFFFFF',
  renderType: QrCodeRenderType.CANVAS,
  alt: 'QR Code',
  ariaLabel: 'Scannable QR code for URL'
};

/**
 * Default user preferences.
 */
export const DEFAULT_QR_CODE_PREFERENCES: QrCodePreferences = {
  defaultSize: QrCodeSizePreset.MEDIUM,
  defaultErrorCorrection: ErrorCorrectionLevel.M,
  defaultFormat: QrCodeExportFormat.PNG,
  colorDark: '#000000',
  colorLight: '#FFFFFF'
};
