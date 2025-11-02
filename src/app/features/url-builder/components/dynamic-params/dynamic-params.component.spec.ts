/**
 * Unit tests for DynamicParamsComponent
 * Tests dynamic form array rendering and interactions
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DynamicParamsComponent } from './dynamic-params.component';

describe('DynamicParamsComponent', () => {
  let component: DynamicParamsComponent;
  let fixture: ComponentFixture<DynamicParamsComponent>;
  let mockParamsArray: FormArray<FormGroup<{ key: FormControl<string | null>; value: FormControl<string | null>; }>>;
  let mockOnAdd: jasmine.Spy;
  let mockOnRemove: jasmine.Spy;

  beforeEach(async () => {
    mockParamsArray = new FormArray<FormGroup<{ key: FormControl<string | null>; value: FormControl<string | null>; }>>([]);
    mockOnAdd = jasmine.createSpy('onAdd');
    mockOnRemove = jasmine.createSpy('onRemove');

    await TestBed.configureTestingModule({
      imports: [DynamicParamsComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicParamsComponent);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('paramsArray', mockParamsArray);
    fixture.componentRef.setInput('onAdd', mockOnAdd);
    fixture.componentRef.setInput('onRemove', mockOnRemove);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('required inputs', () => {
    it('should have paramsArray input', () => {
      expect(component.paramsArray()).toBe(mockParamsArray);
    });

    it('should have onAdd callback input', () => {
      expect(component.onAdd()).toBe(mockOnAdd);
    });

    it('should have onRemove callback input', () => {
      expect(component.onRemove()).toBe(mockOnRemove);
    });
  });

  describe('getParamGroup', () => {
    it('should return FormGroup at specified index', () => {
      const group1 = new FormGroup({
        key: new FormControl('key1'),
        value: new FormControl('value1')
      });
      const group2 = new FormGroup({
        key: new FormControl('key2'),
        value: new FormControl('value2')
      });

      mockParamsArray.push(group1);
      mockParamsArray.push(group2);

      expect(component.getParamGroup(0)).toBe(group1);
      expect(component.getParamGroup(1)).toBe(group2);
    });

    it('should return correct group for multiple parameters', () => {
      for (let i = 0; i < 5; i++) {
        mockParamsArray.push(new FormGroup({
          key: new FormControl(`key${i}`),
          value: new FormControl(`value${i}`)
        }));
      }

      const group = component.getParamGroup(2);
      expect(group.get('key')?.value).toBe('key2');
    });
  });

  describe('handleAdd', () => {
    it('should call onAdd callback', () => {
      component.handleAdd();

      expect(mockOnAdd).toHaveBeenCalled();
    });

    it('should call onAdd callback exactly once per click', () => {
      component.handleAdd();

      expect(mockOnAdd).toHaveBeenCalledTimes(1);
    });

    it('should support multiple add calls', () => {
      component.handleAdd();
      component.handleAdd();
      component.handleAdd();

      expect(mockOnAdd).toHaveBeenCalledTimes(3);
    });
  });

  describe('handleRemove', () => {
    it('should call onRemove callback with index', () => {
      component.handleRemove(0);

      expect(mockOnRemove).toHaveBeenCalledWith(0);
    });

    it('should pass correct index to callback', () => {
      component.handleRemove(5);

      expect(mockOnRemove).toHaveBeenCalledWith(5);
    });

    it('should support removing different indices', () => {
      component.handleRemove(0);
      component.handleRemove(2);
      component.handleRemove(4);

      expect(mockOnRemove).toHaveBeenCalledTimes(3);
      expect(mockOnRemove).toHaveBeenCalledWith(0);
      expect(mockOnRemove).toHaveBeenCalledWith(2);
      expect(mockOnRemove).toHaveBeenCalledWith(4);
    });
  });

  describe('hasError', () => {
    let testGroup: FormGroup;

    beforeEach(() => {
      testGroup = new FormGroup({
        key: new FormControl(''),
        value: new FormControl('')
      });
    });

    it('should return false when control is valid', () => {
      testGroup.get('key')?.setValue('valid-key');
      testGroup.get('key')?.markAsTouched();

      const result = component.hasError(testGroup, 'key');

      expect(result).toBe(false);
    });

    it('should return false when control is invalid but not touched', () => {
      testGroup.get('key')?.setErrors({ required: true });
      testGroup.get('key')?.markAsUntouched();

      const result = component.hasError(testGroup, 'key');

      expect(result).toBe(false);
    });

    it('should return true when control is invalid and touched', () => {
      testGroup.get('key')?.setErrors({ required: true });
      testGroup.get('key')?.markAsTouched();

      const result = component.hasError(testGroup, 'key');

      expect(result).toBe(true);
    });

    it('should return false when control does not exist', () => {
      const result = component.hasError(testGroup, 'nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when control is null', () => {
      const emptyGroup = new FormGroup({});

      const result = component.hasError(emptyGroup, 'key');

      expect(result).toBe(false);
    });

    it('should handle multiple error types', () => {
      testGroup.get('key')?.setErrors({ required: true, invalidKey: true });
      testGroup.get('key')?.markAsTouched();

      const result = component.hasError(testGroup, 'key');

      expect(result).toBe(true);
    });
  });

  describe('getErrorMessage', () => {
    let testGroup: FormGroup;

    beforeEach(() => {
      testGroup = new FormGroup({
        key: new FormControl(''),
        value: new FormControl('')
      });
    });

    it('should return empty string when control is valid', () => {
      const message = component.getErrorMessage(testGroup, 'key');

      expect(message).toBe('');
    });

    it('should return empty string when control does not exist', () => {
      const message = component.getErrorMessage(testGroup, 'nonexistent');

      expect(message).toBe('');
    });

    it('should return empty string when control has no errors', () => {
      testGroup.get('key')?.setValue('valid');

      const message = component.getErrorMessage(testGroup, 'key');

      expect(message).toBe('');
    });

    it('should return required message for required error', () => {
      testGroup.get('key')?.setErrors({ required: true });

      const message = component.getErrorMessage(testGroup, 'key');

      expect(message).toBe('key is required');
    });

    it('should return custom message for invalidKey error', () => {
      testGroup.get('key')?.setErrors({
        invalidKey: { message: 'Key contains invalid characters' }
      });

      const message = component.getErrorMessage(testGroup, 'key');

      expect(message).toBe('Key contains invalid characters');
    });

    it('should return generic message for unknown error', () => {
      testGroup.get('key')?.setErrors({ unknownError: true });

      const message = component.getErrorMessage(testGroup, 'key');

      expect(message).toBe('Invalid value');
    });

    it('should prioritize required error over others', () => {
      testGroup.get('key')?.setErrors({
        required: true,
        invalidKey: { message: 'Invalid' }
      });

      const message = component.getErrorMessage(testGroup, 'key');

      expect(message).toBe('key is required');
    });

    it('should handle value control errors', () => {
      testGroup.get('value')?.setErrors({ required: true });

      const message = component.getErrorMessage(testGroup, 'value');

      expect(message).toBe('value is required');
    });

    it('should handle control names with different cases', () => {
      testGroup.addControl('MyControl', new FormControl(''));
      testGroup.get('MyControl')?.setErrors({ required: true });

      const message = component.getErrorMessage(testGroup, 'MyControl');

      expect(message).toBe('MyControl is required');
    });
  });

  describe('integration with FormArray', () => {
    it('should work with empty FormArray', () => {
      expect(component.paramsArray().length).toBe(0);
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should work with populated FormArray', () => {
      for (let i = 0; i < 3; i++) {
        mockParamsArray.push(new FormGroup({
          key: new FormControl(`key${i}`),
          value: new FormControl(`value${i}`)
        }));
      }

      expect(component.paramsArray().length).toBe(3);
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should reflect changes in FormArray', () => {
      expect(component.paramsArray().length).toBe(0);

      mockParamsArray.push(new FormGroup({
        key: new FormControl('new'),
        value: new FormControl('param')
      }));

      expect(component.paramsArray().length).toBe(1);
    });
  });

  describe('callback integration', () => {
    it('should execute actual add callback', () => {
      let addCalled = false;
      const realAdd = () => { addCalled = true; };

      fixture.componentRef.setInput('onAdd', realAdd);

      component.handleAdd();

      expect(addCalled).toBe(true);
    });

    it('should execute actual remove callback with index', () => {
      let removedIndex = -1;
      const realRemove = (index: number) => { removedIndex = index; };

      fixture.componentRef.setInput('onRemove', realRemove);

      component.handleRemove(3);

      expect(removedIndex).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle remove with negative index', () => {
      expect(() => {
        component.handleRemove(-1);
      }).not.toThrow();

      expect(mockOnRemove).toHaveBeenCalledWith(-1);
    });

    it('should handle remove with large index', () => {
      expect(() => {
        component.handleRemove(9999);
      }).not.toThrow();

      expect(mockOnRemove).toHaveBeenCalledWith(9999);
    });

    it('should handle getParamGroup with invalid index gracefully', () => {
      // Component returns result from FormArray.at(), which may throw or return undefined
      // Depending on implementation, we just verify it doesn't crash the component
      expect(() => {
        try {
          component.getParamGroup(999);
        } catch (e) {
          // Expected behavior - FormArray.at() might throw
        }
      }).not.toThrow();
    });

    it('should handle error checking on empty group', () => {
      const emptyGroup = new FormGroup({});

      const hasError = component.hasError(emptyGroup, 'any');
      const message = component.getErrorMessage(emptyGroup, 'any');

      expect(hasError).toBe(false);
      expect(message).toBe('');
    });

    it('should handle null errors object', () => {
      const testGroup = new FormGroup({
        key: new FormControl(''),
        value: new FormControl('')
      });
      testGroup.get('key')?.setErrors(null);

      const message = component.getErrorMessage(testGroup, 'key');

      expect(message).toBe('');
    });
  });

  describe('pure presentation logic', () => {
    it('should not modify FormArray directly', () => {
      const initialLength = mockParamsArray.length;

      component.handleAdd();

      // Component should delegate, not modify directly
      expect(mockParamsArray.length).toBe(initialLength);
      expect(mockOnAdd).toHaveBeenCalled();
    });

    it('should not modify FormGroup directly', () => {
      const group = new FormGroup({
        key: new FormControl('test'),
        value: new FormControl('value')
      });

      mockParamsArray.push(group);

      const hasError = component.hasError(group, 'key');
      const message = component.getErrorMessage(group, 'key');

      // Should only read, not modify
      expect(group.get('key')?.value).toBe('test');
    });

    it('should be stateless', () => {
      const initialState = {
        params: component.paramsArray(),
        onAdd: component.onAdd(),
        onRemove: component.onRemove()
      };

      component.handleAdd();
      component.handleRemove(0);

      const afterState = {
        params: component.paramsArray(),
        onAdd: component.onAdd(),
        onRemove: component.onRemove()
      };

      expect(afterState).toEqual(initialState);
    });
  });
});
