/**
 * Unit tests for HistoryComponent
 * Tests history display, filtering, and user interactions
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { HistoryComponent } from './history.component';
import { UrlBuildRepositoryService } from '../../core/services/url-build-repository.service';
import { TuiDialogService } from '@taiga-ui/core/components/dialog';
import { UrlBuild } from '../../core/models/url-build.model';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;
  let mockRepository: jasmine.SpyObj<UrlBuildRepositoryService>;
  let mockDialogService: jasmine.SpyObj<TuiDialogService>;
  let mockBuildsSignal: any;

  const createMockBuild = (overrides?: Partial<UrlBuild>): UrlBuild => ({
    id: 'test-id',
    finalUrl: 'https://example.com?utm_source=test',
    form: {
      baseUrl: 'https://example.com',
      utmSource: 'test',
      params: []
    },
    createdAt: new Date().toISOString(),
    ...overrides
  });

  beforeEach(async () => {
    mockBuildsSignal = signal<ReadonlyArray<UrlBuild>>([]);

    mockRepository = jasmine.createSpyObj('UrlBuildRepositoryService', ['delete'], {
      builds$: mockBuildsSignal.asReadonly()
    });

    mockDialogService = jasmine.createSpyObj('TuiDialogService', ['open']);
    mockDialogService.open.and.returnValue(of(false)); // Default to false (cancel)

    await TestBed.configureTestingModule({
      imports: [HistoryComponent, HttpClientTestingModule],
      providers: [
        { provide: UrlBuildRepositoryService, useValue: mockRepository },
        { provide: TuiDialogService, useValue: mockDialogService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with empty filter term', () => {
      expect(component.filterTerm()).toBe('');
    });

    it('should get builds from repository', () => {
      expect(component.allBuilds).toBe(mockRepository.builds$);
    });

    it('should initialize filteredBuilds', () => {
      expect(component.filteredBuilds()).toEqual([]);
    });
  });

  describe('filteredBuilds computed', () => {
    it('should return all builds when filter is empty', () => {
      const builds = [
        createMockBuild({ id: '1' }),
        createMockBuild({ id: '2' })
      ];
      mockBuildsSignal.set(builds);

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(2);
      expect(filtered).toEqual(builds);
    });

    it('should filter by final URL', () => {
      const builds = [
        createMockBuild({ id: '1', finalUrl: 'https://example.com', form: { baseUrl: 'https://example.com', params: [] } }),
        createMockBuild({ id: '2', finalUrl: 'https://test.com', form: { baseUrl: 'https://test.com', params: [] } })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('example');

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter by base URL', () => {
      const builds = [
        createMockBuild({ id: '1', form: { baseUrl: 'https://shop.example.com', params: [] } }),
        createMockBuild({ id: '2', form: { baseUrl: 'https://blog.example.com', params: [] } })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('shop');

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter by UTM source', () => {
      const builds = [
        createMockBuild({ id: '1', form: { baseUrl: 'https://example.com', utmSource: 'google', params: [] } }),
        createMockBuild({ id: '2', form: { baseUrl: 'https://example.com', utmSource: 'facebook', params: [] } })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('google');

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter by UTM medium', () => {
      const builds = [
        createMockBuild({ id: '1', form: { baseUrl: 'https://example.com', utmMedium: 'cpc', params: [] } }),
        createMockBuild({ id: '2', form: { baseUrl: 'https://example.com', utmMedium: 'email', params: [] } })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('email');

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should filter by UTM campaign', () => {
      const builds = [
        createMockBuild({ id: '1', form: { baseUrl: 'https://example.com', utmCampaign: 'spring-sale', params: [] } }),
        createMockBuild({ id: '2', form: { baseUrl: 'https://example.com', utmCampaign: 'summer-sale', params: [] } })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('spring');

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter by custom parameter key', () => {
      const builds = [
        createMockBuild({
          id: '1',
          form: {
            baseUrl: 'https://example.com',
            params: [{ key: 'color', value: 'blue' }]
          }
        }),
        createMockBuild({
          id: '2',
          form: {
            baseUrl: 'https://example.com',
            params: [{ key: 'size', value: 'large' }]
          }
        })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('color');

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter by custom parameter value', () => {
      const builds = [
        createMockBuild({
          id: '1',
          form: {
            baseUrl: 'https://example.com',
            params: [{ key: 'color', value: 'blue' }]
          }
        }),
        createMockBuild({
          id: '2',
          form: {
            baseUrl: 'https://example.com',
            params: [{ key: 'color', value: 'red' }]
          }
        })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('red');

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should be case-insensitive', () => {
      const builds = [
        createMockBuild({ id: '1', form: { baseUrl: 'https://EXAMPLE.com', params: [] } })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('example');

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(1);
    });

    it('should trim whitespace from filter term', () => {
      const builds = [
        createMockBuild({ id: '1', finalUrl: 'https://example.com' })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('  example  ');

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(1);
    });

    it('should return empty array when no matches', () => {
      const builds = [
        createMockBuild({ id: '1', finalUrl: 'https://example.com' })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('nomatch');

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(0);
    });

    it('should match multiple builds', () => {
      const builds = [
        createMockBuild({ id: '1', finalUrl: 'https://example.com', form: { baseUrl: 'https://example.com', params: [] } }),
        createMockBuild({ id: '2', finalUrl: 'https://example.org', form: { baseUrl: 'https://example.org', params: [] } }),
        createMockBuild({ id: '3', finalUrl: 'https://test.com', form: { baseUrl: 'https://test.com', params: [] } })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('example');

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(2);
    });
  });

  describe('collapse behavior', () => {
    it('should toggle collapsed state when requested', () => {
      expect(component.isCollapsed()).toBeFalse();

      component.toggleCollapsed();
      expect(component.isCollapsed()).toBeTrue();

      component.toggleCollapsed();
      expect(component.isCollapsed()).toBeFalse();
    });
  });

  describe('onFilterChange', () => {
    it('should update filterTerm signal', () => {
      const event = {
        target: { value: 'test' }
      } as any;

      component.onFilterChange(event);

      expect(component.filterTerm()).toBe('test');
    });

    it('should handle empty value', () => {
      const event = {
        target: { value: '' }
      } as any;

      component.onFilterChange(event);

      expect(component.filterTerm()).toBe('');
    });

    it('should handle whitespace value', () => {
      const event = {
        target: { value: '   ' }
      } as any;

      component.onFilterChange(event);

      expect(component.filterTerm()).toBe('   ');
    });

    it('should update filteredBuilds when filter changes', () => {
      const builds = [
        createMockBuild({ id: '1', finalUrl: 'https://example.com', form: { baseUrl: 'https://example.com', params: [] } }),
        createMockBuild({ id: '2', finalUrl: 'https://test.com', form: { baseUrl: 'https://test.com', params: [] } })
      ];
      mockBuildsSignal.set(builds);

      const event = {
        target: { value: 'example' }
      } as any;

      component.onFilterChange(event);

      expect(component.filteredBuilds().length).toBe(1);
    });
  });

  describe('onBuildClick', () => {
    it('should emit loadBuild event', (done) => {
      const build = createMockBuild();

      component.loadBuild.subscribe((emittedBuild) => {
        expect(emittedBuild).toBe(build);
        done();
      });

      component.onBuildClick(build);
    });

    it('should emit the correct build', (done) => {
      const build1 = createMockBuild({ id: '1' });
      const build2 = createMockBuild({ id: '2' });

      component.loadBuild.subscribe((emittedBuild) => {
        expect(emittedBuild.id).toBe('2');
        done();
      });

      component.onBuildClick(build2);
    });
  });

  describe('onDeleteBuild', () => {
    it('should stop event propagation', () => {
      const event = jasmine.createSpyObj('Event', ['stopPropagation']);
      const build = createMockBuild();

      component.onDeleteBuild(event, build);

      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should show confirmation dialog with translated messages', () => {
      const event = jasmine.createSpyObj('Event', ['stopPropagation']);
      const build = createMockBuild();

      component.onDeleteBuild(event, build);

      expect(mockDialogService.open).toHaveBeenCalled();
      const callArgs: any = mockDialogService.open.calls.mostRecent().args[1];
      expect(callArgs.label).toBeDefined();
      expect(callArgs.size).toBe('s');
      expect(callArgs.data).toBeDefined();
      expect(callArgs.data.content).toBeDefined();
      expect(callArgs.data.yes).toBeDefined();
      expect(callArgs.data.no).toBeDefined();
    });

    it('should delete build when confirmed', () => {
      const event = jasmine.createSpyObj('Event', ['stopPropagation']);
      const build = createMockBuild({ id: 'test-id' });
      mockDialogService.open.and.returnValue(of(true));

      component.onDeleteBuild(event, build);

      expect(mockRepository.delete).toHaveBeenCalledWith('test-id');
    });

    it('should not delete build when canceled', () => {
      const event = jasmine.createSpyObj('Event', ['stopPropagation']);
      const build = createMockBuild();
      mockDialogService.open.and.returnValue(of(false));

      component.onDeleteBuild(event, build);

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should prevent loadBuild from triggering', () => {
      const event = jasmine.createSpyObj('Event', ['stopPropagation']);
      const build = createMockBuild();
      mockDialogService.open.and.returnValue(of(true));

      let loadBuildTriggered = false;
      component.loadBuild.subscribe(() => {
        loadBuildTriggered = true;
      });

      component.onDeleteBuild(event, build);

      expect(loadBuildTriggered).toBe(false);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty builds array', () => {
      mockBuildsSignal.set([]);

      expect(component.filteredBuilds()).toEqual([]);
    });

    it('should handle builds with no UTM parameters', () => {
      const builds = [
        createMockBuild({
          id: '1',
          form: {
            baseUrl: 'https://example.com',
            params: []
          }
        })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('example');

      expect(component.filteredBuilds().length).toBe(1);
    });

    it('should handle builds with empty custom params', () => {
      const builds = [
        createMockBuild({
          id: '1',
          form: {
            baseUrl: 'https://example.com',
            params: []
          }
        })
      ];
      mockBuildsSignal.set(builds);

      expect(() => {
        component.filterTerm.set('test');
        component.filteredBuilds();
      }).not.toThrow();
    });

    it('should handle special characters in filter', () => {
      const builds = [
        createMockBuild({ id: '1', finalUrl: 'https://example.com?param=value&other=test' })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('param=value');

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(1);
    });

    it('should handle Unicode in filter', () => {
      const builds = [
        createMockBuild({
          id: '1',
          form: {
            baseUrl: 'https://example.com',
            params: [{ key: 'name', value: 'José García' }]
          }
        })
      ];
      mockBuildsSignal.set(builds);

      component.filterTerm.set('josé');

      const filtered = component.filteredBuilds();

      expect(filtered.length).toBe(1);
    });

    it('should handle very long filter terms', () => {
      const builds = [createMockBuild()];
      mockBuildsSignal.set(builds);

      const longTerm = 'a'.repeat(1000);
      component.filterTerm.set(longTerm);

      expect(() => {
        component.filteredBuilds();
      }).not.toThrow();
    });
  });

  describe('reactivity', () => {
    it('should update filteredBuilds when builds$ changes', () => {
      const builds1 = [createMockBuild({ id: '1' })];
      mockBuildsSignal.set(builds1);

      expect(component.filteredBuilds().length).toBe(1);

      const builds2 = [
        createMockBuild({ id: '1' }),
        createMockBuild({ id: '2' })
      ];
      mockBuildsSignal.set(builds2);

      expect(component.filteredBuilds().length).toBe(2);
    });

    it('should update filteredBuilds when filterTerm changes', () => {
      const builds = [
        createMockBuild({ id: '1', finalUrl: 'https://example.com', form: { baseUrl: 'https://example.com', params: [] } }),
        createMockBuild({ id: '2', finalUrl: 'https://test.com', form: { baseUrl: 'https://test.com', params: [] } })
      ];
      mockBuildsSignal.set(builds);

      expect(component.filteredBuilds().length).toBe(2);

      component.filterTerm.set('example');

      expect(component.filteredBuilds().length).toBe(1);
    });

    it('should react to both signal changes', () => {
      const builds1 = [
        createMockBuild({ id: '1', finalUrl: 'https://example.com' })
      ];
      mockBuildsSignal.set(builds1);
      component.filterTerm.set('example');

      expect(component.filteredBuilds().length).toBe(1);

      const builds2 = [
        createMockBuild({ id: '1', finalUrl: 'https://example.com' }),
        createMockBuild({ id: '2', finalUrl: 'https://example.org' })
      ];
      mockBuildsSignal.set(builds2);

      expect(component.filteredBuilds().length).toBe(2);

      component.filterTerm.set('org');

      expect(component.filteredBuilds().length).toBe(1);
    });
  });

  describe('output', () => {
    it('should have loadBuild output', () => {
      expect(component.loadBuild).toBeDefined();
    });

    it('should emit build objects', (done) => {
      const build = createMockBuild();

      component.loadBuild.subscribe((emitted) => {
        expect(typeof emitted).toBe('object');
        expect(emitted.id).toBeDefined();
        expect(emitted.finalUrl).toBeDefined();
        expect(emitted.form).toBeDefined();
        done();
      });

      component.onBuildClick(build);
    });
  });
});
