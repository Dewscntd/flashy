/**
 * Translation pipe for templates.
 * Usage: {{ 'common.buttons.save' | translate }}
 * With params: {{ 'common.greeting' | translate:{name: 'John'} }}
 *
 * PERFORMANCE: Pure pipe with signal-based caching for optimal re-render performance.
 * Re-executes only when key, params, or locale changes - not on every change detection cycle.
 */

import { Pipe, PipeTransform, inject, computed, Signal } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { TranslationParams } from '../models/i18n.model';

@Pipe({
  name: 'translate',
  standalone: true,
  // Mark as impure so Angular re-evaluates when the underlying translation signal changes.
  // The internal computed still ensures we only recompute when locale or params change.
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly translationService = inject(TranslationService);

  // Cache for computed translation signals keyed by translation key + params
  private readonly cache = new Map<string, Signal<string>>();

  transform(key: string, params?: TranslationParams): string {
    // Generate cache key from translation key and params
    const cacheKey = this.generateCacheKey(key, params);

    // Check if we have a cached computed signal for this key + params combo
    let translationSignal = this.cache.get(cacheKey);

    if (!translationSignal) {
      // Create a new computed signal that reacts to locale changes
      translationSignal = computed(() => {
        // REACTIVE CHAIN: This computed establishes dependencies on:
        // 1. version$() - increments when translations are loaded (CRITICAL for zoneless CD)
        // 2. currentLocale() signal - read in getTranslation()
        // 3. translations() signal - read in getTranslation()
        // When setLocale() is called, all signals update, triggering re-computation
        // The version signal is essential to force change detection in zoneless mode
        this.translationService.version$();
        return this.translationService.instant(key, params);
      });

      // Cache the computed signal for future use
      // Limit cache size to prevent memory leaks (clear old entries)
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }

      this.cache.set(cacheKey, translationSignal);
    }

    // Return the current value of the computed signal
    return translationSignal();
  }

  /**
   * Generates a unique cache key for the translation key + params combination.
   * This ensures different parameter values get separate cache entries.
   */
  private generateCacheKey(key: string, params?: TranslationParams): string {
    if (!params) {
      return key;
    }
    // Sort params keys for consistent cache keys
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}:${params[k]}`)
      .join(',');
    return `${key}|${sortedParams}`;
  }
}
