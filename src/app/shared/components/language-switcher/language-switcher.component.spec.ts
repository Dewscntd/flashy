/**
 * Unit tests for LanguageSwitcherComponent
 * Tests language selection and dropdown functionality.
 * Focus: User interactions, locale switching, dropdown state.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { TranslationService } from '../../../core/services/translation.service';
import { signal } from '@angular/core';
import { SUPPORTED_LOCALES } from '../../../core/models/i18n.model';

describe('LanguageSwitcherComponent', () => {
  let component: LanguageSwitcherComponent;
  let fixture: ComponentFixture<LanguageSwitcherComponent>;
  let translationService: jasmine.SpyObj<TranslationService>;
  let currentLocaleSignal: ReturnType<typeof signal<'en' | 'he'>>;

  beforeEach(async () => {
    currentLocaleSignal = signal<'en' | 'he'>('en');

    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['setLocale', 'instant'], {
      locale$: currentLocaleSignal.asReadonly(),
      supportedLocales: SUPPORTED_LOCALES
    });

    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: [
        { provide: TranslationService, useValue: translationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    component = fixture.componentInstance;
    translationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;

    translationService.setLocale.and.returnValue(Promise.resolve());
    translationService.instant.and.callFake((key: string) => key);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('currentLocaleName', () => {
    it('should return native name for current locale', () => {
      currentLocaleSignal.set('en');

      const result = component.currentLocaleName();

      expect(result).toBe('English');
    });

    it('should return Hebrew name for Hebrew locale', () => {
      currentLocaleSignal.set('he');

      const result = component.currentLocaleName();

      expect(result).toBe('עברית');
    });

    it('should return locale code if metadata not found', () => {
      // Simulate an unknown locale by creating a new signal
      const unknownLocaleSignal = signal('unknown' as any);
      (component as any).currentLocale = unknownLocaleSignal.asReadonly();

      const result = component.currentLocaleName();

      expect(result).toBe('unknown');
    });
  });

  describe('toggleDropdown', () => {
    it('should toggle dropdown from closed to open', () => {
      expect(component.isOpen()).toBe(false);

      component.toggleDropdown();

      expect(component.isOpen()).toBe(true);
    });

    it('should toggle dropdown from open to closed', () => {
      component.isOpen.set(true);

      component.toggleDropdown();

      expect(component.isOpen()).toBe(false);
    });

    it('should toggle multiple times', () => {
      component.toggleDropdown();
      expect(component.isOpen()).toBe(true);

      component.toggleDropdown();
      expect(component.isOpen()).toBe(false);

      component.toggleDropdown();
      expect(component.isOpen()).toBe(true);
    });
  });

  describe('selectLocale', () => {
    it('should call translation service to set locale', async () => {
      await component.selectLocale('he');

      expect(translationService.setLocale).toHaveBeenCalledWith('he');
    });

    it('should close dropdown after selecting locale', async () => {
      component.isOpen.set(true);

      await component.selectLocale('he');

      expect(component.isOpen()).toBe(false);
    });

    it('should handle English locale selection', async () => {
      await component.selectLocale('en');

      expect(translationService.setLocale).toHaveBeenCalledWith('en');
      expect(component.isOpen()).toBe(false);
    });

    it('should close dropdown even if setLocale is slow', async () => {
      component.isOpen.set(true);
      let resolveSetLocale: () => void;
      const slowPromise = new Promise<void>((resolve) => {
        resolveSetLocale = resolve;
      });
      translationService.setLocale.and.returnValue(slowPromise);

      const selectPromise = component.selectLocale('he');

      // Dropdown should close before promise resolves
      await selectPromise;
      expect(component.isOpen()).toBe(false);

      resolveSetLocale!();
    });
  });

  describe('supportedLocales', () => {
    it('should expose supported locales from translation service', () => {
      expect(component.supportedLocales).toBe(SUPPORTED_LOCALES);
      expect(component.supportedLocales.length).toBe(2);
    });

    it('should include English locale', () => {
      const englishLocale = component.supportedLocales.find(l => l.code === 'en');

      expect(englishLocale).toBeDefined();
      expect(englishLocale?.nativeName).toBe('English');
    });

    it('should include Hebrew locale', () => {
      const hebrewLocale = component.supportedLocales.find(l => l.code === 'he');

      expect(hebrewLocale).toBeDefined();
      expect(hebrewLocale?.nativeName).toBe('עברית');
    });
  });
});
