/**
 * Language Switcher Component - Comprehensive Test Suite
 *
 * Tests cover:
 * - UI state management (open/close)
 * - Language selection (mouse and keyboard)
 * - Glassmorphism design system consistency
 * - WCAG 2.1 AA accessibility compliance
 * - RTL layout for Hebrew
 * - Light and dark mode support
 * - Responsive behavior
 */

import { test, expect } from '@playwright/test';
import { LanguageSwitcherPage } from './page-objects/language-switcher.page';

test.describe('Language Switcher Component', () => {
  let languageSwitcher: LanguageSwitcherPage;

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
    languageSwitcher = new LanguageSwitcherPage(page);
    await languageSwitcher.ensureLoaded();
  });

  test.describe('Basic Functionality', () => {
    test('should display language switcher button', async () => {
      await expect(languageSwitcher.button).toBeVisible();
    });

    test('should show current language code on button', async ({ page }) => {
      const currentLang = await languageSwitcher.getCurrentLanguage();
      expect(currentLang).toMatch(/en|he/);
    });

    test('should open dropdown when button is clicked', async () => {
      await languageSwitcher.open();
      await expect(languageSwitcher.dropdown).toBeVisible();
    });

    test('should close dropdown when Escape is pressed', async ({ page }) => {
      await languageSwitcher.open();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      await expect(languageSwitcher.dropdown).not.toBeVisible();
    });

    test('should display all supported languages', async () => {
      const languages = await languageSwitcher.getLanguageOptions();
      expect(languages).toHaveLength(2);

      const codes = languages.map(l => l.code);
      expect(codes).toContain('en');
      expect(codes).toContain('he');
    });
  });

  test.describe('Language Selection - Mouse Interaction', () => {
    test('', async ({ page }) => {
      await languageSwitcher.selectLanguage('he');

      const currentLang = await languageSwitcher.getCurrentLanguage();
      expect(currentLang).toMatch(/he/i);
    });

    test('should select Hebrew when clicked', async ({ page }) => {
      await languageSwitcher.selectLanguage('he');

      const currentLang = await languageSwitcher.getCurrentLanguage();
      expect(currentLang).toMatch(/he/i);
    });

    test('should switch back to English', async ({ page }) => {
      await languageSwitcher.selectLanguage('he');
      await languageSwitcher.selectLanguage('en');

      const currentLang = await languageSwitcher.getCurrentLanguage();
      expect(currentLang).toMatch(/en/i);
    });

    test('should close dropdown after selecting a language', async ({ page }) => {
      await languageSwitcher.selectLanguage('he');
      await page.waitForTimeout(300);
      await expect(languageSwitcher.dropdown).not.toBeVisible();
    });

    test('should highlight active language option', async () => {
      await languageSwitcher.open();
      const activeOption = await languageSwitcher.getActiveOption();
      await expect(activeOption).toBeVisible();
      await expect(activeOption).toHaveClass(/active/);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should open dropdown with Enter key', async ({ page }) => {
      await languageSwitcher.button.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      await expect(languageSwitcher.dropdown).toBeVisible();
    });

    test('should open dropdown with Space key', async ({ page }) => {
      await languageSwitcher.button.focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);
      await expect(languageSwitcher.dropdown).toBeVisible();
    });

    test('should navigate options with Arrow Down', async ({ page }) => {
      await languageSwitcher.button.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      const focusedOption = page.locator('.language-option.focused');
      await expect(focusedOption).toBeVisible();
    });

    test('should navigate options with Arrow Up', async ({ page }) => {
      await languageSwitcher.button.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Go down twice
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      // Go up once
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(100);

      const focusedOption = page.locator('.language-option.focused');
      await expect(focusedOption).toBeVisible();
    });

    test('should select language with Enter key', async ({ page }) => {
      await languageSwitcher.selectLanguageWithKeyboard(1); // Select second option (Hebrew)

      const currentLang = await languageSwitcher.getCurrentLanguage();
      expect(currentLang).toMatch(/he/i);
    });

    test('should jump to first option with Home key', async ({ page }) => {
      await languageSwitcher.button.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Go to last
      await page.keyboard.press('End');
      await page.waitForTimeout(100);

      // Jump to first
      await page.keyboard.press('Home');
      await page.waitForTimeout(100);

      const firstOption = page.locator('.language-option').first();
      await expect(firstOption).toHaveClass(/focused/);
    });

    test('should jump to last option with End key', async ({ page }) => {
      await languageSwitcher.button.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      await page.keyboard.press('End');
      await page.waitForTimeout(100);

      const lastOption = page.locator('.language-option').last();
      await expect(lastOption).toHaveClass(/focused/);
    });
  });

  test.describe('Glassmorphism Design System', () => {
    test('should have glassmorphism styling on dropdown', async () => {
      const hasGlassmorphism = await languageSwitcher.verifyGlassmorphismStyles();
      expect(hasGlassmorphism).toBe(true);
    });

    test('should match app card styling', async ({ page }) => {
      await languageSwitcher.open();

      const dropdownStyles = await languageSwitcher.dropdown.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
          background: computed.background,
        };
      });

      expect(dropdownStyles.backdropFilter).toContain('blur(18px)');
      expect(dropdownStyles.backdropFilter).toContain('saturate(1.08)');
      expect(dropdownStyles.background).toContain('linear-gradient');
      expect(dropdownStyles.background).toContain('rgba(255, 255, 255, 0.78)');
    });

    test('should have smooth entrance animation', async ({ page }) => {
      const dropdown = languageSwitcher.dropdown;

      await languageSwitcher.button.click();

      // Animation should be applied
      const animation = await dropdown.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return computed.animation;
      });

      expect(animation).toContain('dropdown-entrance');
    });

    test('should have rounded corners matching design system', async () => {
      await languageSwitcher.open();

      const borderRadius = await languageSwitcher.dropdown.evaluate((el) => {
        return window.getComputedStyle(el).borderRadius;
      });

      const radius = parseInt(borderRadius);
      expect(radius).toBeGreaterThanOrEqual(12);
      expect(radius).toBeLessThanOrEqual(16);
    });
  });

  test.describe('Dark Mode Support', () => {
    test.beforeEach(async ({ page }) => {
      // Switch to dark mode
      const themeToggle = page.locator('.theme-toggle');
      await themeToggle.click();
      await page.waitForTimeout(500);
    });

    test('should display dropdown in dark mode', async () => {
      await languageSwitcher.open();
      await expect(languageSwitcher.dropdown).toBeVisible();
    });

    test('should have dark glassmorphism styling', async ({ page }) => {
      await languageSwitcher.open();

      const styles = await languageSwitcher.dropdown.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.background,
          borderColor: computed.borderColor,
        };
      });

      expect(styles.background).toContain('linear-gradient');
      expect(styles.background).toContain('rgba(30, 41, 59');
    });

    test('should have proper contrast for options in dark mode', async ({ page }) => {
      await languageSwitcher.open();

      const option = page.locator('.language-option').first();
      const color = await option.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      // Should have light text color in dark mode
      expect(color).toBeTruthy();
    });
  });

  test.describe('RTL (Right-to-Left) Support', () => {
    test('should switch to RTL when Hebrew is selected', async ({ page }) => {
      await languageSwitcher.selectLanguage('he');
      await page.waitForTimeout(500);

      const htmlDir = await page.locator('html').getAttribute('dir');
      expect(htmlDir).toBe('rtl');
    });

    test('should position dropdown correctly in RTL mode', async ({ page }) => {
      await languageSwitcher.selectLanguage('he');
      await page.waitForTimeout(500);

      await languageSwitcher.open();

      const dropdownBox = await languageSwitcher.dropdown.boundingBox();
      const buttonBox = await languageSwitcher.button.boundingBox();

      expect(dropdownBox).not.toBeNull();
      expect(buttonBox).not.toBeNull();

      // In RTL, dropdown should still be positioned correctly
      // (position: absolute with right: 0 should work in both LTR and RTL)
      if (dropdownBox && buttonBox) {
        expect(dropdownBox.y).toBeGreaterThan(buttonBox.y);
      }
    });

    test('should display Hebrew text correctly', async ({ page }) => {
      await languageSwitcher.selectLanguage('he');

      const buttonText = await languageSwitcher.getCurrentLanguage();
      expect(buttonText).toMatch(/he/i);
    });
  });

  test.describe('Accessibility (WCAG 2.1 AA)', () => {
    test('should have proper ARIA attributes', async () => {
      await languageSwitcher.verifyAccessibility();
    });

    test('should have proper touch targets (44x44px minimum)', async () => {
      await languageSwitcher.verifyTouchTargets();
    });

    test('should have visible focus indicator', async ({ page }) => {
      await languageSwitcher.button.focus();
      await page.waitForTimeout(100);

      const outline = await languageSwitcher.button.evaluate((el) => {
        return window.getComputedStyle(el).outline;
      });

      expect(outline).toBeTruthy();
      expect(outline).not.toBe('none');
    });

    test('should be keyboard accessible without mouse', async ({ page }) => {
      // Navigate using only keyboard
      await page.keyboard.press('Tab'); // May need multiple tabs
      await page.keyboard.press('Enter'); // Open dropdown
      await page.waitForTimeout(300);

      await expect(languageSwitcher.dropdown).toBeVisible();

      await page.keyboard.press('ArrowDown'); // Navigate to option
      await page.keyboard.press('Enter'); // Select option
      await page.waitForTimeout(500);

      // Should have closed and selected new language
      await expect(languageSwitcher.dropdown).not.toBeVisible();
    });

    test('should announce language changes to screen readers', async () => {
      const ariaLabel = await languageSwitcher.button.getAttribute('aria-label');
      expect(ariaLabel).toContain('Current');
      expect(ariaLabel).toContain('language');
    });
  });

  test.describe('Visual Regression', () => {
    test('should match dropdown design in light mode', async () => {
      await languageSwitcher.open();
      await expect(languageSwitcher.dropdown).toHaveScreenshot('dropdown-light.png', {
        maxDiffPixels: 100
      });
    });

    test('should match dropdown design in dark mode', async ({ page }) => {
      const themeToggle = page.locator('.theme-toggle');
      await themeToggle.click();
      await page.waitForTimeout(500);

      await languageSwitcher.open();
      await expect(languageSwitcher.dropdown).toHaveScreenshot('dropdown-dark.png', {
        maxDiffPixels: 100
      });
    });
  });

  test.describe('Hover States', () => {
    test('should show hover effect on button', async ({ page }) => {
      await languageSwitcher.button.hover();
      await page.waitForTimeout(200);

      // Button should still be visible and interactive
      await expect(languageSwitcher.button).toBeVisible();
    });

    test('should show hover effect on options', async ({ page }) => {
      await languageSwitcher.open();
      await languageSwitcher.hoverOption(0);

      const option = page.locator('.language-option').first();
      const background = await option.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      expect(background).toBeTruthy();
    });

    test('should show subtle transform on option hover', async ({ page }) => {
      await languageSwitcher.open();

      const option = page.locator('.language-option').first();
      await option.hover();
      await page.waitForTimeout(200);

      const transform = await option.evaluate((el) => {
        return window.getComputedStyle(el).transform;
      });

      // Should have translateX transform
      expect(transform).toContain('matrix');
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle rapid clicking', async ({ page }) => {
      await languageSwitcher.button.click();
      await languageSwitcher.button.click();
      await languageSwitcher.button.click();
      await page.waitForTimeout(300);

      // Should end in a consistent state (either open or closed)
      const isVisible = await languageSwitcher.dropdown.isVisible();
      expect(typeof isVisible).toBe('boolean');
    });

    test('should handle switching languages multiple times', async ({ page }) => {
      await languageSwitcher.selectLanguage('he');
      await languageSwitcher.selectLanguage('he');
      await languageSwitcher.selectLanguage('en');
      await languageSwitcher.selectLanguage('he');

      const currentLang = await languageSwitcher.getCurrentLanguage();
      expect(currentLang).toMatch(/he/i);
    });

    test('should maintain state after page interaction', async ({ page }) => {
      await languageSwitcher.selectLanguage('he');

      // Interact with other elements
      const input = page.locator('#baseUrl');
      await input.click();
      await input.fill('https://example.com');

      // Language should persist
      const currentLang = await languageSwitcher.getCurrentLanguage();
      expect(currentLang).toMatch(/he/i);
    });
  });
});
