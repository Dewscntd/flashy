/**
 * Core domain models for URL building functionality.
 * These models represent the ubiquitous language of the URL Builder domain.
 */

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
 * Extends form data with identity and audit information.
 */
export interface UrlBuild {
  readonly id: string;
  readonly finalUrl: string;
  readonly form: UrlBuildForm;
  readonly createdAt: string;
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

/**
 * Type guard to check if an object is a valid QueryParameter
 */
export function isValidQueryParameter(param: unknown): param is QueryParameter {
  return (
    typeof param === 'object' &&
    param !== null &&
    'key' in param &&
    'value' in param &&
    typeof (param as QueryParameter).key === 'string' &&
    typeof (param as QueryParameter).value === 'string' &&
    (param as QueryParameter).key.length > 0 &&
    (param as QueryParameter).value.length > 0
  );
}
