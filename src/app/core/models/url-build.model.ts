/**
 * Core domain models for URL building functionality.
 * These models represent the ubiquitous language of the URL Builder domain.
 */

import { QrCodePreferences } from './qr-code.model';

/**
 * Represents a single query parameter key-value pair.
 * Enforces that both key and value must be present (no partial params).
 */
export interface QueryParameter {
  readonly key: string;
  readonly value: string;
}

/**
 * UTM (Urchin Tracking Module) parameters for marketing campaign tracking.
 * All fields are optional as per standard UTM conventions.
 */
export interface UtmParameters {
  readonly utmSource?: string;
  readonly utmMedium?: string;
  readonly utmCampaign?: string;
}

/**
 * Complete form data representing a URL build configuration.
 * This is the aggregate root for the URL building bounded context.
 */
export interface UrlBuildForm {
  readonly baseUrl: string;
  readonly utmSource?: string;
  readonly utmMedium?: string;
  readonly utmCampaign?: string;
  readonly params: ReadonlyArray<QueryParameter>;
}

/**
 * Persisted URL build entity with metadata.
 * Extends form data with identity, audit information, and optional QR code data.
 */
export interface UrlBuild {
  readonly id: string;
  readonly finalUrl: string;
  readonly form: UrlBuildForm;
  readonly createdAt: string;
  readonly shortenedUrl?: string;
  readonly shortenedBy?: string;
  readonly qrCodeGenerated?: boolean;
  readonly qrCodePreferences?: QrCodePreferences;
}

/**
 * Value object representing a validated, constructed URL.
 * Encapsulates URL construction business logic.
 */
export interface ConstructedUrl {
  readonly url: string;
  readonly characterCount: number;
  readonly parameterCount: number;
}

