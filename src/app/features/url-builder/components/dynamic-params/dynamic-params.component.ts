/**
 * Dynamic Parameters Component - manages custom query parameters.
 * Follows Single Responsibility: only handles dynamic parameter UI.
 * Fully declarative and composable with reactive forms.
 */

import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { hasError } from '../../../../shared/utils/validation.utils';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-dynamic-params',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, TuiButton, TranslatePipe],
  templateUrl: './dynamic-params.component.html',
  styleUrl: './dynamic-params.component.scss'
})
export class DynamicParamsComponent {
  private readonly translationService = inject(TranslationService);

  /**
   * The FormArray containing parameter form groups.
   */
  readonly paramsArray = input.required<FormArray>();

  /**
   * Callback for adding a new parameter.
   */
  readonly onAdd = input.required<() => void>();

  /**
   * Callback for removing a parameter.
   */
  readonly onRemove = input.required<(index: number) => void>();

  /**
   * Gets the form group at the specified index.
   */
  getParamGroup(index: number): FormGroup {
    return this.paramsArray().at(index) as FormGroup;
  }

  /**
   * Handles add button click.
   */
  handleAdd(): void {
    this.onAdd()();
  }

  /**
   * Handles remove button click.
   */
  handleRemove(index: number): void {
    this.onRemove()(index);
  }

  /**
   * Checks if a control at path has errors and is touched.
   */
  hasError = hasError;

  /**
   * Gets error message for a control with i18n support.
   */
  getErrorMessage(group: FormGroup, controlName: string): string {
    const control = group.get(controlName);

    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return this.translationService.instant('common.validation.required');
    }

    if (control.errors['invalidKey']) {
      return this.translationService.instant('common.validation.invalidKey');
    }

    return this.translationService.instant('common.validation.invalidUrl');
  }
}
