/**
 * Domain service for URL construction logic.
 * Pure business logic with no framework dependencies - easily testable.
 * Follows Single Responsibility Principle: only builds URLs.
 */

import { Injectable } from '@angular/core';
import { ConstructedUrl, QueryParameter, UrlBuildForm } from '../models/url-build.model';

/**
 * Service responsible for constructing URLs from form data.
 * This is a pure domain service - no side effects, just transformations.
 */
@Injectable({
  providedIn: 'root'
})
export class UrlBuilderService {
  /**
   * Constructs a complete URL from the provided form data.
   * Returns a value object containing the URL and metadata.
   *
   * @param formData - The URL build form data
   * @returns ConstructedUrl value object or null if base URL is invalid
   */
  buildUrl(formData: Partial<UrlBuildForm>): ConstructedUrl | null {
    if (!formData.baseUrl || !this.isValidUrl(formData.baseUrl)) {
      return null;
    }

    try {
      const url = new URL(formData.baseUrl);
      let paramCount = 0;

      // Add UTM parameters
      paramCount += this.addUtmParameters(url, formData);

      // Add custom parameters
      paramCount += this.addCustomParameters(url, formData.params || []);

      const finalUrl = url.toString();

      return {
        url: finalUrl,
        characterCount: finalUrl.length,
        parameterCount: paramCount
      };
    } catch {
      return null;
    }
  }

  /**
   * Validates if a string is a properly formatted URL.
   *
   * @param urlString - String to validate
   * @returns true if valid URL, false otherwise
   */
  private isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return !!url.protocol && !!url.hostname;
    } catch {
      return false;
    }
  }

  /**
   * Adds UTM parameters to the URL.
   *
   * @param url - URL object to modify
   * @param formData - Form data containing UTM fields
   * @returns Number of parameters added
   */
  private addUtmParameters(url: URL, formData: Partial<UrlBuildForm>): number {
    let count = 0;

    const utmMappings: Array<{ formKey: keyof UrlBuildForm; paramName: string }> = [
      { formKey: 'utmSource', paramName: 'utm_source' },
      { formKey: 'utmMedium', paramName: 'utm_medium' },
      { formKey: 'utmCampaign', paramName: 'utm_campaign' }
    ];

    for (const { formKey, paramName } of utmMappings) {
      const value = formData[formKey];
      if (value && typeof value === 'string' && value.trim()) {
        url.searchParams.set(paramName, value.trim());
        count++;
      }
    }

    return count;
  }

  /**
   * Adds custom query parameters to the URL.
   *
   * @param url - URL object to modify
   * @param params - Array of custom parameters
   * @returns Number of parameters added
   */
  private addCustomParameters(url: URL, params: ReadonlyArray<QueryParameter>): number {
    let count = 0;

    for (const param of params) {
      if (param.key && param.value) {
        url.searchParams.set(param.key.trim(), param.value.trim());
        count++;
      }
    }

    return count;
  }

  /**
   * Extracts form data from a URL string (reverse operation).
   * Useful for loading URLs back into the form.
   *
   * @param urlString - URL to parse
   * @returns Partial UrlBuildForm data
   */
  parseUrl(urlString: string): Partial<UrlBuildForm> | null {
    try {
      const url = new URL(urlString);
      const params: QueryParameter[] = [];
      let utmSource: string | undefined;
      let utmMedium: string | undefined;
      let utmCampaign: string | undefined;

      url.searchParams.forEach((value, key) => {
        // Extract UTM parameters
        if (key === 'utm_source') {
          utmSource = value;
        } else if (key === 'utm_medium') {
          utmMedium = value;
        } else if (key === 'utm_campaign') {
          utmCampaign = value;
        } else {
          // Custom parameter
          params.push({ key, value });
        }
      });

      return {
        baseUrl: `${url.protocol}//${url.host}${url.pathname}`,
        utmSource,
        utmMedium,
        utmCampaign,
        params
      };
    } catch {
      return null;
    }
  }
}
