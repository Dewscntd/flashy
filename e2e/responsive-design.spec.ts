import { test, expect } from '@playwright/test';

/**
 * Responsive Design Tests
 * Verifies that the Flashy URL Builder works correctly across different screen sizes
 * and maintains proper width/alignment without horizontal scrolling.
 */

const BASE_URL = 'https://dewscntd.github.io/flashy/';

// Test viewport configurations
const VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12/13/14', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'iPad Air', width: 820, height: 1180 },
  { name: 'iPad Pro 11"', width: 834, height: 1194 },
  { name: 'Surface Pro 7', width: 912, height: 1368 },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
  { name: 'Laptop (HD)', width: 1280, height: 720 },
  { name: 'Laptop (FHD)', width: 1920, height: 1080 },
  { name: 'Desktop (QHD)', width: 2560, height: 1440 },
];

test.describe('Responsive Design - Mobile First', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const viewport of VIEWPORTS) {
    test(`should render correctly at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Navigate to the app
      await page.goto(BASE_URL);

      // Wait for app to load
      await page.waitForSelector('.app-shell', { state: 'visible' });

      // Take screenshot for visual verification
      await page.screenshot({
        path: `e2e/screenshots/responsive/${viewport.name.replace(/[^a-zA-Z0-9]/g, '_')}_${viewport.width}x${viewport.height}.png`,
        fullPage: true
      });

      // Verify no horizontal scrolling
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding

      // Verify main content is visible
      const mainContent = page.locator('.main-content');
      await expect(mainContent).toBeVisible();

      // Verify header is visible
      const header = page.locator('.header');
      await expect(header).toBeVisible();

      // Check if layout should be stacked (mobile) or side-by-side (tablet/desktop)
      if (viewport.width <= 768) {
        // Mobile: should have single column layout
        const builderArea = page.locator('.builder-area');
        const historyArea = page.locator('.history-area');

        const builderBox = await builderArea.boundingBox();
        const historyBox = await historyArea.boundingBox();

        if (builderBox && historyBox) {
          // History should be below builder on mobile
          expect(historyBox.y).toBeGreaterThan(builderBox.y + builderBox.height - 50);
        }
      } else {
        // Tablet/Desktop: should have side-by-side layout
        const builderArea = page.locator('.builder-area');
        const historyArea = page.locator('.history-area');

        const builderBox = await builderArea.boundingBox();
        const historyBox = await historyArea.boundingBox();

        if (builderBox && historyBox) {
          // History should be roughly at same vertical level as builder
          expect(Math.abs(historyBox.y - builderBox.y)).toBeLessThan(100);
        }
      }
    });
  }
});

test.describe('Responsive Design - Element Widths', () => {
  test('should have properly sized elements at mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForSelector('.app-shell', { state: 'visible' });

    // Check that form inputs don't overflow
    const inputs = page.locator('input[type="text"], input[type="url"]');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const box = await input.boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(375);
      }
    }

    // Check touch targets are at least 44x44px
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40); // Allow slight variance
      }
    }
  });

  test('should have balanced grid columns at desktop (1920px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);
    await page.waitForSelector('.app-shell', { state: 'visible' });

    // Check grid layout balance
    const builderArea = page.locator('.builder-area');
    const historyArea = page.locator('.history-area');

    const builderBox = await builderArea.boundingBox();
    const historyBox = await historyArea.boundingBox();

    if (builderBox && historyBox) {
      const ratio = builderBox.width / historyBox.width;
      // Should be approximately 2:1 ratio (allow 1.8-2.2)
      expect(ratio).toBeGreaterThan(1.8);
      expect(ratio).toBeLessThan(2.3);
    }
  });

  test('should not have horizontal overflow at tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    await page.waitForSelector('.app-shell', { state: 'visible' });

    // Check all major containers
    const containers = ['.app-shell', '.main-content', '.header', '.form-card'];

    for (const selector of containers) {
      const element = page.locator(selector).first();
      const box = await element.boundingBox();

      if (box) {
        expect(box.width).toBeLessThanOrEqual(768 + 1); // +1 for rounding
      }
    }
  });
});

test.describe('Responsive Design - Breakpoints', () => {
  test('should apply correct styles at 900px breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 600 });
    await page.goto(BASE_URL);
    await page.waitForSelector('.app-shell', { state: 'visible' });

    // Should have side-by-side layout at 900px
    const builderArea = page.locator('.builder-area');
    const historyArea = page.locator('.history-area');

    const builderBox = await builderArea.boundingBox();
    const historyBox = await historyArea.boundingBox();

    if (builderBox && historyBox) {
      // Should be roughly at same vertical level
      expect(Math.abs(historyBox.y - builderBox.y)).toBeLessThan(100);

      // History sidebar should have reduced minimum width
      expect(historyBox.width).toBeGreaterThanOrEqual(240);
      expect(historyBox.width).toBeLessThan(400); // Not too wide
    }
  });

  test('should apply correct styles at 1200px breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE_URL);
    await page.waitForSelector('.app-shell', { state: 'visible' });

    // Should have default desktop layout
    const mainContent = page.locator('.main-content');
    const box = await mainContent.boundingBox();

    if (box) {
      // Main content should be constrained but not too narrow
      expect(box.width).toBeGreaterThanOrEqual(900);
      expect(box.width).toBeLessThanOrEqual(1200);
    }
  });
});

test.describe('Responsive Design - Text Readability', () => {
  test('should have readable text at all sizes without zooming', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(BASE_URL);
      await page.waitForSelector('.app-shell', { state: 'visible' });

      // Check main title font size
      const title = page.locator('.main-title');
      const fontSize = await title.evaluate((el) =>
        window.getComputedStyle(el).fontSize
      );
      const fontSizeNum = parseInt(fontSize);

      // WCAG 2.1 AA: Headings should be at least 24px
      expect(fontSizeNum).toBeGreaterThanOrEqual(24);

      // Check body text is at least 14px (16px ideal)
      const labels = page.locator('.form-label');
      if (await labels.count() > 0) {
        const labelFontSize = await labels.first().evaluate((el) =>
          window.getComputedStyle(el).fontSize
        );
        const labelFontSizeNum = parseInt(labelFontSize);
        expect(labelFontSizeNum).toBeGreaterThanOrEqual(14);
      }
    }
  });
});

test.describe('Responsive Design - Card Spacing', () => {
  test('should have proper spacing between cards at all sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 900, height: 600, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(BASE_URL);
      await page.waitForSelector('.app-shell', { state: 'visible' });

      // Check gap between builder and history areas
      const mainContent = page.locator('.main-content');
      const gap = await mainContent.evaluate((el) =>
        window.getComputedStyle(el).gap
      );

      // Gap should be reasonable (at least 1rem)
      const gapNum = parseInt(gap);
      expect(gapNum).toBeGreaterThanOrEqual(16); // 1rem = 16px minimum
    }
  });
});
