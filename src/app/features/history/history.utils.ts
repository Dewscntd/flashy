import { UrlBuild } from '../../core/models/url-build.model';

/**
 * Type guard to validate UrlBuild structure.
 *
 * @param build - Object to validate
 * @returns true if valid UrlBuild
 */
export function isValidUrlBuild(build: unknown): build is UrlBuild {
  if (!build || typeof build !== 'object') {
    return false;
  }

  const b = build as Partial<UrlBuild>;

  return !!(
    b.id &&
    typeof b.id === 'string' &&
    b.finalUrl &&
    typeof b.finalUrl === 'string' &&
    b.createdAt &&
    typeof b.createdAt === 'string' &&
    b.form &&
    typeof b.form === 'object' &&
    'baseUrl' in b.form &&
    'params' in b.form &&
    Array.isArray(b.form.params)
  );
}

/**
 * Checks if a build matches the search term.
 * Searches in URL, UTM parameters, and custom parameters.
 */
export function matchesBuild(build: UrlBuild, term: string): boolean {
  // Search in final URL
  if (build.finalUrl.toLowerCase().includes(term)) {
    return true;
  }

  // Search in base URL
  if (build.form.baseUrl.toLowerCase().includes(term)) {
    return true;
  }

  // Search in UTM parameters
  const utmValues = [
    build.form.utmSource,
    build.form.utmMedium,
    build.form.utmCampaign
  ].filter(Boolean);

  if (utmValues.some(value => value?.toLowerCase().includes(term))) {
    return true;
  }

  // Search in custom parameters
  return build.form.params.some(
    param =>
      param.key.toLowerCase().includes(term) ||
      param.value.toLowerCase().includes(term)
  );
}
