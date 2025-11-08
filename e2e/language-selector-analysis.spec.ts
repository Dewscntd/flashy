/**
 * Language Selector Analysis Test
 *
 * Purpose: Capture screenshots of all language selector states to identify UI bugs
 * and styling inconsistencies before implementing glassmorphism design improvements.
 *
 * Test Coverage:
 * - Default/closed state (light + dark mode)
 * - Hover state (light + dark mode)
 * - Focus state with keyboard navigation (light + dark mode)
 * - Open/expanded state showing dropdown (light + dark mode)
 * - Each language option hover (English, Spanish, Hebrew)
 * - Selected state for each language
 * - RTL layout when Hebrew is selected
 */

import { test, expect, Page } from '@playwright/test';
import { join } from 'path';

const SCREENSHOT_DIR = join(__dirname, '../test-results/language-selector-screenshots');

test.describe('Language Selector - UI State Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for the development server to be ready
    await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });

    // The language switcher is wrapped in @defer (on interaction)
    // We need to trigger interaction to load it
    const placeholder = page.locator('.language-placeholder');
    if (await placeholder.isVisible()) {
      await placeholder.click();
      await page.waitForTimeout(300); // Allow defer block to load
    }

    // Wait for the language selector to be visible and stable
    const languageButton = page.locator('.language-toggle-button');
    await expect(languageButton).toBeVisible();
    await page.waitForTimeout(500); // Allow animations to settle
  });

  test.describe('Light Mode States', () => {
    test('01 - Default/Closed State (Light Mode)', async ({ page }) => {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/01-light-default-closed.png`,
        fullPage: false
      });

      // Capture just the language selector region
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.screenshot({
        path: `${SCREENSHOT_DIR}/01-light-default-closed-focused.png`
      });
    });

    test('02 - Hover State (Light Mode)', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');

      // Hover over the button
      await languageButton.hover();
      await page.waitForTimeout(300); // Allow hover transition

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/02-light-hover.png`,
        fullPage: false
      });

      await languageButton.screenshot({
        path: `${SCREENSHOT_DIR}/02-light-hover-focused.png`
      });
    });

    test('03 - Keyboard Focus State (Light Mode)', async ({ page }) => {
      // Use keyboard to focus the button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // May need multiple tabs to reach language selector

      // Find and focus the language button
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.focus();
      await page.waitForTimeout(300); // Allow focus transition

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-light-keyboard-focus.png`,
        fullPage: false
      });

      await languageButton.screenshot({
        path: `${SCREENSHOT_DIR}/03-light-keyboard-focus-focused.png`
      });

      // Verify focus indicator is visible
      const focusedButton = page.locator('.language-toggle-button:focus-visible');
      await expect(focusedButton).toBeVisible();
    });

    test('04 - Dropdown Open State (Light Mode)', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');

      // Click to open dropdown
      await languageButton.click();
      await page.waitForTimeout(300); // Allow dropdown animation

      // Verify dropdown is visible
      const dropdown = page.locator('.language-dropdown');
      await expect(dropdown).toBeVisible();

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/04-light-dropdown-open.png`,
        fullPage: false
      });

      // Capture the entire language switcher component with dropdown
      const languageSwitcher = page.locator('.language-switcher');
      await languageSwitcher.screenshot({
        path: `${SCREENSHOT_DIR}/04-light-dropdown-open-focused.png`
      });
    });

    test('05 - Dropdown Options Hover (Light Mode)', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.click();
      await page.waitForTimeout(300);

      const options = page.locator('.language-option');
      const optionCount = await options.count();

      // Capture hover state for each option
      for (let i = 0; i < optionCount; i++) {
        const option = options.nth(i);
        const optionText = await option.locator('.locale-native').textContent();

        await option.hover();
        await page.waitForTimeout(200);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/05-light-option-hover-${i}-${optionText?.toLowerCase()}.png`,
          fullPage: false
        });
      }
    });

    test('06 - Keyboard Navigation in Dropdown (Light Mode)', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.focus();

      // Open with keyboard
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Navigate down through options
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/06-light-keyboard-nav-option-0.png`,
        fullPage: false
      });

      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/06-light-keyboard-nav-option-1.png`,
        fullPage: false
      });

      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/06-light-keyboard-nav-option-2.png`,
        fullPage: false
      });
    });

    test('07 - Active/Selected State (Light Mode)', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.click();
      await page.waitForTimeout(300);

      // Capture the active/selected option
      const activeOption = page.locator('.language-option.active');
      await expect(activeOption).toBeVisible();

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/07-light-active-selected.png`,
        fullPage: false
      });

      await activeOption.screenshot({
        path: `${SCREENSHOT_DIR}/07-light-active-selected-focused.png`
      });
    });
  });

  test.describe('Dark Mode States', () => {
    test.beforeEach(async ({ page }) => {
      // Switch to dark mode
      const themeToggle = page.locator('.theme-toggle');
      await themeToggle.click();
      await page.waitForTimeout(500); // Allow theme transition
    });

    test('08 - Default/Closed State (Dark Mode)', async ({ page }) => {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/08-dark-default-closed.png`,
        fullPage: false
      });

      const languageButton = page.locator('.language-toggle-button');
      await languageButton.screenshot({
        path: `${SCREENSHOT_DIR}/08-dark-default-closed-focused.png`
      });
    });

    test('09 - Hover State (Dark Mode)', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.hover();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/09-dark-hover.png`,
        fullPage: false
      });

      await languageButton.screenshot({
        path: `${SCREENSHOT_DIR}/09-dark-hover-focused.png`
      });
    });

    test('10 - Keyboard Focus State (Dark Mode)', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.focus();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/10-dark-keyboard-focus.png`,
        fullPage: false
      });

      await languageButton.screenshot({
        path: `${SCREENSHOT_DIR}/10-dark-keyboard-focus-focused.png`
      });
    });

    test('11 - Dropdown Open State (Dark Mode)', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.language-dropdown');
      await expect(dropdown).toBeVisible();

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/11-dark-dropdown-open.png`,
        fullPage: false
      });

      const languageSwitcher = page.locator('.language-switcher');
      await languageSwitcher.screenshot({
        path: `${SCREENSHOT_DIR}/11-dark-dropdown-open-focused.png`
      });
    });

    test('12 - Dropdown Options Hover (Dark Mode)', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.click();
      await page.waitForTimeout(300);

      const options = page.locator('.language-option');
      const optionCount = await options.count();

      for (let i = 0; i < optionCount; i++) {
        const option = options.nth(i);
        const optionText = await option.locator('.locale-native').textContent();

        await option.hover();
        await page.waitForTimeout(200);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/12-dark-option-hover-${i}-${optionText?.toLowerCase()}.png`,
          fullPage: false
        });
      }
    });

    test('13 - Active/Selected State (Dark Mode)', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.click();
      await page.waitForTimeout(300);

      const activeOption = page.locator('.language-option.active');
      await expect(activeOption).toBeVisible();

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/13-dark-active-selected.png`,
        fullPage: false
      });

      await activeOption.screenshot({
        path: `${SCREENSHOT_DIR}/13-dark-active-selected-focused.png`
      });
    });
  });

  test.describe('Language Selection and RTL Testing', () => {
    test('14 - Select Spanish Language', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.click();
      await page.waitForTimeout(300);

      // Find and click Spanish option
      const spanishOption = page.locator('.language-option').filter({ hasText: 'Español' });
      await spanishOption.click();
      await page.waitForTimeout(500); // Allow language change and re-render

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/14-spanish-selected.png`,
        fullPage: true
      });

      // Verify the button shows "ES"
      const buttonText = await languageButton.textContent();
      expect(buttonText?.trim()).toMatch(/es/i);
    });

    test('15 - Select Hebrew and Test RTL Layout', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.click();
      await page.waitForTimeout(300);

      // Find and click Hebrew option
      const hebrewOption = page.locator('.language-option').filter({ hasText: 'עברית' });
      await hebrewOption.click();
      await page.waitForTimeout(500); // Allow language change and re-render

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/15-hebrew-selected-rtl-full.png`,
        fullPage: true
      });

      // Verify RTL layout is applied
      const htmlDir = await page.locator('html').getAttribute('dir');
      expect(htmlDir).toBe('rtl');

      // Capture language selector in RTL mode
      await languageButton.click();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/15-hebrew-rtl-dropdown-open.png`,
        fullPage: false
      });

      const languageSwitcher = page.locator('.language-switcher');
      await languageSwitcher.screenshot({
        path: `${SCREENSHOT_DIR}/15-hebrew-rtl-dropdown-focused.png`
      });
    });

    test('16 - RTL in Dark Mode', async ({ page }) => {
      // Switch to dark mode first
      const themeToggle = page.locator('.theme-toggle');
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Select Hebrew
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.click();
      await page.waitForTimeout(300);

      const hebrewOption = page.locator('.language-option').filter({ hasText: 'עברית' });
      await hebrewOption.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/16-hebrew-rtl-dark-full.png`,
        fullPage: true
      });

      // Open dropdown to show RTL in dark mode
      await languageButton.click();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/16-hebrew-rtl-dark-dropdown.png`,
        fullPage: false
      });
    });
  });

  test.describe('Accessibility and Touch Target Testing', () => {
    test('17 - Verify Touch Targets (Minimum 44x44px)', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');
      const buttonBox = await languageButton.boundingBox();

      expect(buttonBox).not.toBeNull();
      if (buttonBox) {
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      }

      // Open dropdown and check option touch targets
      await languageButton.click();
      await page.waitForTimeout(300);

      const options = page.locator('.language-option');
      const optionCount = await options.count();

      for (let i = 0; i < optionCount; i++) {
        const option = options.nth(i);
        const optionBox = await option.boundingBox();

        expect(optionBox).not.toBeNull();
        if (optionBox) {
          expect(optionBox.height).toBeGreaterThanOrEqual(44);
        }
      }

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/17-touch-targets-verified.png`,
        fullPage: false
      });
    });

    test('18 - Verify ARIA Attributes', async ({ page }) => {
      const languageButton = page.locator('.language-toggle-button');

      // Check closed state ARIA attributes
      const ariaExpanded = await languageButton.getAttribute('aria-expanded');
      expect(ariaExpanded).toBe('false');

      const ariaHasPopup = await languageButton.getAttribute('aria-haspopup');
      expect(ariaHasPopup).toBe('menu');

      const ariaLabel = await languageButton.getAttribute('aria-label');
      expect(ariaLabel).toContain('Change language');

      // Open dropdown and verify
      await languageButton.click();
      await page.waitForTimeout(300);

      const ariaExpandedOpen = await languageButton.getAttribute('aria-expanded');
      expect(ariaExpandedOpen).toBe('true');

      // Verify dropdown has role="menu"
      const dropdown = page.locator('.language-dropdown');
      const dropdownRole = await dropdown.getAttribute('role');
      expect(dropdownRole).toBe('menu');

      // Verify options have role="menuitem"
      const firstOption = page.locator('.language-option').first();
      const optionRole = await firstOption.getAttribute('role');
      expect(optionRole).toBe('menuitem');

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/18-aria-attributes-verified.png`,
        fullPage: false
      });
    });
  });

  test.describe('Dropdown Styling Issues Analysis', () => {
    test('19 - Compare Dropdown with App Design System', async ({ page }) => {
      // Capture the main app card for comparison
      const formCard = page.locator('.form-card').first();
      await formCard.screenshot({
        path: `${SCREENSHOT_DIR}/19-app-card-reference.png`
      });

      // Capture the language dropdown
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.language-dropdown');
      await dropdown.screenshot({
        path: `${SCREENSHOT_DIR}/19-dropdown-current-style.png`
      });

      // Capture both together for visual comparison
      const languageSwitcher = page.locator('.language-switcher');
      await languageSwitcher.screenshot({
        path: `${SCREENSHOT_DIR}/19-dropdown-vs-app-style.png`
      });

      // Get computed styles for analysis
      const dropdownStyles = await dropdown.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.background,
          backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
          borderRadius: computed.borderRadius,
          border: computed.border,
          boxShadow: computed.boxShadow
        };
      });

      console.log('Current Dropdown Styles:', dropdownStyles);

      const cardStyles = await formCard.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.background,
          backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
          borderRadius: computed.borderRadius,
          border: computed.border,
          boxShadow: computed.boxShadow
        };
      });

      console.log('App Card Styles (Reference):', cardStyles);
    });

    test('20 - Dark Mode Dropdown Comparison', async ({ page }) => {
      // Switch to dark mode
      const themeToggle = page.locator('.theme-toggle');
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Capture app card
      const formCard = page.locator('.form-card').first();
      await formCard.screenshot({
        path: `${SCREENSHOT_DIR}/20-dark-app-card-reference.png`
      });

      // Capture dropdown
      const languageButton = page.locator('.language-toggle-button');
      await languageButton.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.language-dropdown');
      await dropdown.screenshot({
        path: `${SCREENSHOT_DIR}/20-dark-dropdown-current-style.png`
      });
    });
  });
});
