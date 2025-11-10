/**
 * History Component - displays recent URL builds with filtering.
 * Follows Single Responsibility: displays history and emits user actions.
 * Fully declarative with signals and computed values.
 */

import { Component, computed, inject, signal, output, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UrlBuildRepositoryService } from '../../core/services/url-build-repository.service';
import { UrlBuild } from '../../core/models/url-build.model';
import { matchesBuild } from './history.utils';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TuiDialogService } from '@taiga-ui/core/components/dialog';
import { TUI_CONFIRM } from '@taiga-ui/kit/components/confirm';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, TuiButton, TranslatePipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent {
  private readonly repository = inject(UrlBuildRepositoryService);
  private readonly dialogs = inject(TuiDialogService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly collapseMediaQuery = '(max-width: 768px)';
  private readonly autoCollapse = signal(false);
  private readonly userCollapsedOverride = signal<boolean | null>(null);

  /** Unique identifier for aria-controls relationship between toggle and panel. */
  readonly panelId = `history-panel-${Math.random().toString(36).slice(2, 9)}`;

  /** Emits when user wants to load a build into the form. */
  readonly loadBuild = output<UrlBuild>();

  /** Signal for the filter search term. */
  readonly filterTerm = signal('');

  /**
   * Computed collapsed state. Defaults to collapsed on mobile, but respects user overrides.
   */
  readonly isCollapsed = computed(() => {
    const override = this.userCollapsedOverride();
    return override ?? this.autoCollapse();
  });

  /** All builds from the repository. */
  readonly allBuilds = this.repository.builds$;

  /**
   * Computed filtered builds based on search term.
   * Searches across URL, UTM params, and custom params.
   */
  readonly filteredBuilds = computed(() => {
    const term = this.filterTerm().toLowerCase().trim();

    if (!term) {
      return this.allBuilds();
    }

    return this.allBuilds().filter(build => matchesBuild(build, term));
  });

  constructor() {
    this.initializeCollapseWatcher();
  }

  /** Updates the filter term signal. */
  onFilterChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filterTerm.set(input.value);
  }

  /** Emits the selected build for loading. */
  onBuildClick(build: UrlBuild): void {
    this.loadBuild.emit(build);
  }

  /**
   * Deletes a build from the repository with confirmation dialog.
   * Uses TuiDialogService with TUI_CONFIRM component for styled, accessible confirmations.
   */
  onDeleteBuild(event: Event, build: UrlBuild): void {
    event.stopPropagation(); // Prevent triggering the load action

    this.dialogs
      .open<boolean>(TUI_CONFIRM, {
        label: this.translation.instant('history.dialog.deleteTitle'),
        size: 's',
        data: {
          content: this.translation.instant('history.dialog.deleteMessage'),
          yes: this.translation.instant('history.dialog.deleteConfirm'),
          no: this.translation.instant('history.dialog.deleteCancel')
        }
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.repository.delete(build.id);
        }
      });
  }

  /** Toggles the collapsed state of the history panel (mobile UX). */
  toggleCollapsed(): void {
    const nextState = !this.isCollapsed();
    this.userCollapsedOverride.set(nextState);
  }

  private initializeCollapseWatcher(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia(this.collapseMediaQuery);
    const applyState = (event?: MediaQueryListEvent) => {
      const isMobile = event?.matches ?? mediaQuery.matches;
      this.autoCollapse.set(isMobile);

      if (!isMobile) {
        // Reset user overrides so desktop always shows the panel.
        this.userCollapsedOverride.set(null);
      }
    };

    applyState();

    const listener = (event: MediaQueryListEvent) => applyState(event);
    mediaQuery.addEventListener('change', listener);
    this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', listener));
  }
}
