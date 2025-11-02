/**
 * Unit tests for FormStateManagerService
 * Tests form state management, validation, and computed signals
 */

import { TestBed } from '@angular/core/testing';
import { FormArray } from '@angular/forms';
import { FormStateManagerService } from './form-state-manager.service';
import { UrlBuilderService } from './url-builder.service';
import { UrlBuildForm } from '../models/url-build.model';

describe('FormStateManagerService', () => {
  let service: FormStateManagerService;
  let urlBuilderService: UrlBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormStateManagerService, UrlBuilderService]
    });
    service = TestBed.inject(FormStateManagerService);
    urlBuilderService = TestBed.inject(UrlBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('form initialization', () => {
    it('should initialize form with empty values', () => {
      expect(service.form).toBeDefined();
      expect(service.form.get('baseUrl')?.value).toBe('');
      expect(service.form.get('utmSource')?.value).toBe('');
      expect(service.form.get('utmMedium')?.value).toBe('');
      expect(service.form.get('utmCampaign')?.value).toBe('');
    });

    it('should initialize params as empty array', () => {
      expect(service.params.length).toBe(0);
    });

    it('should have baseUrl with required validator', () => {
      const baseUrl = service.form.get('baseUrl');
      baseUrl?.setValue('');
      baseUrl?.markAsTouched();

      expect(baseUrl?.hasError('required')).toBe(true);
    });

    it('should have baseUrl with absoluteUrl validator', () => {
      const baseUrl = service.form.get('baseUrl');
      baseUrl?.setValue('not-a-url');
      baseUrl?.markAsTouched();

      expect(baseUrl?.hasError('absoluteUrl')).toBe(true);
    });

    it('should have params with uniqueKeys validator', () => {
      service.addParameter();
      service.addParameter();

      const params = service.params;
      params.at(0).patchValue({ key: 'same', value: 'value1' });
      params.at(1).patchValue({ key: 'same', value: 'value2' });

      expect(params.hasError('duplicateKeys')).toBe(true);
    });
  });

  describe('constructedUrl computed signal', () => {
    it('should be null initially', () => {
      expect(service.constructedUrl()).toBeNull();
    });

    it('should compute URL when baseUrl is valid', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      const url = service.constructedUrl();

      expect(url).not.toBeNull();
      expect(url?.url).toContain('example.com');
    });

    it('should update when form values change', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      let url = service.constructedUrl();
      expect(url?.parameterCount).toBe(0);

      service.form.patchValue({
        utmSource: 'google'
      });

      url = service.constructedUrl();
      expect(url?.parameterCount).toBe(1);
    });

    it('should include UTM parameters in constructed URL', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'spring'
      });

      const url = service.constructedUrl();

      expect(url?.url).toContain('utm_source=google');
      expect(url?.url).toContain('utm_medium=cpc');
      expect(url?.url).toContain('utm_campaign=spring');
      expect(url?.parameterCount).toBe(3);
    });

    it('should include custom parameters in constructed URL', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      service.addParameter();
      service.params.at(0).patchValue({ key: 'color', value: 'blue' });

      const url = service.constructedUrl();

      expect(url?.url).toContain('color=blue');
      expect(url?.parameterCount).toBe(1);
    });

    it('should filter out empty parameters', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      service.addParameter();
      service.addParameter();
      service.params.at(0).patchValue({ key: 'color', value: 'blue' });
      service.params.at(1).patchValue({ key: '', value: '' });

      const url = service.constructedUrl();

      expect(url?.parameterCount).toBe(1);
    });

    it('should return null for invalid baseUrl', () => {
      service.form.patchValue({
        baseUrl: 'not-a-url'
      });

      const url = service.constructedUrl();

      expect(url).toBeNull();
    });
  });

  describe('canSave computed signal', () => {
    it('should be false initially', () => {
      expect(service.canSave()).toBe(false);
    });

    it('should be true when baseUrl is valid', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      expect(service.canSave()).toBe(true);
    });

    it('should be false when baseUrl is invalid', () => {
      service.form.patchValue({
        baseUrl: 'not-a-url'
      });

      expect(service.canSave()).toBe(false);
    });

    it('should be false when baseUrl is empty', () => {
      service.form.patchValue({
        baseUrl: ''
      });

      expect(service.canSave()).toBe(false);
    });

    it('should be true even with empty parameters', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      service.addParameter();
      service.params.at(0).patchValue({ key: '', value: '' });

      expect(service.canSave()).toBe(true);
    });

    it('should be true with valid baseUrl and parameters', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      service.addParameter();
      service.params.at(0).patchValue({ key: 'color', value: 'blue' });

      expect(service.canSave()).toBe(true);
    });

    it('should update when form validity changes', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      expect(service.canSave()).toBe(true);

      service.form.patchValue({
        baseUrl: 'not-a-url'
      });

      expect(service.canSave()).toBe(false);
    });
  });

  describe('addParameter', () => {
    it('should add new parameter group to params array', () => {
      const initialLength = service.params.length;

      service.addParameter();

      expect(service.params.length).toBe(initialLength + 1);
    });

    it('should add parameter with empty key and value', () => {
      service.addParameter();

      const param = service.params.at(0);
      expect(param.get('key')?.value).toBe('');
      expect(param.get('value')?.value).toBe('');
    });

    it('should add parameter with validKey validator', () => {
      service.addParameter();

      const param = service.params.at(0);
      param.get('key')?.setValue('invalid&key');

      expect(param.get('key')?.hasError('invalidKey')).toBe(true);
    });

    it('should allow adding multiple parameters', () => {
      service.addParameter();
      service.addParameter();
      service.addParameter();

      expect(service.params.length).toBe(3);
    });
  });

  describe('removeParameter', () => {
    it('should remove parameter at specified index', () => {
      service.addParameter();
      service.addParameter();
      service.addParameter();

      service.removeParameter(1);

      expect(service.params.length).toBe(2);
    });

    it('should remove correct parameter', () => {
      service.addParameter();
      service.addParameter();
      service.params.at(0).patchValue({ key: 'first', value: 'value1' });
      service.params.at(1).patchValue({ key: 'second', value: 'value2' });

      service.removeParameter(0);

      expect(service.params.at(0).get('key')?.value).toBe('second');
    });

    it('should handle removing last parameter', () => {
      service.addParameter();
      service.addParameter();

      service.removeParameter(1);

      expect(service.params.length).toBe(1);
    });

    it('should handle removing first parameter', () => {
      service.addParameter();
      service.addParameter();

      service.removeParameter(0);

      expect(service.params.length).toBe(1);
    });

    it('should not throw error for invalid index (negative)', () => {
      service.addParameter();

      expect(() => {
        service.removeParameter(-1);
      }).not.toThrow();

      expect(service.params.length).toBe(1);
    });

    it('should not throw error for invalid index (too large)', () => {
      service.addParameter();

      expect(() => {
        service.removeParameter(5);
      }).not.toThrow();

      expect(service.params.length).toBe(1);
    });

    it('should not remove anything when index is out of bounds', () => {
      service.addParameter();
      service.addParameter();

      service.removeParameter(10);

      expect(service.params.length).toBe(2);
    });
  });

  describe('loadFormData', () => {
    it('should load baseUrl', () => {
      const formData: UrlBuildForm = {
        baseUrl: 'https://example.com',
        params: []
      };

      service.loadFormData(formData);

      expect(service.form.get('baseUrl')?.value).toBe('https://example.com');
    });

    it('should load UTM parameters', () => {
      const formData: UrlBuildForm = {
        baseUrl: 'https://example.com',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'spring',
        params: []
      };

      service.loadFormData(formData);

      expect(service.form.get('utmSource')?.value).toBe('google');
      expect(service.form.get('utmMedium')?.value).toBe('cpc');
      expect(service.form.get('utmCampaign')?.value).toBe('spring');
    });

    it('should load custom parameters', () => {
      const formData: UrlBuildForm = {
        baseUrl: 'https://example.com',
        params: [
          { key: 'color', value: 'blue' },
          { key: 'size', value: 'large' }
        ]
      };

      service.loadFormData(formData);

      expect(service.params.length).toBe(2);
      expect(service.params.at(0).get('key')?.value).toBe('color');
      expect(service.params.at(0).get('value')?.value).toBe('blue');
      expect(service.params.at(1).get('key')?.value).toBe('size');
      expect(service.params.at(1).get('value')?.value).toBe('large');
    });

    it('should clear existing parameters before loading', () => {
      service.addParameter();
      service.addParameter();
      service.params.at(0).patchValue({ key: 'old', value: 'param' });

      const formData: UrlBuildForm = {
        baseUrl: 'https://example.com',
        params: [
          { key: 'new', value: 'param' }
        ]
      };

      service.loadFormData(formData);

      expect(service.params.length).toBe(1);
      expect(service.params.at(0).get('key')?.value).toBe('new');
    });

    it('should handle loading data with no UTM parameters', () => {
      const formData: UrlBuildForm = {
        baseUrl: 'https://example.com',
        params: []
      };

      service.loadFormData(formData);

      expect(service.form.get('utmSource')?.value).toBe('');
      expect(service.form.get('utmMedium')?.value).toBe('');
      expect(service.form.get('utmCampaign')?.value).toBe('');
    });

    it('should handle loading data with empty params array', () => {
      const formData: UrlBuildForm = {
        baseUrl: 'https://example.com',
        params: []
      };

      service.loadFormData(formData);

      expect(service.params.length).toBe(0);
    });

    it('should update computed signals after loading', () => {
      const formData: UrlBuildForm = {
        baseUrl: 'https://example.com',
        utmSource: 'google',
        params: []
      };

      service.loadFormData(formData);

      const url = service.constructedUrl();
      expect(url).not.toBeNull();
      expect(url?.url).toContain('utm_source=google');
    });
  });

  describe('reset', () => {
    it('should reset form to initial state', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com',
        utmSource: 'google'
      });

      service.reset();

      expect(service.form.get('baseUrl')?.value).toBeNull();
      expect(service.form.get('utmSource')?.value).toBeNull();
    });

    it('should clear all parameters', () => {
      service.addParameter();
      service.addParameter();

      service.reset();

      expect(service.params.length).toBe(0);
    });

    it('should reset form validity', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });
      service.form.markAllAsTouched();

      service.reset();

      expect(service.form.get('baseUrl')?.touched).toBe(false);
    });

    it('should reset computed signals', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      expect(service.constructedUrl()).not.toBeNull();

      service.reset();

      expect(service.constructedUrl()).toBeNull();
    });
  });

  describe('getFormData', () => {
    it('should return null when form is invalid', () => {
      service.form.patchValue({
        baseUrl: ''
      });

      const formData = service.getFormData();

      expect(formData).toBeNull();
    });

    it('should return form data when form is valid', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      const formData = service.getFormData();

      expect(formData).not.toBeNull();
      expect(formData?.baseUrl).toBe('https://example.com');
    });

    it('should include UTM parameters', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com',
        utmSource: 'google',
        utmMedium: 'cpc'
      });

      const formData = service.getFormData();

      expect(formData?.utmSource).toBe('google');
      expect(formData?.utmMedium).toBe('cpc');
    });

    it('should exclude empty UTM parameters', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com',
        utmSource: 'google',
        utmMedium: ''
      });

      const formData = service.getFormData();

      expect(formData?.utmSource).toBe('google');
      expect(formData?.utmMedium).toBeUndefined();
    });

    it('should include only complete parameters', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      service.addParameter();
      service.addParameter();
      service.addParameter();
      service.params.at(0).patchValue({ key: 'color', value: 'blue' });
      service.params.at(1).patchValue({ key: '', value: 'value' });
      service.params.at(2).patchValue({ key: 'size', value: '' });

      const formData = service.getFormData();

      expect(formData?.params.length).toBe(1);
      expect(formData?.params[0]).toEqual({ key: 'color', value: 'blue' });
    });

    it('should filter out incomplete parameters', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      service.addParameter();
      service.params.at(0).patchValue({ key: 'color', value: '' });

      const formData = service.getFormData();

      expect(formData?.params.length).toBe(0);
    });

    it('should return empty params array when no parameters added', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      const formData = service.getFormData();

      expect(formData?.params).toEqual([]);
    });
  });

  describe('params getter', () => {
    it('should return params FormArray', () => {
      const params = service.params;

      expect(params).toBeDefined();
      expect(params.length).toBe(0);
    });

    it('should return same instance as form params', () => {
      const params = service.params;
      const formParams = service.form.get('params') as FormArray;

      expect(params).toBe(formParams);
    });
  });

  describe('form validation integration', () => {
    it('should validate duplicate keys across parameters', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      service.addParameter();
      service.addParameter();
      service.params.at(0).patchValue({ key: 'color', value: 'blue' });
      service.params.at(1).patchValue({ key: 'color', value: 'red' });

      expect(service.params.hasError('duplicateKeys')).toBe(true);
      expect(service.form.invalid).toBe(true);
    });

    it('should validate invalid key characters', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      service.addParameter();
      service.params.at(0).patchValue({ key: 'key=value', value: 'test' });

      expect(service.params.at(0).get('key')?.hasError('invalidKey')).toBe(true);
    });

    it('should allow form to be valid with empty optional fields', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      expect(service.form.valid).toBe(true);
    });
  });

  describe('signal reactivity', () => {
    it('should trigger constructedUrl update on form change', () => {
      let updateCount = 0;
      const subscription = { unsubscribe: () => {} };

      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      const url1 = service.constructedUrl();

      service.form.patchValue({
        utmSource: 'google'
      });

      const url2 = service.constructedUrl();

      expect(url1?.parameterCount).toBe(0);
      expect(url2?.parameterCount).toBe(1);
    });

    it('should trigger canSave update on form validity change', () => {
      service.form.patchValue({
        baseUrl: 'https://example.com'
      });

      const canSave1 = service.canSave();

      service.form.patchValue({
        baseUrl: ''
      });

      const canSave2 = service.canSave();

      expect(canSave1).toBe(true);
      expect(canSave2).toBe(false);
    });
  });
});
