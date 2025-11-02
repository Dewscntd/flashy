/**
 * Service for clipboard operations with proper error handling.
 * Follows Single Responsibility Principle: manages clipboard interactions only.
 */

import { Injectable } from '@angular/core';

export interface ClipboardResult {
  success: boolean;
  error?: string;
}

/**
 * Handles clipboard operations with graceful error handling and permissions management.
 */
@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  /**
   * Copies text to the system clipboard.
   *
   * @param text - The text to copy
   * @returns Promise resolving to result object with success status
   */
  async copyToClipboard(text: string): Promise<ClipboardResult> {
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'No text provided to copy'
      };
    }

    // Check if Clipboard API is available
    if (!navigator.clipboard) {
      return this.fallbackCopy(text);
    }

    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      // Permission denied or other error - try fallback
      return this.fallbackCopy(text);
    }
  }

  /**
   * Fallback method using document.execCommand for older browsers
   * or when Clipboard API is not available.
   *
   * @param text - Text to copy
   * @returns Result object
   */
  private fallbackCopy(text: string): ClipboardResult {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Copy command failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Reads text from clipboard (requires user permission).
   *
   * @returns Promise resolving to clipboard text or null if failed
   */
  async readFromClipboard(): Promise<string | null> {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      return null;
    }

    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch {
      // Permission denied or not supported
      return null;
    }
  }
}
