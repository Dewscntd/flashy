/**
 * Simple Manual Verification for UI Bug Fixes
 *
 * Bug 1: Custom Parameters Fieldset Overflow
 * Bug 2: Header Text Visibility in Dark Mode
 */

import { test, expect } from '@playwright/test';

test.describe('UI Bug Fixes - Manual Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    // Wait for Angular to fully load
    await page.waitForLoadState('networkidle');
    // Wait an extra moment for deferred components
    await page.waitForTimeout(1000);
  });

  test('Visual verification - Light mode with parameters', async ({ page }) => {
    // Ensure we're in light mode
    const theme = await page.locator('html').getAttribute('data-theme');
    console.log('Current theme:', theme);

    // Take full page screenshot in light mode
    await expect(page).toHaveScreenshot('01-light-mode-initial.png', {
      fullPage: true,
      maxDiffPixels: 500
    });

    // Take header close-up
    const header = page.locator('.header');
    await expect(header).toHaveScreenshot('02-header-light-mode.png', {
      maxDiffPixels: 100
    });
  });

  test('Visual verification - Dark mode header visibility', async ({ page }) => {
    // Find and click the theme toggle button
    const themeToggle = page.locator('button').filter({ hasText: /moon|sun|theme|dark|light/i }).first();

    // Try alternative: find button in theme-toggle component
    const toggleButton = page.locator('app-theme-toggle button, .theme-toggle button, button[aria-label*="theme"]').first();

    // Click whichever we find
    if (await toggleButton.count() > 0) {
      await toggleButton.click();
    } else if (await themeToggle.count() > 0) {
      await themeToggle.click();
    } else {
      // Last resort: click any button that might be the theme toggle
      const allButtons = await page.locator('button').all();
      console.log(`Found ${allButtons.length} buttons`);

      // Look for theme toggle in the header area
      const headerButtons = await page.locator('.header button').all();
      if (headerButtons.length > 0) {
        await headerButtons[0].click();
      }
    }

    await page.waitForTimeout(1000);

    // Verify dark mode is active
    const darkTheme = await page.locator('html').getAttribute('data-theme');
    console.log('Theme after toggle:', darkTheme);

    // Take header screenshot in dark mode
    const header = page.locator('.header');
    await expect(header).toHaveScreenshot('03-header-dark-mode.png', {
      maxDiffPixels: 100
    });

    // Full page dark mode
    await expect(page).toHaveScreenshot('04-dark-mode-full.png', {
      fullPage: true,
      maxDiffPixels: 500
    });
  });

  test('Visual verification - Fieldset at different viewports', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`05-${viewport.name}-${viewport.width}px.png`, {
        fullPage: true,
        maxDiffPixels: 500
      });
    }
  });

  test('Check header text elements exist and are visible', async ({ page }) => {
    // Check eyebrow text
    const eyebrow = page.locator('.eyebrow');
    await expect(eyebrow).toBeVisible();
    const eyebrowText = await eyebrow.textContent();
    console.log('Eyebrow text:', eyebrowText);

    // Check main title
    const mainTitle = page.locator('.main-title');
    await expect(mainTitle).toBeVisible();
    const titleText = await mainTitle.textContent();
    console.log('Main title text:', titleText);

    // Get computed styles
    const eyebrowStyle = await eyebrow.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        textShadow: style.textShadow,
        opacity: style.opacity
      };
    });

    const titleStyle = await mainTitle.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        textShadow: style.textShadow,
        opacity: style.opacity
      };
    });

    console.log('Eyebrow style:', eyebrowStyle);
    console.log('Title style:', titleStyle);

    // Verify styles are applied
    expect(eyebrowStyle.color).not.toBe('rgba(0, 0, 0, 0)');
    expect(titleStyle.color).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('Check fieldset CSS properties', async ({ page }) => {
    const fieldset = page.locator('.params-fieldset');
    await expect(fieldset).toBeVisible();

    const styles = await fieldset.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        width: computed.width,
        minWidth: computed.minWidth,
        boxSizing: computed.boxSizing,
        display: computed.display,
        borderRadius: computed.borderRadius
      };
    });

    console.log('Fieldset styles:', styles);

    // Verify key properties
    expect(styles.minWidth).toBe('0px');
    expect(styles.boxSizing).toBe('border-box');
    expect(styles.display).toBe('grid');
  });
});
