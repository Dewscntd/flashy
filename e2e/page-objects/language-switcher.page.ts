/**
 * Page Object Model for Language Switcher Component
 *
 * Provides a clean, maintainable interface for interacting with the language
 * switcher component in E2E tests. Follows the Page Object pattern for better
 * test organization and reusability.
 */

import { Page, Locator, expect } from '@playwright/test';

export type SupportedLanguage = 'en' | 'he';

export interface LanguageOption {
  code: SupportedLanguage;
  nativeName: string;
  name: string;
}

export class LanguageSwitcherPage {
  readonly page: Page;
  readonly switcher: Locator;
  readonly button: Locator;
  readonly dropdown: Locator;
  readonly placeholder: Locator;

  constructor(page: Page) {
    this.page = page;
    this.switcher = page.locator('.language-switcher');
    this.button = page.locator('.language-toggle-button');
    this.dropdown = page.locator('.language-dropdown');
    this.placeholder = page.locator('.language-placeholder');
  }

  /**
   * Ensures the language switcher is loaded.
   * Handles the @defer block by triggering interaction if needed.
   */
  async ensureLoaded(): Promise<void> {
    if (await this.placeholder.isVisible()) {
      await this.placeholder.click();
      await this.page.waitForTimeout(300); // Allow defer block to load
    }
    await expect(this.button).toBeVisible();
  }

  /**
   * Opens the language dropdown
   */
  async open(): Promise<void> {
    await this.ensureLoaded();
    if (!(await this.dropdown.isVisible())) {
      await this.button.click();
      await this.page.waitForTimeout(300); // Allow animation
      await expect(this.dropdown).toBeVisible();
    }
  }

  /**
   * Closes the language dropdown
   */
  async close(): Promise<void> {
    if (await this.dropdown.isVisible()) {
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Gets all language options from the dropdown
   */
  async getLanguageOptions(): Promise<LanguageOption[]> {
    await this.open();
    const options = this.page.locator('.language-option');
    const count = await options.count();
    const languages: LanguageOption[] = [];

    for (let i = 0; i < count; i++) {
      const option = options.nth(i);
      const nativeName = await option.locator('.locale-native').textContent() || '';
      const name = await option.locator('.locale-name').textContent() || '';

      let code: SupportedLanguage = 'en';
      if (nativeName.includes('English')) code = 'en';
      else if (nativeName.includes('עברית')) code = 'he';

      languages.push({ code, nativeName, name: name.replace(/[()]/g, '').trim() });
    }

    return languages;
  }

  /**
   * Selects a language by code
   */
  async selectLanguage(code: SupportedLanguage): Promise<void> {
    await this.open();

    const optionSelector = {
      'en': 'English',
      'he': 'עברית'
    }[code];

    const option = this.page.locator('.language-option').filter({ hasText: optionSelector });
    await option.click();
    await this.page.waitForTimeout(500); // Allow language change
  }

  /**
   * Gets the currently selected language code
   */
  async getCurrentLanguage(): Promise<string> {
    await this.ensureLoaded();
    const text = await this.button.textContent();
    return text?.trim().toLowerCase() || '';
  }

  /**
   * Hovers over a specific language option
   */
  async hoverOption(index: number): Promise<void> {
    await this.open();
    const option = this.page.locator('.language-option').nth(index);
    await option.hover();
    await this.page.waitForTimeout(200); // Allow hover transition
  }

  /**
   * Uses keyboard navigation to select a language
   */
  async selectLanguageWithKeyboard(downArrowPresses: number): Promise<void> {
    await this.ensureLoaded();
    await this.button.focus();
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(300);

    for (let i = 0; i < downArrowPresses; i++) {
      await this.page.keyboard.press('ArrowDown');
      await this.page.waitForTimeout(100);
    }

    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  /**
   * Verifies the dropdown has glassmorphism styling
   */
  async verifyGlassmorphismStyles(): Promise<boolean> {
    await this.open();

    const styles = await this.dropdown.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
        background: computed.background,
        borderRadius: computed.borderRadius,
      };
    });

    return (
      styles.backdropFilter.includes('blur') &&
      styles.background.includes('linear-gradient') &&
      parseInt(styles.borderRadius) >= 12
    );
  }

  /**
   * Gets the active/selected option
   */
  async getActiveOption(): Promise<Locator> {
    await this.open();
    return this.page.locator('.language-option.active');
  }

  /**
   * Verifies ARIA attributes are correct
   */
  async verifyAccessibility(): Promise<void> {
    await this.ensureLoaded();

    // Check button ARIA attributes
    const ariaLabel = await this.button.getAttribute('aria-label');
    expect(ariaLabel).toContain('Change language');

    const ariaHasPopup = await this.button.getAttribute('aria-haspopup');
    expect(ariaHasPopup).toBe('menu');

    // Check closed state
    const ariaExpandedClosed = await this.button.getAttribute('aria-expanded');
    expect(ariaExpandedClosed).toBe('false');

    // Open and check expanded state
    await this.open();
    const ariaExpandedOpen = await this.button.getAttribute('aria-expanded');
    expect(ariaExpandedOpen).toBe('true');

    // Check dropdown role
    const dropdownRole = await this.dropdown.getAttribute('role');
    expect(dropdownRole).toBe('menu');

    // Check option roles
    const firstOption = this.page.locator('.language-option').first();
    const optionRole = await firstOption.getAttribute('role');
    expect(optionRole).toBe('menuitem');
  }

  /**
   * Verifies touch targets meet WCAG 2.1 AA (44x44px minimum)
   */
  async verifyTouchTargets(): Promise<void> {
    await this.ensureLoaded();

    // Check button touch target
    const buttonBox = await this.button.boundingBox();
    expect(buttonBox).not.toBeNull();
    if (buttonBox) {
      expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }

    // Check option touch targets
    await this.open();
    const options = this.page.locator('.language-option');
    const count = await options.count();

    for (let i = 0; i < count; i++) {
      const optionBox = await options.nth(i).boundingBox();
      expect(optionBox).not.toBeNull();
      if (optionBox) {
        expect(optionBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  }

  /**
   * Takes a screenshot of the language switcher
   */
  async screenshot(path: string): Promise<void> {
    await this.ensureLoaded();
    await this.switcher.screenshot({ path });
  }

  /**
   * Takes a screenshot of just the dropdown
   */
  async screenshotDropdown(path: string): Promise<void> {
    await this.open();
    await this.dropdown.screenshot({ path });
  }
}
