/**
 * Unit tests for ThemeService
 * Tests theme management, localStorage persistence, and signal reactivity
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { StorageService } from './storage.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let storageService: jasmine.SpyObj<StorageService>;
  let originalSetAttribute: typeof document.documentElement.setAttribute;

  beforeEach(() => {
    // Create spy for StorageService
    const storageSpy = jasmine.createSpyObj('StorageService', ['getItem', 'setItem', 'removeItem']);

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: StorageService, useValue: storageSpy }
      ]
    });

    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
    
    // Save original setAttribute method
    originalSetAttribute = document.documentElement.setAttribute;
    
    // Spy on document.documentElement.setAttribute
    spyOn(document.documentElement, 'setAttribute');
  });

  afterEach(() => {
    // Restore original setAttribute
    document.documentElement.setAttribute = originalSetAttribute;
  });

  describe('initialization', () => {
    it('should be created', () => {
      storageService.getItem.and.returnValue(null);
      service = TestBed.inject(ThemeService);
      expect(service).toBeTruthy();
    });

    it('should default to light theme when no saved preference', () => {
      storageService.getItem.and.returnValue(null);
      service = TestBed.inject(ThemeService);
      
      expect(service.currentTheme()).toBe('light');
      expect(service.isDarkMode()).toBe(false);
    });

    it('should load saved light theme preference', () => {
      storageService.getItem.and.returnValue('light');
      service = TestBed.inject(ThemeService);
      
      expect(service.currentTheme()).toBe('light');
      expect(service.isDarkMode()).toBe(false);
    });

    it('should load saved dark theme preference', () => {
      storageService.getItem.and.returnValue('dark');
      service = TestBed.inject(ThemeService);
      
      expect(service.currentTheme()).toBe('dark');
      expect(service.isDarkMode()).toBe(true);
    });

    it('should apply theme to document on init', () => {
      storageService.getItem.and.returnValue('dark');
      service = TestBed.inject(ThemeService);
      
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should default to light for invalid saved value', () => {
      storageService.getItem.and.returnValue('invalid');
      service = TestBed.inject(ThemeService);
      
      expect(service.currentTheme()).toBe('light');
      expect(service.isDarkMode()).toBe(false);
    });
  });

  describe('toggleTheme', () => {
    beforeEach(() => {
      storageService.getItem.and.returnValue('light');
      service = TestBed.inject(ThemeService);
    });

    it('should toggle from light to dark', fakeAsync(() => {
      expect(service.currentTheme()).toBe('light');
      
      service.toggleTheme();
      tick();  // Allow effect to execute
      
      expect(service.currentTheme()).toBe('dark');
      expect(service.isDarkMode()).toBe(true);
    }));

    it('should toggle from dark to light', fakeAsync(() => {
      service.setTheme('dark');
      tick();
      expect(service.currentTheme()).toBe('dark');
      
      service.toggleTheme();
      tick();
      
      expect(service.currentTheme()).toBe('light');
      expect(service.isDarkMode()).toBe(false);
    }));

    it('should save theme preference after toggle', fakeAsync(() => {
      service.toggleTheme();
      tick();
      
      expect(storageService.setItem).toHaveBeenCalledWith('app-theme', 'dark');
    }));

    it('should apply theme to document after toggle', fakeAsync(() => {
      service.toggleTheme();
      tick();
      
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    }));
  });

  describe('setTheme', () => {
    beforeEach(() => {
      storageService.getItem.and.returnValue('light');
      service = TestBed.inject(ThemeService);
    });

    it('should set theme to dark', fakeAsync(() => {
      service.setTheme('dark');
      tick();
      
      expect(service.currentTheme()).toBe('dark');
      expect(service.isDarkMode()).toBe(true);
    }));

    it('should set theme to light', fakeAsync(() => {
      service.setTheme('dark');
      tick();
      service.setTheme('light');
      tick();
      
      expect(service.currentTheme()).toBe('light');
      expect(service.isDarkMode()).toBe(false);
    }));

    it('should save theme preference when set', fakeAsync(() => {
      service.setTheme('dark');
      tick();
      
      expect(storageService.setItem).toHaveBeenCalledWith('app-theme', 'dark');
    }));

    it('should apply theme to document when set', fakeAsync(() => {
      service.setTheme('dark');
      tick();
      
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    }));
  });

  describe('signal reactivity', () => {
    beforeEach(() => {
      storageService.getItem.and.returnValue('light');
      service = TestBed.inject(ThemeService);
    });

    it('should update isDarkMode signal when theme changes', fakeAsync(() => {
      expect(service.isDarkMode()).toBe(false);
      
      service.setTheme('dark');
      tick();
      
      expect(service.isDarkMode()).toBe(true);
    }));

    it('should update isDarkMode signal when toggling', fakeAsync(() => {
      expect(service.isDarkMode()).toBe(false);
      
      service.toggleTheme();
      tick();
      expect(service.isDarkMode()).toBe(true);
      
      service.toggleTheme();
      tick();
      expect(service.isDarkMode()).toBe(false);
    }));

    it('should maintain signal reactivity across multiple changes', fakeAsync(() => {
      service.setTheme('dark');
      tick();
      expect(service.isDarkMode()).toBe(true);
      
      service.setTheme('light');
      tick();
      expect(service.isDarkMode()).toBe(false);
      
      service.toggleTheme();
      tick();
      expect(service.isDarkMode()).toBe(true);
    }));
  });

  describe('persistence', () => {
    beforeEach(() => {
      storageService.getItem.and.returnValue('light');
      service = TestBed.inject(ThemeService);
    });

    it('should persist theme changes to localStorage', fakeAsync(() => {
      service.setTheme('dark');
      tick();
      
      expect(storageService.setItem).toHaveBeenCalledWith('app-theme', 'dark');
    }));

    it('should load persisted theme on next initialization', () => {
      // Simulate loading a new service instance with persisted dark theme
      storageService.getItem.and.returnValue('dark');
      const newService = TestBed.inject(ThemeService);
      
      expect(newService.currentTheme()).toBe('dark');
      expect(newService.isDarkMode()).toBe(true);
    });
  });
});
