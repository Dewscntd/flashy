/**
 * Page Object for URL Builder feature
 * Encapsulates all interactions with the URL builder form.
 * Follows Single Responsibility: only manages URL builder UI elements.
 */

import { Page, Locator, expect } from '@playwright/test';

export class UrlBuilderPage {
  readonly page: Page;

  // Form inputs
  readonly baseUrlInput: Locator;
  readonly utmSourceInput: Locator;
  readonly utmMediumInput: Locator;
  readonly utmCampaignInput: Locator;
  readonly utmTermInput: Locator;
  readonly utmContentInput: Locator;

  // Buttons
  readonly addParameterButton: Locator;
  readonly saveBuildButton: Locator;
  readonly clearButton: Locator;

  // Preview and output
  readonly urlPreview: Locator;
  readonly characterCount: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.baseUrlInput = page.locator('#baseUrl');
    this.utmSourceInput = page.locator('#utmSource');
    this.utmMediumInput = page.locator('#utmMedium');
    this.utmCampaignInput = page.locator('#utmCampaign');
    this.utmTermInput = page.locator('#utmTerm');
    this.utmContentInput = page.locator('#utmContent');

    this.addParameterButton = page.getByRole('button', { name: /add parameter/i });
    this.saveBuildButton = page.getByRole('button', { name: /save build/i });
    this.clearButton = page.getByRole('button', { name: /clear/i });

    this.urlPreview = page.locator('.url-preview, [data-testid="url-preview"]');
    this.characterCount = page.locator('[data-testid="character-count"]');
  }

  /**
   * Navigates to the URL builder page
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForSelector('h1', { state: 'visible' });
  }

  /**
   * Fills the base URL input
   */
  async enterBaseUrl(url: string): Promise<void> {
    await this.baseUrlInput.fill(url);
  }

  /**
   * Fills UTM source parameter
   */
  async enterUtmSource(source: string): Promise<void> {
    await this.utmSourceInput.fill(source);
  }

  /**
   * Fills UTM medium parameter
   */
  async enterUtmMedium(medium: string): Promise<void> {
    await this.utmMediumInput.fill(medium);
  }

  /**
   * Fills UTM campaign parameter
   */
  async enterUtmCampaign(campaign: string): Promise<void> {
    await this.utmCampaignInput.fill(campaign);
  }

  /**
   * Fills all UTM parameters at once
   */
  async fillUtmParameters(params: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  }): Promise<void> {
    if (params.source) await this.enterUtmSource(params.source);
    if (params.medium) await this.enterUtmMedium(params.medium);
    if (params.campaign) await this.enterUtmCampaign(params.campaign);
    if (params.term) await this.utmTermInput.fill(params.term);
    if (params.content) await this.utmContentInput.fill(params.content);
  }

  /**
   * Adds a custom dynamic parameter
   */
  async addDynamicParameter(key: string, value: string): Promise<void> {
    await this.addParameterButton.click();

    // Wait for the new parameter inputs to appear
    const paramGroups = this.page.locator('.param-group');
    const lastGroup = paramGroups.last();

    await lastGroup.locator('input[formControlName="key"]').fill(key);
    await lastGroup.locator('input[formControlName="value"]').fill(value);
  }

  /**
   * Removes a dynamic parameter by index
   */
  async removeDynamicParameter(index: number): Promise<void> {
    const removeButtons = this.page.locator('.remove-btn, button[aria-label*="Remove"]');
    await removeButtons.nth(index).click();
  }

  /**
   * Clicks the save build button
   */
  async clickSave(): Promise<void> {
    await this.saveBuildButton.click();
  }

  /**
   * Clicks the clear button
   */
  async clickClear(): Promise<void> {
    if (await this.clearButton.isVisible()) {
      await this.clearButton.click();
    }
  }

  /**
   * Gets the current URL preview text
   */
  async getPreviewUrl(): Promise<string> {
    return await this.urlPreview.textContent() || '';
  }

  /**
   * Gets the character count
   */
  async getCharacterCount(): Promise<number> {
    const text = await this.characterCount.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Waits for URL preview to contain specific text
   */
  async waitForPreview(expectedUrl: string): Promise<void> {
    await expect(this.page.getByText(expectedUrl)).toBeVisible();
  }

  /**
   * Asserts that the URL preview shows expected URL
   */
  async expectPreviewToContain(expectedText: string): Promise<void> {
    await expect(this.urlPreview).toContainText(expectedText);
  }

  /**
   * Gets the number of dynamic parameters currently added
   */
  async getDynamicParameterCount(): Promise<number> {
    const paramGroups = this.page.locator('.param-group');
    return await paramGroups.count();
  }

  /**
   * Checks if a validation error is displayed for base URL
   */
  async hasBaseUrlError(): Promise<boolean> {
    const errorElement = this.page.locator('#baseUrl-error, .error-message');
    return await errorElement.isVisible();
  }

  /**
   * Fills complete URL build with base URL and UTM parameters
   */
  async buildUrl(baseUrl: string, utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
  }): Promise<void> {
    await this.enterBaseUrl(baseUrl);
    if (utmParams) {
      await this.fillUtmParameters(utmParams);
    }
  }
}
