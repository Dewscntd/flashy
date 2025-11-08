/**
 * Language Switcher Component
 * Displays available languages and allows switching.
 * Fully accessible with keyboard navigation.
 */

import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';
import { Locale } from '../../../core/models/i18n.model';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TuiButton, TranslatePipe],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss'
})
export class LanguageSwitcherComponent {
  private readonly translationService = inject(TranslationService);

  readonly currentLocale = this.translationService.locale$;
  readonly supportedLocales = this.translationService.supportedLocales;
  readonly isOpen = signal<boolean>(false);
  readonly focusedIndex = signal<number>(-1);

  currentLocaleName(): string {
    const locale = this.currentLocale();
    return this.supportedLocales.find(l => l.code === locale)?.nativeName || locale;
  }

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.focusedIndex.set(0);
    }
  }

  async selectLocale(locale: Locale): Promise<void> {
    await this.translationService.setLocale(locale);
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
  }

  /**
   * Handles keyboard navigation in the dropdown.
   * WCAG 2.1.1 Keyboard compliance.
   */
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen()) {
      // Open dropdown on Enter or Space
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.toggleDropdown();
      }
      return;
    }

    const maxIndex = this.supportedLocales.length - 1;
    const currentIndex = this.focusedIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.set(Math.min(currentIndex + 1, maxIndex));
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.set(Math.max(currentIndex - 1, 0));
        break;

      case 'Home':
        event.preventDefault();
        this.focusedIndex.set(0);
        break;

      case 'End':
        event.preventDefault();
        this.focusedIndex.set(maxIndex);
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex <= maxIndex) {
          this.selectLocale(this.supportedLocales[currentIndex].code);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.isOpen.set(false);
        this.focusedIndex.set(-1);
        break;
    }
  }

  /**
   * Returns true if the option at the given index should be focused.
   */
  isOptionFocused(index: number): boolean {
    return this.focusedIndex() === index;
  }
}
