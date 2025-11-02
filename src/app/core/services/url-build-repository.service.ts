/**
 * Repository service for URL build persistence.
 * Follows Repository Pattern and Single Responsibility Principle.
 * Handles data persistence layer with localStorage backup.
 */

import { Injectable, inject, signal } from '@angular/core';
import { UrlBuild } from '../models/url-build.model';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'url_builder_history';
const MAX_BUILDS = 5;

/**
 * Repository for managing URL build entities.
 * Provides in-memory storage with localStorage persistence.
 */
@Injectable({
  providedIn: 'root'
})
export class UrlBuildRepositoryService {
  private readonly storage = inject(StorageService);
  private readonly builds = signal<ReadonlyArray<UrlBuild>>(this.loadFromStorage());

  /**
   * Read-only signal of all builds.
   */
  readonly builds$ = this.builds.asReadonly();

  /**
   * Saves a new URL build to the repository.
   *
   * @param build - Build data without id and createdAt
   * @returns The created UrlBuild entity
   */
  save(build: Omit<UrlBuild, 'id' | 'createdAt'>): UrlBuild {
    const newBuild: UrlBuild = {
      ...build,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    this.builds.update(current => {
      const updated = [newBuild, ...current];
      const limited = updated.slice(0, MAX_BUILDS);
      this.persistToStorage(limited);
      return limited;
    });

    return newBuild;
  }

  /**
   * Retrieves a build by ID.
   *
   * @param id - Build ID
   * @returns UrlBuild if found, null otherwise
   */
  findById(id: string): UrlBuild | null {
    return this.builds().find(build => build.id === id) ?? null;
  }

  /**
   * Retrieves all builds.
   *
   * @returns Array of all builds
   */
  findAll(): ReadonlyArray<UrlBuild> {
    return this.builds();
  }

  /**
   * Deletes a build by ID.
   *
   * @param id - Build ID to delete
   * @returns true if deleted, false if not found
   */
  delete(id: string): boolean {
    const initialLength = this.builds().length;

    this.builds.update(current => {
      const filtered = current.filter(build => build.id !== id);
      if (filtered.length !== initialLength) {
        this.persistToStorage(filtered);
      }
      return filtered;
    });

    return this.builds().length < initialLength;
  }

  /**
   * Clears all builds from repository.
   */
  clear(): void {
    this.builds.set([]);
    this.storage.removeItem(STORAGE_KEY);
  }

  /**
   * Loads builds from localStorage on initialization.
   *
   * @returns Array of builds from storage, or empty array
   */
  private loadFromStorage(): ReadonlyArray<UrlBuild> {
    if (!this.storage.isAvailable()) {
      return [];
    }

    const stored = this.storage.getItem<UrlBuild[]>(STORAGE_KEY);

    if (!stored || !Array.isArray(stored)) {
      return [];
    }

    // Validate and sanitize stored data
    return stored
      .filter(this.isValidUrlBuild)
      .slice(0, MAX_BUILDS);
  }

  /**
   * Persists builds to localStorage.
   *
   * @param builds - Builds to persist
   */
  private persistToStorage(builds: ReadonlyArray<UrlBuild>): void {
    if (this.storage.isAvailable()) {
      this.storage.setItem(STORAGE_KEY, builds);
    }
  }

  /**
   * Type guard to validate UrlBuild structure.
   *
   * @param build - Object to validate
   * @returns true if valid UrlBuild
   */
  private isValidUrlBuild(build: unknown): build is UrlBuild {
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
}
