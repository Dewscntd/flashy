
import { test, expect } from '@playwright/test';

test.describe('URL Builder E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/');
  });

  test('should build a URL with UTM parameters', async ({ page }) => {
    const baseUrl = 'https://example.com';
    const utmSource = 'google';
    const utmMedium = 'cpc';

    // Fill in the form
    await page.locator('#baseUrl').fill(baseUrl);
    await page.locator('#utmSource').fill(utmSource);
    await page.locator('#utmMedium').fill(utmMedium);

    // Check the live preview using a more robust locator
    const expectedUrl = `https://example.com/?utm_source=${utmSource}&utm_medium=${utmMedium}`;
    await expect(page.getByText(expectedUrl)).toBeVisible();

    // Check the character count
    await expect(page.getByText('Character count: 52')).toBeVisible();
  });

  test('should add and remove dynamic parameters', async ({ page }) => {
    await page.locator('#baseUrl').fill('https://example.com');

    // Add a parameter
    await page.getByRole('button', { name: '+ Add Parameter' }).click();

    // Fill the new parameter
    await page.locator('.param-group input[formControlName="key"]').fill('foo');
    await page.locator('.param-group input[formControlName="value"]').fill('bar');

    // Check the live preview
    await expect(page.getByText('https://example.com/?foo=bar')).toBeVisible();

    // Add another parameter
    await page.getByRole('button', { name: '+ Add Parameter' }).click();
    await page.locator('.param-group').last().locator('input[formControlName="key"]').fill('baz');
    await page.locator('.param-group').last().locator('input[formControlName="value"]').fill('qux');
    await expect(page.getByText('https://example.com/?foo=bar&baz=qux')).toBeVisible();

    // Remove the first parameter
    await page.getByRole('button', { name: '×' }).first().click();
    await expect(page.getByText('https://example.com/?baz=qux')).toBeVisible();
  });

  test('should save a build and reload it from history', async ({ page }) => {
    const baseUrl = 'https://anotherexample.com';
    await page.locator('#baseUrl').fill(baseUrl);
    await page.getByRole('button', { name: '+ Add Parameter' }).click();
    await page.locator('.param-group input[formControlName="key"]').fill('test');
    await page.locator('.param-group input[formControlName="value"]').fill('123');

    const expectedUrl = 'https://anotherexample.com/?test=123';
    await expect(page.getByText(expectedUrl)).toBeVisible();

    // Save the build
    await page.getByRole('button', { name: 'Save Build' }).click();

    // The history component is deferred, so we wait for it to be visible
    const historyList = page.locator('app-history ul');
    await historyList.waitFor({ state: 'visible' });

    // Check if the build appears in the history
    const historyItem = historyList.locator('li').first();
    await expect(historyItem.getByText(expectedUrl)).toBeVisible();

    // Clear the form
    await page.locator('#baseUrl').fill('https://cleared.com');
    await expect(page.getByText('https://cleared.com/')).toBeVisible();

    // Click the history item to reload
    await historyItem.click();

    // Check if the form is reloaded
    await expect(page.locator('#baseUrl')).toHaveValue(baseUrl);
    await expect(page.locator('.param-group input[formControlName="key"]')).toHaveValue('test');
    await expect(page.locator('.param-group input[formControlName="value"]')).toHaveValue('123');
    await expect(page.getByText(expectedUrl)).toBeVisible();
  });

  test('should filter the history', async ({ page }) => {
    // Save first build
    await page.locator('#baseUrl').fill('https://filtertest.com');
    await page.locator('#utmSource').fill('one');
    await page.getByRole('button', { name: 'Save Build' }).click();

    // Save second build
    await page.locator('#utmSource').fill('two');
    await page.getByRole('button', { name: 'Save Build' }).click();
    
    const historyList = page.locator('app-history ul');
    await historyList.waitFor({ state: 'visible' });

    // Check that both items are in the history
    await expect(historyList.locator('li')).toHaveCount(2);

    // Filter for the first item
    await page.locator('.filter-input').fill('one');
    await expect(historyList.locator('li')).toHaveCount(1);
    await expect(historyList.locator('li').first().getByText(/one/)).toBeVisible();

    // Filter for the second item
    await page.locator('.filter-input').fill('two');
    await expect(historyList.locator('li')).toHaveCount(1);
    await expect(historyList.locator('li').first().getByText(/two/)).toBeVisible();

    // Clear the filter
    await page.locator('.filter-input').fill('');
    await expect(historyList.locator('li')).toHaveCount(2);
  });
});
