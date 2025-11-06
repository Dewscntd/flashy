/**
 * Page Object for History feature
 * Encapsulates all interactions with the URL build history list.
 * Follows Single Responsibility: only manages history UI elements.
 */

import { Page, Locator, expect } from '@playwright/test';

export class HistoryPage {
  readonly page: Page;

  // Main containers
  readonly historyContainer: Locator;
  readonly historyList: Locator;

  // Filter controls
  readonly filterInput: Locator;
  readonly clearFilterButton: Locator;

  // Action buttons
  readonly clearHistoryButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.historyContainer = page.locator('app-history');
    this.historyList = page.locator('app-history ul');
    this.filterInput = page.locator('.filter-input, input[placeholder*="filter" i]');
    this.clearFilterButton = page.locator('button:has-text("Clear Filter")');
    this.clearHistoryButton = page.locator('button:has-text("Clear History")');
  }

  /**
   * Waits for history list to be visible
   */
  async waitForHistoryToLoad(): Promise<void> {
    await this.historyList.waitFor({ state: 'visible' });
  }

  /**
   * Gets all history items
   */
  getHistoryItems(): Locator {
    return this.historyList.locator('li');
  }

  /**
   * Gets a specific history item by index
   */
  getHistoryItem(index: number): Locator {
    return this.getHistoryItems().nth(index);
  }

  /**
   * Gets the first history item
   */
  getFirstHistoryItem(): Locator {
    return this.getHistoryItems().first();
  }

  /**
   * Gets the last history item
   */
  getLastHistoryItem(): Locator {
    return this.getHistoryItems().last();
  }

  /**
   * Clicks on a history item to load it
   */
  async clickHistoryItem(index: number): Promise<void> {
    await this.getHistoryItem(index).click();
  }

  /**
   * Clicks the first history item
   */
  async clickFirstHistoryItem(): Promise<void> {
    await this.getFirstHistoryItem().click();
  }

  /**
   * Gets the count of history items
   */
  async getHistoryItemCount(): Promise<number> {
    return await this.getHistoryItems().count();
  }

  /**
   * Filters history by search term
   */
  async filterHistory(searchTerm: string): Promise<void> {
    await this.filterInput.fill(searchTerm);
  }

  /**
   * Clears the filter input
   */
  async clearFilter(): Promise<void> {
    await this.filterInput.fill('');
  }

  /**
   * Clicks the clear history button
   */
  async clearAllHistory(): Promise<void> {
    if (await this.clearHistoryButton.isVisible()) {
      await this.clearHistoryButton.click();
    }
  }

  /**
   * Checks if a specific URL exists in history
   */
  async hasUrlInHistory(url: string): Promise<boolean> {
    const item = this.historyList.locator(`li:has-text("${url}")`);
    return await item.isVisible();
  }

  /**
   * Waits for a specific URL to appear in history
   */
  async waitForUrlInHistory(url: string): Promise<void> {
    await this.historyList.locator(`li:has-text("${url}")`).waitFor({ state: 'visible' });
  }

  /**
   * Gets the URL text from a history item
   */
  async getHistoryItemUrl(index: number): Promise<string> {
    const item = this.getHistoryItem(index);
    const urlElement = item.locator('.url, [data-testid="history-url"]');
    return await urlElement.textContent() || '';
  }

  /**
   * Deletes a history item by index
   */
  async deleteHistoryItem(index: number): Promise<void> {
    const deleteButton = this.getHistoryItem(index).locator('button[aria-label*="delete" i], .delete-btn');
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
    }
  }

  /**
   * Copies URL from a history item
   */
  async copyHistoryItemUrl(index: number): Promise<void> {
    const copyButton = this.getHistoryItem(index).locator('button[aria-label*="copy" i], .copy-btn');
    if (await copyButton.isVisible()) {
      await copyButton.click();
    }
  }

  /**
   * Asserts that history contains expected number of items
   */
  async expectHistoryItemCount(count: number): Promise<void> {
    await expect(this.getHistoryItems()).toHaveCount(count);
  }

  /**
   * Asserts that history contains a specific URL
   */
  async expectUrlInHistory(url: string): Promise<void> {
    await expect(this.historyList.getByText(url)).toBeVisible();
  }

  /**
   * Checks if history is empty
   */
  async isHistoryEmpty(): Promise<boolean> {
    const count = await this.getHistoryItemCount();
    return count === 0;
  }

  /**
   * Gets the timestamp text from a history item
   */
  async getHistoryItemTimestamp(index: number): Promise<string> {
    const item = this.getHistoryItem(index);
    const timestampElement = item.locator('.timestamp, [data-testid="history-timestamp"]');
    return await timestampElement.textContent() || '';
  }
}
