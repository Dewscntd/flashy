/**
 * History Component - displays recent URL builds with filtering.
 * Follows Single Responsibility: displays history and emits user actions.
 * Fully declarative with signals and computed values.
 */

import { Component, computed, inject, signal, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UrlBuildRepositoryService } from '../../core/services/url-build-repository.service';
import { UrlBuild } from '../../core/models/url-build.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent {
  private readonly repository = inject(UrlBuildRepositoryService);

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
      this.matchesBuild(build, term)
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
   * Deletes a build from the repository.
   */
  onDeleteBuild(event: Event, build: UrlBuild): void {
    event.stopPropagation(); // Prevent triggering the load action

    if (confirm('Are you sure you want to delete this build?')) {
      this.repository.delete(build.id);
    }
  }

  /**
   * Checks if a build matches the search term.
   * Searches in URL, UTM parameters, and custom parameters.
   */
  private matchesBuild(build: UrlBuild, term: string): boolean {
    // Search in final URL
    if (build.finalUrl.toLowerCase().includes(term)) {
      return true;
    }

    // Search in base URL
    if (build.form.baseUrl.toLowerCase().includes(term)) {
      return true;
    }

    // Search in UTM parameters
    const utmValues = [
      build.form.utmSource,
      build.form.utmMedium,
      build.form.utmCampaign
    ].filter(Boolean);

    if (utmValues.some(value => value?.toLowerCase().includes(term))) {
      return true;
    }

    // Search in custom parameters
    return build.form.params.some(
      param =>
        param.key.toLowerCase().includes(term) ||
        param.value.toLowerCase().includes(term)
    );
  }
}
