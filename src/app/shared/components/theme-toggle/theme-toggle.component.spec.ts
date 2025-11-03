/**
 * Unit tests for ThemeToggleComponent
 * Tests theme toggle functionality, accessibility, and user interactions
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from '../../../core/services/theme.service';
import { signal } from '@angular/core';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;
  let isDarkModeSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    // Create a signal for dark mode state
    isDarkModeSignal = signal(false);

    // Create mock ThemeService
    mockThemeService = jasmine.createSpyObj('ThemeService', ['toggleTheme'], {
      isDarkMode: isDarkModeSignal
    });

    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should inject ThemeService', () => {
      expect(component['themeService']).toBe(mockThemeService);
    });

    it('should expose isDarkMode signal from service', () => {
      expect(component.isDarkMode).toBe(isDarkModeSignal);
    });
  });

  describe('toggle functionality', () => {
    it('should call themeService.toggleTheme when onToggleTheme is called', () => {
      component.onToggleTheme();
      
      expect(mockThemeService.toggleTheme).toHaveBeenCalled();
    });

    it('should call themeService.toggleTheme exactly once per click', () => {
      component.onToggleTheme();
      component.onToggleTheme();
      component.onToggleTheme();
      
      expect(mockThemeService.toggleTheme).toHaveBeenCalledTimes(3);
    });
  });

  describe('template rendering', () => {
    it('should render toggle button', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
    });

    it('should have correct aria-label', () => {
      const button = fixture.nativeElement.querySelector('button');
      const ariaLabel = button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('mode');
    });

    it('should show sun icon in light mode', () => {
      isDarkModeSignal.set(false);
      fixture.detectChanges();
      
      const svg = fixture.nativeElement.querySelector('.theme-icon');
      expect(svg.classList.contains('theme-icon--sun')).toBe(true);
      expect(svg.classList.contains('theme-icon--moon')).toBe(false);
    });

    it('should show moon icon in dark mode', () => {
      isDarkModeSignal.set(true);
      fixture.detectChanges();
      
      const svg = fixture.nativeElement.querySelector('.theme-icon');
      expect(svg.classList.contains('theme-icon--moon')).toBe(true);
      expect(svg.classList.contains('theme-icon--sun')).toBe(false);
    });

    it('should have correct aria-pressed attribute in light mode', () => {
      isDarkModeSignal.set(false);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-pressed')).toBe('false');
    });

    it('should have correct aria-pressed attribute in dark mode', () => {
      isDarkModeSignal.set(true);
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('user interactions', () => {
    it('should toggle theme on button click', () => {
      const button = fixture.nativeElement.querySelector('button');
      button.click();
      
      expect(mockThemeService.toggleTheme).toHaveBeenCalled();
    });

    it('should handle multiple clicks', () => {
      const button = fixture.nativeElement.querySelector('button');
      button.click();
      button.click();
      
      expect(mockThemeService.toggleTheme).toHaveBeenCalledTimes(2);
    });
  });

  describe('accessibility', () => {
    it('should be keyboard accessible', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button.tabIndex).toBeGreaterThanOrEqual(0);
    });

    it('should have proper button type', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button.type).toBe('button');
    });

    it('should have title attribute', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button.title).toBeTruthy();
    });

    it('should update aria-label based on theme', () => {
      isDarkModeSignal.set(false);
      fixture.detectChanges();
      let button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-label')).toContain('dark');
      
      isDarkModeSignal.set(true);
      fixture.detectChanges();
      button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-label')).toContain('light');
    });
  });

  describe('signal reactivity', () => {
    it('should react to isDarkMode signal changes', () => {
      isDarkModeSignal.set(false);
      fixture.detectChanges();
      let button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-pressed')).toBe('false');
      
      isDarkModeSignal.set(true);
      fixture.detectChanges();
      button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-pressed')).toBe('true');
    });

    it('should update icon when isDarkMode changes', () => {
      isDarkModeSignal.set(false);
      fixture.detectChanges();
      let svg = fixture.nativeElement.querySelector('.theme-icon');
      expect(svg.classList.contains('theme-icon--sun')).toBe(true);
      
      isDarkModeSignal.set(true);
      fixture.detectChanges();
      svg = fixture.nativeElement.querySelector('.theme-icon');
      expect(svg.classList.contains('theme-icon--moon')).toBe(true);
    });
  });

  describe('CSS classes', () => {
    it('should have theme-toggle class', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('theme-toggle')).toBe(true);
    });

    it('should have theme-icon class on SVG', () => {
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.classList.contains('theme-icon')).toBe(true);
    });
  });

  describe('ariaLabel getter', () => {
    it('should return correct label for light mode', () => {
      isDarkModeSignal.set(false);
      expect(component.ariaLabel).toBe('Switch to dark mode');
    });

    it('should return correct label for dark mode', () => {
      isDarkModeSignal.set(true);
      expect(component.ariaLabel).toBe('Switch to light mode');
    });
  });
});
