/**
 * Unit tests for UrlBuildRepositoryService
 * Tests CRUD operations, persistence, and validation
 */

import { TestBed } from '@angular/core/testing';
import { UrlBuildRepositoryService } from './url-build-repository.service';
import { StorageService } from './storage.service';
import { UrlBuild, UrlBuildForm } from '../models/url-build.model';

describe('UrlBuildRepositoryService', () => {
  let service: UrlBuildRepositoryService;
  let storageService: jasmine.SpyObj<StorageService>;

  const createMockBuild = (overrides?: Partial<UrlBuild>): UrlBuild => ({
    id: 'test-id',
    finalUrl: 'https://example.com?utm_source=test',
    form: {
      baseUrl: 'https://example.com',
      utmSource: 'test',
      params: []
    },
    createdAt: new Date().toISOString(),
    ...overrides
  });

  /**
   * Helper to create a fresh service instance with custom storage spy configuration.
   * Required because service uses inject() and cannot be instantiated with new.
   */
  const createServiceWithStorage = (storageSpy: jasmine.SpyObj<StorageService>): UrlBuildRepositoryService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        UrlBuildRepositoryService,
        { provide: StorageService, useValue: storageSpy }
      ]
    });
    return TestBed.inject(UrlBuildRepositoryService);
  };

  beforeEach(() => {
    const storageSpy = jasmine.createSpyObj('StorageService', [
      'getItem',
      'setItem',
      'removeItem',
      'isAvailable'
    ]);

    // Default behavior: storage is available but empty
    storageSpy.isAvailable.and.returnValue(true);
    storageSpy.getItem.and.returnValue(null);
    storageSpy.setItem.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        UrlBuildRepositoryService,
        { provide: StorageService, useValue: storageSpy }
      ]
    });

    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
    service = TestBed.inject(UrlBuildRepositoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load builds from storage on creation', () => {
      expect(storageService.isAvailable).toHaveBeenCalled();
    });

    it('should initialize with empty array when storage is unavailable', () => {
      const storageSpy = jasmine.createSpyObj('StorageService', ['getItem', 'setItem', 'removeItem', 'isAvailable']);
      storageSpy.isAvailable.and.returnValue(false);
      storageSpy.getItem.and.returnValue(null);

      const newService = createServiceWithStorage(storageSpy);

      expect(newService.builds$()).toEqual([]);
    });

    it('should initialize with empty array when storage has no data', () => {
      storageService.getItem.and.returnValue(null);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$()).toEqual([]);
    });

    it('should load valid builds from storage', () => {
      const mockBuilds: UrlBuild[] = [
        createMockBuild({ id: '1' }),
        createMockBuild({ id: '2' })
      ];
      storageService.getItem.and.returnValue(mockBuilds);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$().length).toBe(2);
    });

    it('should filter out invalid builds from storage', () => {
      const mockData = [
        createMockBuild({ id: '1' }),
        { invalid: 'build' }, // Invalid
        createMockBuild({ id: '2' })
      ];
      storageService.getItem.and.returnValue(mockData);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$().length).toBe(2);
    });

    it('should limit loaded builds to MAX_BUILDS', () => {
      const mockBuilds = Array.from({ length: 10 }, (_, i) =>
        createMockBuild({ id: `${i}` })
      );
      storageService.getItem.and.returnValue(mockBuilds);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$().length).toBe(5); // MAX_BUILDS is 5
    });

    it('should handle non-array data from storage', () => {
      storageService.getItem.and.returnValue('not an array' as any);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$()).toEqual([]);
    });
  });

  describe('save', () => {
    it('should save new build and return it with id and timestamp', () => {
      const buildData = {
        finalUrl: 'https://example.com',
        form: {
          baseUrl: 'https://example.com',
          params: []
        }
      };

      const result = service.save(buildData);

      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.finalUrl).toBe(buildData.finalUrl);
      expect(result.form).toEqual(buildData.form);
    });

    it('should add build to the beginning of the list', () => {
      const build1 = service.save({
        finalUrl: 'https://example1.com',
        form: { baseUrl: 'https://example1.com', params: [] }
      });

      const build2 = service.save({
        finalUrl: 'https://example2.com',
        form: { baseUrl: 'https://example2.com', params: [] }
      });

      const builds = service.builds$();
      expect(builds[0].id).toBe(build2.id);
      expect(builds[1].id).toBe(build1.id);
    });

    it('should update builds$ signal', () => {
      const initialLength = service.builds$().length;

      service.save({
        finalUrl: 'https://example.com',
        form: { baseUrl: 'https://example.com', params: [] }
      });

      expect(service.builds$().length).toBe(initialLength + 1);
    });

    it('should persist to storage', () => {
      service.save({
        finalUrl: 'https://example.com',
        form: { baseUrl: 'https://example.com', params: [] }
      });

      expect(storageService.setItem).toHaveBeenCalled();
    });

    it('should limit builds to MAX_BUILDS', () => {
      // Add 6 builds (MAX_BUILDS is 5)
      for (let i = 0; i < 6; i++) {
        service.save({
          finalUrl: `https://example${i}.com`,
          form: { baseUrl: `https://example${i}.com`, params: [] }
        });
      }

      expect(service.builds$().length).toBe(5);
    });

    it('should remove oldest build when exceeding MAX_BUILDS', () => {
      const firstBuild = service.save({
        finalUrl: 'https://first.com',
        form: { baseUrl: 'https://first.com', params: [] }
      });

      // Add 5 more builds
      for (let i = 0; i < 5; i++) {
        service.save({
          finalUrl: `https://example${i}.com`,
          form: { baseUrl: `https://example${i}.com`, params: [] }
        });
      }

      const builds = service.builds$();
      expect(builds.find(b => b.id === firstBuild.id)).toBeUndefined();
    });

    it('should generate unique IDs', () => {
      const build1 = service.save({
        finalUrl: 'https://example.com',
        form: { baseUrl: 'https://example.com', params: [] }
      });

      const build2 = service.save({
        finalUrl: 'https://example.com',
        form: { baseUrl: 'https://example.com', params: [] }
      });

      expect(build1.id).not.toBe(build2.id);
    });

    it('should handle storage failure gracefully', () => {
      storageService.setItem.and.returnValue(false);

      expect(() => {
        service.save({
          finalUrl: 'https://example.com',
          form: { baseUrl: 'https://example.com', params: [] }
        });
      }).not.toThrow();
    });
  });

  describe('findById', () => {
    it('should find build by ID', () => {
      const savedBuild = service.save({
        finalUrl: 'https://example.com',
        form: { baseUrl: 'https://example.com', params: [] }
      });

      const found = service.findById(savedBuild.id);

      expect(found).toEqual(savedBuild);
    });

    it('should return null for non-existent ID', () => {
      const found = service.findById('non-existent-id');

      expect(found).toBeNull();
    });

    it('should return null for empty string ID', () => {
      const found = service.findById('');

      expect(found).toBeNull();
    });

    it('should find correct build among multiple builds', () => {
      const build1 = service.save({
        finalUrl: 'https://example1.com',
        form: { baseUrl: 'https://example1.com', params: [] }
      });

      const build2 = service.save({
        finalUrl: 'https://example2.com',
        form: { baseUrl: 'https://example2.com', params: [] }
      });

      const build3 = service.save({
        finalUrl: 'https://example3.com',
        form: { baseUrl: 'https://example3.com', params: [] }
      });

      const found = service.findById(build2.id);

      expect(found).toEqual(build2);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no builds', () => {
      const builds = service.findAll();

      expect(builds).toEqual([]);
    });

    it('should return all builds', () => {
      service.save({
        finalUrl: 'https://example1.com',
        form: { baseUrl: 'https://example1.com', params: [] }
      });

      service.save({
        finalUrl: 'https://example2.com',
        form: { baseUrl: 'https://example2.com', params: [] }
      });

      const builds = service.findAll();

      expect(builds.length).toBe(2);
    });

    it('should return readonly array', () => {
      const builds = service.findAll();

      expect(Array.isArray(builds)).toBe(true);
      // Verify it's the same reference as builds$ signal
      expect(builds).toBe(service.builds$());
    });
  });

  describe('delete', () => {
    it('should delete build by ID', () => {
      const build = service.save({
        finalUrl: 'https://example.com',
        form: { baseUrl: 'https://example.com', params: [] }
      });

      const result = service.delete(build.id);

      expect(result).toBe(true);
      expect(service.findById(build.id)).toBeNull();
    });

    it('should return false for non-existent ID', () => {
      const result = service.delete('non-existent-id');

      expect(result).toBe(false);
    });

    it('should update builds$ signal', () => {
      const build = service.save({
        finalUrl: 'https://example.com',
        form: { baseUrl: 'https://example.com', params: [] }
      });

      const beforeLength = service.builds$().length;
      service.delete(build.id);
      const afterLength = service.builds$().length;

      expect(afterLength).toBe(beforeLength - 1);
    });

    it('should persist to storage after deletion', () => {
      const build = service.save({
        finalUrl: 'https://example.com',
        form: { baseUrl: 'https://example.com', params: [] }
      });

      storageService.setItem.calls.reset(); // Reset to track only delete call

      service.delete(build.id);

      expect(storageService.setItem).toHaveBeenCalled();
    });

    it('should delete only the specified build', () => {
      const build1 = service.save({
        finalUrl: 'https://example1.com',
        form: { baseUrl: 'https://example1.com', params: [] }
      });

      const build2 = service.save({
        finalUrl: 'https://example2.com',
        form: { baseUrl: 'https://example2.com', params: [] }
      });

      const build3 = service.save({
        finalUrl: 'https://example3.com',
        form: { baseUrl: 'https://example3.com', params: [] }
      });

      service.delete(build2.id);

      expect(service.findById(build1.id)).not.toBeNull();
      expect(service.findById(build2.id)).toBeNull();
      expect(service.findById(build3.id)).not.toBeNull();
    });

    it('should handle storage unavailable during delete', () => {
      storageService.isAvailable.and.returnValue(false);

      const build = service.save({
        finalUrl: 'https://example.com',
        form: { baseUrl: 'https://example.com', params: [] }
      });

      expect(() => {
        service.delete(build.id);
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all builds', () => {
      service.save({
        finalUrl: 'https://example1.com',
        form: { baseUrl: 'https://example1.com', params: [] }
      });

      service.save({
        finalUrl: 'https://example2.com',
        form: { baseUrl: 'https://example2.com', params: [] }
      });

      service.clear();

      expect(service.builds$()).toEqual([]);
    });

    it('should remove item from storage', () => {
      service.clear();

      expect(storageService.removeItem).toHaveBeenCalledWith('url_builder_history');
    });

    it('should handle clearing empty repository', () => {
      expect(() => {
        service.clear();
      }).not.toThrow();
    });

    it('should clear builds$ signal', () => {
      service.save({
        finalUrl: 'https://example.com',
        form: { baseUrl: 'https://example.com', params: [] }
      });

      service.clear();

      expect(service.builds$().length).toBe(0);
    });
  });

  describe('build validation', () => {
    it('should accept valid build with all required fields', () => {
      const validBuild: UrlBuild = createMockBuild();
      storageService.getItem.and.returnValue([validBuild]);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$().length).toBe(1);
    });

    it('should reject build without id', () => {
      const invalidBuild = createMockBuild();
      delete (invalidBuild as any).id;
      storageService.getItem.and.returnValue([invalidBuild]);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$().length).toBe(0);
    });

    it('should reject build without finalUrl', () => {
      const invalidBuild = createMockBuild();
      delete (invalidBuild as any).finalUrl;
      storageService.getItem.and.returnValue([invalidBuild]);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$().length).toBe(0);
    });

    it('should reject build without createdAt', () => {
      const invalidBuild = createMockBuild();
      delete (invalidBuild as any).createdAt;
      storageService.getItem.and.returnValue([invalidBuild]);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$().length).toBe(0);
    });

    it('should reject build without form', () => {
      const invalidBuild = createMockBuild();
      delete (invalidBuild as any).form;
      storageService.getItem.and.returnValue([invalidBuild]);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$().length).toBe(0);
    });

    it('should reject build with form missing baseUrl', () => {
      const invalidBuild = createMockBuild();
      delete (invalidBuild.form as any).baseUrl;
      storageService.getItem.and.returnValue([invalidBuild]);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$().length).toBe(0);
    });

    it('should reject build with form missing params array', () => {
      const invalidBuild = createMockBuild();
      delete (invalidBuild.form as any).params;
      storageService.getItem.and.returnValue([invalidBuild]);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$().length).toBe(0);
    });

    it('should reject build with non-string id', () => {
      const invalidBuild = createMockBuild();
      (invalidBuild as any).id = 123;
      storageService.getItem.and.returnValue([invalidBuild]);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$().length).toBe(0);
    });

    it('should accept build with optional UTM fields', () => {
      const validBuild = createMockBuild({
        form: {
          baseUrl: 'https://example.com',
          utmSource: 'google',
          utmMedium: 'cpc',
          utmCampaign: 'spring',
          params: []
        }
      });
      storageService.getItem.and.returnValue([validBuild]);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$().length).toBe(1);
    });

    it('should accept build with query parameters', () => {
      const validBuild = createMockBuild({
        form: {
          baseUrl: 'https://example.com',
          params: [
            { key: 'color', value: 'blue' },
            { key: 'size', value: 'large' }
          ]
        }
      });
      storageService.getItem.and.returnValue([validBuild]);

      const newService = createServiceWithStorage(storageService);

      expect(newService.builds$().length).toBe(1);
    });
  });

  describe('integration scenarios', () => {
    it('should support full CRUD cycle', () => {
      // Create
      const build = service.save({
        finalUrl: 'https://example.com',
        form: { baseUrl: 'https://example.com', params: [] }
      });

      // Read
      const found = service.findById(build.id);
      expect(found).toEqual(build);

      const all = service.findAll();
      expect(all).toContain(build);

      // Delete
      const deleted = service.delete(build.id);
      expect(deleted).toBe(true);

      const notFound = service.findById(build.id);
      expect(notFound).toBeNull();
    });

    it('should maintain data consistency across operations', () => {
      const build1 = service.save({
        finalUrl: 'https://example1.com',
        form: { baseUrl: 'https://example1.com', params: [] }
      });

      const build2 = service.save({
        finalUrl: 'https://example2.com',
        form: { baseUrl: 'https://example2.com', params: [] }
      });

      expect(service.builds$().length).toBe(2);

      service.delete(build1.id);

      expect(service.builds$().length).toBe(1);
      expect(service.findById(build2.id)).not.toBeNull();

      service.clear();

      expect(service.builds$().length).toBe(0);
    });

    it('should persist changes to storage', () => {
      service.save({
        finalUrl: 'https://example.com',
        form: { baseUrl: 'https://example.com', params: [] }
      });

      const saveCall = storageService.setItem.calls.mostRecent();
      expect(saveCall.args[0]).toBe('url_builder_history');
      expect(Array.isArray(saveCall.args[1])).toBe(true);
    });
  });
});
