/**
 * History Component - displays recent URL builds with filtering.
 * Follows Single Responsibility: displays history and emits user actions.
 * Fully declarative with signals and computed values.
 */

import { Component, computed, inject, signal, output, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UrlBuildRepositoryService } from '../../core/services/url-build-repository.service';
import { UrlBuild } from '../../core/models/url-build.model';
import { matchesBuild } from './history.utils';
import { TuiButton } from '@taiga-ui/core/components/button';
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
  private readonly translation = inject(TranslationService);

  /**
   * Emits when user wants to load a build into the form.
   */
  readonly loadBuild = output<UrlBuild>();

  /**
   * Signal for the filter search term.
   */
  readonly filterTerm = signal('');

  /**
   * All builds from the repository.
   */
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

    return this.allBuilds().filter(build =>
      matchesBuild(build, term)
    );
  });

  /**
   * Updates the filter term signal.
   */
  onFilterChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filterTerm.set(input.value);
  }

  /**
   * Emits the selected build for loading.
   */
  onBuildClick(build: UrlBuild): void {
    this.loadBuild.emit(build);
  }

  /**
   * Deletes a build from the repository with confirmation dialog.
   * Uses native browser confirm for simplicity and accessibility.
   */
  onDeleteBuild(event: Event, build: UrlBuild): void {
    event.stopPropagation(); // Prevent triggering the load action

    // Show native confirmation dialog
    const message = this.translation.instant('history.dialog.deleteMessage');
    const confirmed = window.confirm(message);

    if (confirmed) {
      this.repository.delete(build.id);
    }
  }
}
