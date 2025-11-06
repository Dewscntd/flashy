/**
 * Unit tests for url-build.model.ts
 * Tests the type guard function for QueryParameter validation
 */

import { QueryParameter } from './url-build.model';
import { isValidQueryParameter } from '../../features/url-builder/url-builder.utils';

describe('url-build.model', () => {
  describe('isValidQueryParameter', () => {
    describe('valid cases', () => {
      it('should return true for valid QueryParameter with key and value', () => {
        const param: QueryParameter = { key: 'utm_source', value: 'google' };
        expect(isValidQueryParameter(param)).toBe(true);
      });

      it('should return true for QueryParameter with special characters in value', () => {
        const param: QueryParameter = { key: 'message', value: 'hello world!' };
        expect(isValidQueryParameter(param)).toBe(true);
      });

      it('should return true for QueryParameter with numeric strings', () => {
        const param: QueryParameter = { key: 'id', value: '12345' };
        expect(isValidQueryParameter(param)).toBe(true);
      });

      it('should return true for QueryParameter with Unicode characters', () => {
        const param: QueryParameter = { key: 'name', value: 'José García' };
        expect(isValidQueryParameter(param)).toBe(true);
      });
    });

    describe('invalid cases - null and undefined', () => {
      it('should return false for null', () => {
        expect(isValidQueryParameter(null)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(isValidQueryParameter(undefined)).toBe(false);
      });
    });

    describe('invalid cases - wrong types', () => {
      it('should return false for string', () => {
        expect(isValidQueryParameter('not an object')).toBe(false);
      });

      it('should return false for number', () => {
        expect(isValidQueryParameter(123)).toBe(false);
      });

      it('should return false for boolean', () => {
        expect(isValidQueryParameter(true)).toBe(false);
      });

      it('should return false for array', () => {
        expect(isValidQueryParameter([])).toBe(false);
      });
    });

    describe('invalid cases - missing properties', () => {
      it('should return false for object without key property', () => {
        const param = { value: 'test' };
        expect(isValidQueryParameter(param)).toBe(false);
      });

      it('should return false for object without value property', () => {
        const param = { key: 'test' };
        expect(isValidQueryParameter(param)).toBe(false);
      });

      it('should return false for empty object', () => {
        expect(isValidQueryParameter({})).toBe(false);
      });
    });

    describe('invalid cases - wrong property types', () => {
      it('should return false when key is not a string', () => {
        const param = { key: 123, value: 'test' };
        expect(isValidQueryParameter(param)).toBe(false);
      });

      it('should return false when value is not a string', () => {
        const param = { key: 'test', value: 123 };
        expect(isValidQueryParameter(param)).toBe(false);
      });

      it('should return false when both key and value are not strings', () => {
        const param = { key: 123, value: true };
        expect(isValidQueryParameter(param)).toBe(false);
      });
    });

    describe('invalid cases - empty strings', () => {
      it('should return false when key is empty string', () => {
        const param = { key: '', value: 'test' };
        expect(isValidQueryParameter(param)).toBe(false);
      });

      it('should return false when value is empty string', () => {
        const param = { key: 'test', value: '' };
        expect(isValidQueryParameter(param)).toBe(false);
      });

      it('should return false when both key and value are empty strings', () => {
        const param = { key: '', value: '' };
        expect(isValidQueryParameter(param)).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should return false for object with additional properties but invalid key/value', () => {
        const param = { key: '', value: '', extra: 'property' };
        expect(isValidQueryParameter(param)).toBe(false);
      });

      it('should return true for object with additional properties and valid key/value', () => {
        const param = { key: 'test', value: 'value', extra: 'property' };
        expect(isValidQueryParameter(param)).toBe(true);
      });

      it('should handle whitespace-only strings as valid (non-empty)', () => {
        const param = { key: ' ', value: ' ' };
        expect(isValidQueryParameter(param)).toBe(true);
      });
    });
  });
});
