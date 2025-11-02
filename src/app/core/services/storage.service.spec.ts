/**
 * Unit tests for StorageService
 * Tests localStorage wrapper with error handling and edge cases
 */

import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return localStorageMock[key] || null;
    });

    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageMock[key] = value;
    });

    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete localStorageMock[key];
    });

    spyOn(localStorage, 'clear').and.callFake(() => {
      localStorageMock = {};
    });

    TestBed.configureTestingModule({
      providers: [StorageService]
    });
    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    localStorageMock = {};
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getItem', () => {
    describe('successful retrieval', () => {
      it('should retrieve and parse string value', () => {
        const key = 'test-key';
        const value = 'test-value';
        localStorageMock[key] = JSON.stringify(value);

        const result = service.getItem<string>(key);

        expect(result).toBe(value);
        expect(localStorage.getItem).toHaveBeenCalledWith(key);
      });

      it('should retrieve and parse object value', () => {
        const key = 'test-key';
        const value = { name: 'John', age: 30 };
        localStorageMock[key] = JSON.stringify(value);

        const result = service.getItem<typeof value>(key);

        expect(result).toEqual(value);
      });

      it('should retrieve and parse array value', () => {
        const key = 'test-key';
        const value = [1, 2, 3, 4, 5];
        localStorageMock[key] = JSON.stringify(value);

        const result = service.getItem<number[]>(key);

        expect(result).toEqual(value);
      });

      it('should retrieve and parse boolean value', () => {
        const key = 'test-key';
        const value = true;
        localStorageMock[key] = JSON.stringify(value);

        const result = service.getItem<boolean>(key);

        expect(result).toBe(value);
      });

      it('should retrieve and parse number value', () => {
        const key = 'test-key';
        const value = 42;
        localStorageMock[key] = JSON.stringify(value);

        const result = service.getItem<number>(key);

        expect(result).toBe(value);
      });

      it('should retrieve and parse null value', () => {
        const key = 'test-key';
        localStorageMock[key] = JSON.stringify(null);

        const result = service.getItem<null>(key);

        expect(result).toBeNull();
      });

      it('should retrieve nested object', () => {
        const key = 'test-key';
        const value = {
          user: {
            name: 'John',
            address: {
              city: 'New York',
              zip: '10001'
            }
          }
        };
        localStorageMock[key] = JSON.stringify(value);

        const result = service.getItem<typeof value>(key);

        expect(result).toEqual(value);
      });
    });

    describe('error handling', () => {
      it('should return null for non-existent key', () => {
        const result = service.getItem<string>('non-existent');

        expect(result).toBeNull();
      });

      it('should return null for invalid JSON', () => {
        const key = 'test-key';
        localStorageMock[key] = 'invalid json {';

        const result = service.getItem<string>(key);

        expect(result).toBeNull();
      });

      it('should return null when localStorage throws error', () => {
        const key = 'test-key';
        (localStorage.getItem as jasmine.Spy).and.throwError('Storage error');

        const result = service.getItem<string>(key);

        expect(result).toBeNull();
      });

      it('should handle empty string value', () => {
        const key = 'test-key';
        localStorageMock[key] = '';

        const result = service.getItem<string>(key);

        // Empty string is invalid JSON, should return null
        expect(result).toBeNull();
      });
    });
  });

  describe('setItem', () => {
    describe('successful storage', () => {
      it('should store string value', () => {
        const key = 'test-key';
        const value = 'test-value';

        const result = service.setItem(key, value);

        expect(result).toBe(true);
        expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value));
        expect(localStorageMock[key]).toBe(JSON.stringify(value));
      });

      it('should store object value', () => {
        const key = 'test-key';
        const value = { name: 'John', age: 30 };

        const result = service.setItem(key, value);

        expect(result).toBe(true);
        expect(localStorageMock[key]).toBe(JSON.stringify(value));
      });

      it('should store array value', () => {
        const key = 'test-key';
        const value = [1, 2, 3, 4, 5];

        const result = service.setItem(key, value);

        expect(result).toBe(true);
        expect(localStorageMock[key]).toBe(JSON.stringify(value));
      });

      it('should store boolean value', () => {
        const key = 'test-key';
        const value = false;

        const result = service.setItem(key, value);

        expect(result).toBe(true);
        expect(localStorageMock[key]).toBe(JSON.stringify(value));
      });

      it('should store number value', () => {
        const key = 'test-key';
        const value = 42;

        const result = service.setItem(key, value);

        expect(result).toBe(true);
        expect(localStorageMock[key]).toBe(JSON.stringify(value));
      });

      it('should store null value', () => {
        const key = 'test-key';
        const value = null;

        const result = service.setItem(key, value);

        expect(result).toBe(true);
        expect(localStorageMock[key]).toBe(JSON.stringify(value));
      });

      it('should overwrite existing value', () => {
        const key = 'test-key';
        localStorageMock[key] = JSON.stringify('old-value');

        const result = service.setItem(key, 'new-value');

        expect(result).toBe(true);
        expect(localStorageMock[key]).toBe(JSON.stringify('new-value'));
      });

      it('should store complex nested object', () => {
        const key = 'test-key';
        const value = {
          builds: [
            { id: '1', url: 'https://example.com', date: new Date().toISOString() },
            { id: '2', url: 'https://test.com', date: new Date().toISOString() }
          ],
          settings: { theme: 'dark', language: 'en' }
        };

        const result = service.setItem(key, value);

        expect(result).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should return false when quota exceeded', () => {
        const key = 'test-key';
        const value = 'test-value';
        (localStorage.setItem as jasmine.Spy).and.throwError('QuotaExceededError');

        const result = service.setItem(key, value);

        expect(result).toBe(false);
      });

      it('should return false when storage is not available', () => {
        const key = 'test-key';
        const value = 'test-value';
        (localStorage.setItem as jasmine.Spy).and.throwError('Storage not available');

        const result = service.setItem(key, value);

        expect(result).toBe(false);
      });

      it('should return false for circular reference object', () => {
        const key = 'test-key';
        const value: any = { name: 'test' };
        value.self = value; // Create circular reference

        const result = service.setItem(key, value);

        expect(result).toBe(false);
      });
    });
  });

  describe('removeItem', () => {
    it('should remove existing item', () => {
      const key = 'test-key';
      localStorageMock[key] = JSON.stringify('test-value');

      service.removeItem(key);

      expect(localStorage.removeItem).toHaveBeenCalledWith(key);
      expect(localStorageMock[key]).toBeUndefined();
    });

    it('should not throw error for non-existent key', () => {
      expect(() => {
        service.removeItem('non-existent');
      }).not.toThrow();
    });

    it('should handle storage errors silently', () => {
      const key = 'test-key';
      (localStorage.removeItem as jasmine.Spy).and.throwError('Storage error');

      expect(() => {
        service.removeItem(key);
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all items', () => {
      localStorageMock['key1'] = JSON.stringify('value1');
      localStorageMock['key2'] = JSON.stringify('value2');
      localStorageMock['key3'] = JSON.stringify('value3');

      service.clear();

      expect(localStorage.clear).toHaveBeenCalled();
      expect(Object.keys(localStorageMock).length).toBe(0);
    });

    it('should handle empty storage', () => {
      expect(() => {
        service.clear();
      }).not.toThrow();
    });

    it('should handle storage errors silently', () => {
      (localStorage.clear as jasmine.Spy).and.throwError('Storage error');

      expect(() => {
        service.clear();
      }).not.toThrow();
    });
  });

  describe('isAvailable', () => {
    it('should return true when localStorage is available', () => {
      const result = service.isAvailable();

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('__storage_test__', '__storage_test__');
      expect(localStorage.removeItem).toHaveBeenCalledWith('__storage_test__');
    });

    it('should return false when localStorage throws error on setItem', () => {
      (localStorage.setItem as jasmine.Spy).and.throwError('Storage not available');

      const result = service.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false when localStorage throws error on removeItem', () => {
      (localStorage.removeItem as jasmine.Spy).and.throwError('Storage not available');

      const result = service.isAvailable();

      expect(result).toBe(false);
    });

    it('should clean up test item even if available', () => {
      service.isAvailable();

      expect(localStorage.removeItem).toHaveBeenCalledWith('__storage_test__');
      expect(localStorageMock['__storage_test__']).toBeUndefined();
    });
  });

  describe('integration scenarios', () => {
    it('should support set and get round-trip', () => {
      const key = 'test-key';
      const value = { name: 'John', age: 30 };

      const setResult = service.setItem(key, value);
      const getResult = service.getItem<typeof value>(key);

      expect(setResult).toBe(true);
      expect(getResult).toEqual(value);
    });

    it('should return null after removing item', () => {
      const key = 'test-key';
      service.setItem(key, 'value');

      service.removeItem(key);
      const result = service.getItem<string>(key);

      expect(result).toBeNull();
    });

    it('should handle multiple keys independently', () => {
      service.setItem('key1', 'value1');
      service.setItem('key2', 'value2');
      service.setItem('key3', 'value3');

      expect(service.getItem<string>('key1')).toBe('value1');
      expect(service.getItem<string>('key2')).toBe('value2');
      expect(service.getItem<string>('key3')).toBe('value3');

      service.removeItem('key2');

      expect(service.getItem<string>('key1')).toBe('value1');
      expect(service.getItem<string>('key2')).toBeNull();
      expect(service.getItem<string>('key3')).toBe('value3');
    });

    it('should clear all items and then allow new items', () => {
      service.setItem('key1', 'value1');
      service.setItem('key2', 'value2');

      service.clear();

      expect(service.getItem<string>('key1')).toBeNull();
      expect(service.getItem<string>('key2')).toBeNull();

      service.setItem('key3', 'value3');
      expect(service.getItem<string>('key3')).toBe('value3');
    });
  });
});
