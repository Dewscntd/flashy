/**
 * Repository service for URL build persistence.
 * Follows Repository Pattern and Single Responsibility Principle.
 * Handles data persistence layer with localStorage backup.
 */

import { Injectable, inject, signal } from '@angular/core';
import { UrlBuild } from '../models/url-build.model';
import { StorageService } from './storage.service';
import { HISTORY_STORAGE_KEY, MAX_HISTORY_BUILDS } from '../../features/history/history.consts';
import { isValidUrlBuild } from '../../features/history/history.utils';

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
      const limited = updated.slice(0, MAX_HISTORY_BUILDS);
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
    this.storage.removeItem(HISTORY_STORAGE_KEY);
  }

  /**
   * Loads builds from localStorage on initialization.
   * Initializes with mock data if localStorage is empty (for testing).
   *
   * @returns Array of builds from storage, or mock data if empty
   */
  private loadFromStorage(): ReadonlyArray<UrlBuild> {
    if (!this.storage.isAvailable()) {
      return this.getMockData();
    }

    const stored = this.storage.getItem<UrlBuild[]>(HISTORY_STORAGE_KEY);

    if (!stored || !Array.isArray(stored)) {
      return this.getMockData();
    }

    // Validate and sanitize stored data
    return stored
      .filter(isValidUrlBuild)
      .slice(0, MAX_HISTORY_BUILDS);
  }

  /**
   * Generates mock URL build data for testing and demonstration.
   * Provides realistic example builds with various parameter combinations.
   *
   * @returns Array of mock UrlBuild entities
   */
  private getMockData(): ReadonlyArray<UrlBuild> {
    const now = new Date();
    const mockBuilds: UrlBuild[] = [
      {
        id: 'mock-001',
        finalUrl: 'https://example.com/?utm_source=linkedin&utm_medium=social&utm_campaign=summer_2024&ref=website',
        form: {
          baseUrl: 'example.com',
          utmSource: 'linkedin',
          utmMedium: 'social',
          utmCampaign: 'summer_2024',
          params: [{ key: 'ref', value: 'website' }]
        },
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        shortenedUrl: 'https://tinyurl.com/abc123',
        shortenedBy: 'tinyurl'
      },
      {
        id: 'mock-002',
        finalUrl: 'https://shop.example.com/products?utm_source=email&utm_medium=newsletter&utm_campaign=black_friday&discount=SAVE20',
        form: {
          baseUrl: 'shop.example.com/products',
          utmSource: 'email',
          utmMedium: 'newsletter',
          utmCampaign: 'black_friday',
          params: [{ key: 'discount', value: 'SAVE20' }]
        },
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        shortenedUrl: 'https://is.gd/xyz789',
        shortenedBy: 'is.gd'
      },
      {
        id: 'mock-003',
        finalUrl: 'https://blog.example.com/article?utm_source=google&utm_medium=cpc&utm_campaign=awareness&utm_content=banner',
        form: {
          baseUrl: 'blog.example.com/article',
          utmSource: 'google',
          utmMedium: 'cpc',
          utmCampaign: 'awareness',
          params: [{ key: 'utm_content', value: 'banner' }]
        },
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        qrCodeGenerated: true
      },
      {
        id: 'mock-004',
        finalUrl: 'https://docs.example.com/guide?utm_source=github&utm_medium=readme&version=2.0',
        form: {
          baseUrl: 'docs.example.com/guide',
          utmSource: 'github',
          utmMedium: 'readme',
          params: [{ key: 'version', value: '2.0' }]
        },
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'mock-005',
        finalUrl: 'https://example.com/webinar?utm_source=twitter&utm_medium=organic&utm_campaign=launch&speaker=john_doe',
        form: {
          baseUrl: 'example.com/webinar',
          utmSource: 'twitter',
          utmMedium: 'organic',
          utmCampaign: 'launch',
          params: [{ key: 'speaker', value: 'john_doe' }]
        },
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        qrCodeGenerated: true
      }
    ];

    return mockBuilds;
  }

  /**
   * Persists builds to localStorage.
   *
   * @param builds - Builds to persist
   */
  private persistToStorage(builds: ReadonlyArray<UrlBuild>): void {
    if (this.storage.isAvailable()) {
      this.storage.setItem(HISTORY_STORAGE_KEY, builds);
    }
  }
}
