import { test, expect } from '@playwright/test';

test.describe('URL Preview Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
  });

  test('should display placeholder when no URL is entered', async ({ page }) => {
    // Check that the preview component exists
    const preview = page.locator('app-url-preview');
    await expect(preview).toBeVisible();

    // Should show placeholder text
    await expect(preview.getByText('Enter a valid Base URL to see the preview')).toBeVisible();
  });

  test('should display URL preview when valid base URL is entered', async ({ page }) => {
    // Enter a valid base URL
    const baseUrlInput = page.locator('#baseUrl');
    await baseUrlInput.fill('https://example.com');

    // Wait for the preview to update
    await page.waitForTimeout(500);

    // Check that the URL is displayed
    const urlDisplay = page.locator('.url-display');
    await expect(urlDisplay).toBeVisible();
    await expect(urlDisplay).toContainText('https://example.com');

    // Check that character count is displayed
    const charCount = page.locator('.char-count');
    await expect(charCount).toBeVisible();
    await expect(charCount).toContainText('Characters:');

    // Check that parameter count is displayed
    const paramCount = page.locator('.param-count');
    await expect(paramCount).toBeVisible();
    await expect(paramCount).toContainText('Parameters: 0');
  });

  test('should update preview when UTM parameters are added', async ({ page }) => {
    // Enter base URL
    await page.locator('#baseUrl').fill('https://example.com');

    // Enter UTM parameters
    await page.locator('#utmSource').fill('google');
    await page.locator('#utmMedium').fill('cpc');
    await page.locator('#utmCampaign').fill('summer_sale');

    // Wait for the preview to update
    await page.waitForTimeout(500);

    // Check that the URL includes UTM parameters
    const urlDisplay = page.locator('.url-display');
    await expect(urlDisplay).toContainText('utm_source=google');
    await expect(urlDisplay).toContainText('utm_medium=cpc');
    await expect(urlDisplay).toContainText('utm_campaign=summer_sale');

    // Check that parameter count is updated
    const paramCount = page.locator('.param-count');
    await expect(paramCount).toContainText('Parameters: 3');
  });

  test('should have copy and save buttons', async ({ page }) => {
    // Enter a valid base URL
    const baseUrlInput = page.locator('#baseUrl');
    await baseUrlInput.fill('https://example.com');
    await baseUrlInput.blur(); // Trigger form validation

    // Wait for the preview to update
    await page.waitForTimeout(500);

    // Verify the preview is showing (buttons are inside the @if block)
    const urlDisplay = page.locator('.url-display');
    await expect(urlDisplay).toBeVisible();

    // Check that Copy button exists and is visible
    const copyButton = page.getByRole('button', { name: /copy url/i });
    await expect(copyButton).toBeVisible();

    // Check that Save button exists in the DOM (it may be disabled if form is invalid)
    const saveButton = page.locator('button:has-text("Save Build")');
    await expect(saveButton).toBeAttached();
  });

  test('should show increasing character count as URL grows', async ({ page }) => {
    // Enter base URL
    await page.locator('#baseUrl').fill('https://example.com');
    await page.waitForTimeout(300);

    // Get initial character count
    const charCount = page.locator('.char-count');
    const initialText = await charCount.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');

    // Add a UTM parameter
    await page.locator('#utmSource').fill('google');
    await page.waitForTimeout(300);

    // Get updated character count
    const updatedText = await charCount.textContent();
    const updatedCount = parseInt(updatedText?.match(/\d+/)?.[0] || '0');

    // Character count should have increased
    expect(updatedCount).toBeGreaterThan(initialCount);
  });
});
