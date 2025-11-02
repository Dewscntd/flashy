/**
 * Service for localStorage operations with type safety and error handling.
 * Follows Single Responsibility Principle: manages browser storage only.
 */

import { Injectable } from '@angular/core';

/**
 * Generic type-safe wrapper around localStorage with error handling.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  /**
   * Retrieves an item from localStorage and parses it.
   *
   * @param key - Storage key
   * @returns Parsed value or null if not found or parsing failed
   */
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch {
      // Invalid JSON or storage access error
      return null;
    }
  }

  /**
   * Stores an item in localStorage after JSON serialization.
   *
   * @param key - Storage key
   * @param value - Value to store
   * @returns true if successful, false otherwise
   */
  setItem<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch {
      // Quota exceeded or serialization error
      return false;
    }
  }

  /**
   * Removes an item from localStorage.
   *
   * @param key - Storage key to remove
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail - storage might not be available
    }
  }

  /**
   * Clears all items from localStorage.
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // Silent fail - storage might not be available
    }
  }

  /**
   * Checks if localStorage is available.
   *
   * @returns true if localStorage is supported and accessible
   */
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}
