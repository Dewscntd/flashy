/**
 * Unit tests for UrlPreviewComponent
 * Tests presentation logic and event emissions
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UrlPreviewComponent } from './url-preview.component';
import { ConstructedUrl } from '../../../../core/models/url-build.model';

describe('UrlPreviewComponent', () => {
  let component: UrlPreviewComponent;
  let fixture: ComponentFixture<UrlPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UrlPreviewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UrlPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('inputs', () => {
    it('should have urlData input defaulting to null', () => {
      expect(component.urlData()).toBeNull();
    });

    it('should accept urlData input', () => {
      const urlData: ConstructedUrl = {
        url: 'https://example.com?utm_source=test',
        characterCount: 37,
        parameterCount: 1
      };

      fixture.componentRef.setInput('urlData', urlData);
      fixture.detectChanges();

      expect(component.urlData()).toEqual(urlData);
    });

    it('should have saveDisabled input defaulting to false', () => {
      expect(component.saveDisabled()).toBe(false);
    });

    it('should accept saveDisabled input', () => {
      fixture.componentRef.setInput('saveDisabled', true);
      fixture.detectChanges();

      expect(component.saveDisabled()).toBe(true);
    });

    it('should update when urlData changes', () => {
      const urlData1: ConstructedUrl = {
        url: 'https://example.com',
        characterCount: 20,
        parameterCount: 0
      };

      const urlData2: ConstructedUrl = {
        url: 'https://example.com?utm_source=test',
        characterCount: 37,
        parameterCount: 1
      };

      fixture.componentRef.setInput('urlData', urlData1);
      fixture.detectChanges();
      expect(component.urlData()).toEqual(urlData1);

      fixture.componentRef.setInput('urlData', urlData2);
      fixture.detectChanges();
      expect(component.urlData()).toEqual(urlData2);
    });
  });

  describe('outputs', () => {
    it('should have copyClicked output', () => {
      expect(component.copyClicked).toBeDefined();
    });

    it('should have saveClicked output', () => {
      expect(component.saveClicked).toBeDefined();
    });
  });

  describe('onCopy', () => {
    it('should emit copyClicked event', (done) => {
      component.copyClicked.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      component.onCopy();
    });

    it('should emit without any value', (done) => {
      component.copyClicked.subscribe((value) => {
        expect(value).toBeUndefined();
        done();
      });

      component.onCopy();
    });

    it('should emit every time it is called', () => {
      let emitCount = 0;
      component.copyClicked.subscribe(() => {
        emitCount++;
      });

      component.onCopy();
      component.onCopy();
      component.onCopy();

      expect(emitCount).toBe(3);
    });
  });

  describe('onSave', () => {
    it('should emit saveClicked when not disabled', (done) => {
      fixture.componentRef.setInput('saveDisabled', false);

      component.saveClicked.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      component.onSave();
    });

    it('should not emit saveClicked when disabled', () => {
      fixture.componentRef.setInput('saveDisabled', true);
      fixture.detectChanges();

      let emitted = false;
      component.saveClicked.subscribe(() => {
        emitted = true;
      });

      component.onSave();

      expect(emitted).toBe(false);
    });

    it('should emit without any value', (done) => {
      fixture.componentRef.setInput('saveDisabled', false);

      component.saveClicked.subscribe((value) => {
        expect(value).toBeUndefined();
        done();
      });

      component.onSave();
    });

    it('should respect saveDisabled changes', () => {
      let emitCount = 0;
      component.saveClicked.subscribe(() => {
        emitCount++;
      });

      // Initially enabled
      fixture.componentRef.setInput('saveDisabled', false);
      component.onSave();
      expect(emitCount).toBe(1);

      // Disable
      fixture.componentRef.setInput('saveDisabled', true);
      component.onSave();
      expect(emitCount).toBe(1); // Should not increment

      // Re-enable
      fixture.componentRef.setInput('saveDisabled', false);
      component.onSave();
      expect(emitCount).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle null urlData gracefully', () => {
      fixture.componentRef.setInput('urlData', null);
      fixture.detectChanges();

      expect(() => {
        component.onCopy();
      }).not.toThrow();
    });

    it('should handle undefined urlData gracefully', () => {
      fixture.componentRef.setInput('urlData', undefined);
      fixture.detectChanges();

      expect(() => {
        component.onCopy();
      }).not.toThrow();
    });

    it('should handle very long URLs', () => {
      const longUrl: ConstructedUrl = {
        url: 'https://example.com?' + 'a'.repeat(10000),
        characterCount: 10000 + 20,
        parameterCount: 1
      };

      fixture.componentRef.setInput('urlData', longUrl);
      fixture.detectChanges();

      expect(component.urlData()).toEqual(longUrl);
    });

    it('should handle URL with special characters', () => {
      const urlData: ConstructedUrl = {
        url: 'https://example.com?name=José García&message=Hello World!',
        characterCount: 60,
        parameterCount: 2
      };

      fixture.componentRef.setInput('urlData', urlData);
      fixture.detectChanges();

      expect(component.urlData()).toEqual(urlData);
    });

    it('should handle zero parameter count', () => {
      const urlData: ConstructedUrl = {
        url: 'https://example.com',
        characterCount: 20,
        parameterCount: 0
      };

      fixture.componentRef.setInput('urlData', urlData);
      fixture.detectChanges();

      expect(component.urlData()?.parameterCount).toBe(0);
    });

    it('should handle large parameter count', () => {
      const urlData: ConstructedUrl = {
        url: 'https://example.com?param1=1&param2=2&param3=3',
        characterCount: 50,
        parameterCount: 100
      };

      fixture.componentRef.setInput('urlData', urlData);
      fixture.detectChanges();

      expect(component.urlData()?.parameterCount).toBe(100);
    });
  });

  describe('component lifecycle', () => {
    it('should not throw on initialization', () => {
      expect(() => {
        const testFixture = TestBed.createComponent(UrlPreviewComponent);
        testFixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle multiple input changes', () => {
      const urlData1: ConstructedUrl = {
        url: 'https://example1.com',
        characterCount: 21,
        parameterCount: 0
      };

      const urlData2: ConstructedUrl = {
        url: 'https://example2.com',
        characterCount: 21,
        parameterCount: 0
      };

      fixture.componentRef.setInput('urlData', urlData1);
      fixture.componentRef.setInput('saveDisabled', true);
      fixture.detectChanges();

      fixture.componentRef.setInput('urlData', urlData2);
      fixture.componentRef.setInput('saveDisabled', false);
      fixture.detectChanges();

      expect(component.urlData()).toEqual(urlData2);
      expect(component.saveDisabled()).toBe(false);
    });
  });

  describe('pure presentation logic', () => {
    it('should not modify input data', () => {
      const originalData: ConstructedUrl = {
        url: 'https://example.com',
        characterCount: 20,
        parameterCount: 0
      };

      const dataCopy = { ...originalData };
      fixture.componentRef.setInput('urlData', dataCopy);
      fixture.detectChanges();

      component.onCopy();

      expect(component.urlData()).toEqual(originalData);
    });

    it('should be stateless except for inputs', () => {
      // Component should have no internal state beyond inputs
      const initialState = {
        urlData: component.urlData(),
        saveDisabled: component.saveDisabled()
      };

      component.onCopy();
      component.onCopy();

      const afterState = {
        urlData: component.urlData(),
        saveDisabled: component.saveDisabled()
      };

      expect(afterState).toEqual(initialState);
    });
  });
});
