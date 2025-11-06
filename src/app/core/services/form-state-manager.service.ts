/**
 * Service for managing URL builder form state and orchestration.
 * Follows Single Responsibility Principle: manages form state lifecycle only.
 * Acts as a facade/coordinator between multiple services.
 */

import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { UrlBuildForm, QueryParameter, ConstructedUrl } from '../models/url-build.model';
import { UrlBuilderService } from './url-builder.service';
import { absoluteUrlValidator, uniqueKeysValidator, validKeyValidator } from '../validators/url-validators';

/**
 * Type definition for the URL builder form structure.
 */
export type UrlBuilderFormGroup = FormGroup<{
  baseUrl: FormControl<string | null>;
  utmSource: FormControl<string | null>;
  utmMedium: FormControl<string | null>;
  utmCampaign: FormControl<string | null>;
  params: FormArray<FormGroup<{
    key: FormControl<string | null>;
    value: FormControl<string | null>;
  }>>;
}>;

/**
 * Manages the state and logic for the URL builder form.
 * Decouples form management from component presentation logic.
 */
@Injectable()
export class FormStateManagerService {
  private readonly fb = inject(FormBuilder);
  private readonly urlBuilder = inject(UrlBuilderService);

  /**
   * The main form group for URL building.
   * Initialized in constructor before being used in signals.
   */
  readonly form: UrlBuilderFormGroup = this.fb.group({
    baseUrl: ['', [Validators.required, absoluteUrlValidator()]],
    utmSource: [''],
    utmMedium: [''],
    utmCampaign: [''],
    params: this.fb.array<FormGroup<{
      key: FormControl<string | null>;
      value: FormControl<string | null>;
    }>>([], [uniqueKeysValidator()])
  });

  /**
   * Signal that emits the current form value on changes.
   * Converts the Observable valueChanges to a signal using toSignal().
   * PERFORMANCE: Includes 300ms debouncing to reduce unnecessary URL rebuilds during typing.
   * More efficient than counter signal + subscription pattern.
   */
  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(debounceTime(300)),
    { initialValue: this.form.value }
  );

  /**
   * Computed signal for the constructed URL.
   * Automatically recalculates when form values change via formValue signal.
   */
  readonly constructedUrl = computed<ConstructedUrl | null>(() => {
    // formValue signal automatically tracks form changes
    const currentValue = this.formValue();

    const formData: Partial<UrlBuildForm> = {
      baseUrl: currentValue.baseUrl ?? undefined,
      utmSource: currentValue.utmSource ?? undefined,
      utmMedium: currentValue.utmMedium ?? undefined,
      utmCampaign: currentValue.utmCampaign ?? undefined,
      params: (currentValue.params ?? [])
        .filter((p): p is QueryParameter => !!(p.key && p.value))
        .map(p => ({ key: p.key!, value: p.value! }))
    };

    return this.urlBuilder.buildUrl(formData);
  });

  /**
   * Computed signal for whether the form is valid and has a URL.
   * A form is saveable if the base URL is valid, even if params are empty.
   */
  readonly canSave = computed(() => {
    // Track form changes via formValue signal
    this.formValue();

    // Check if we have a constructed URL (means base URL is valid)
    const hasValidUrl = !!this.constructedUrl();

    // Check if base URL control is valid
    const baseUrlValid = this.form.get('baseUrl')?.valid ?? false;

    // Form is saveable if base URL is valid, regardless of empty param fields
    return baseUrlValid && hasValidUrl;
  });

  /**
   * Gets the params FormArray.
   */
  get params(): FormArray {
    return this.form.get('params') as FormArray;
  }

  /**
   * Adds a new parameter group to the form.
   * Parameters are optional - only validated if values are entered.
   */
  addParameter(): void {
    const paramGroup = this.fb.group({
      key: new FormControl('', {
        validators: [validKeyValidator()],
        nonNullable: true
      }),
      value: new FormControl('', {
        nonNullable: true
      })
    });

    this.params.push(paramGroup);
  }

  /**
   * Removes a parameter at the specified index.
   *
   * @param index - Index of parameter to remove
   */
  removeParameter(index: number): void {
    if (index >= 0 && index < this.params.length) {
      this.params.removeAt(index);
    }
  }

  /**
   * Loads form data from a UrlBuildForm object.
   *
   * @param data - Form data to load
   */
  loadFormData(data: UrlBuildForm): void {
    // Clear existing params
    this.params.clear();

    // Set form values
    this.form.patchValue({
      baseUrl: data.baseUrl,
      utmSource: data.utmSource ?? '',
      utmMedium: data.utmMedium ?? '',
      utmCampaign: data.utmCampaign ?? ''
    });

    // Recreate param groups
    data.params.forEach(param => {
      const paramGroup = this.fb.group({
        key: new FormControl(param.key, {
          validators: [validKeyValidator()],
          nonNullable: true
        }),
        value: new FormControl(param.value, {
          nonNullable: true
        })
      });
      this.params.push(paramGroup);
    });
  }

  /**
   * Resets the form to its initial state.
   */
  reset(): void {
    this.form.reset();
    this.params.clear();
  }

  /**
   * Gets the current form data as a UrlBuildForm object.
   * Only returns data if form is valid.
   *
   * @returns UrlBuildForm or null if form is invalid
   */
  getFormData(): UrlBuildForm | null {
    if (!this.form.valid) {
      return null;
    }

    const formValue = this.form.getRawValue();

    return {
      baseUrl: formValue.baseUrl!,
      utmSource: formValue.utmSource || undefined,
      utmMedium: formValue.utmMedium || undefined,
      utmCampaign: formValue.utmCampaign || undefined,
      params: (formValue.params ?? [])
        .filter((p): p is QueryParameter => !!(p.key && p.value))
        .map(p => ({ key: p.key!, value: p.value! }))
    };
  }
}
