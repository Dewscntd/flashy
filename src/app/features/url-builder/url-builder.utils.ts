import { QueryParameter } from '../../core/models/url-build.model';

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
