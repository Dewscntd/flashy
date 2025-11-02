/**
 * Dynamic Parameters Component - manages custom query parameters.
 * Follows Single Responsibility: only handles dynamic parameter UI.
 * Fully declarative and composable with reactive forms.
 */

import { Component, input } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dynamic-params',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dynamic-params.component.html',
  styleUrl: './dynamic-params.component.css'
})
export class DynamicParamsComponent {
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
  hasError(group: FormGroup, controlName: string): boolean {
    const control = group.get(controlName);
    return !!(control?.invalid && control?.touched);
  }

  /**
   * Gets error message for a control.
   */
  getErrorMessage(group: FormGroup, controlName: string): string {
    const control = group.get(controlName);

    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `${controlName} is required`;
    }

    if (control.errors['invalidKey']) {
      return control.errors['invalidKey'].message;
    }

    return 'Invalid value';
  }
}
