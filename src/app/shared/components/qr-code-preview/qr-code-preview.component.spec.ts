/**
 * Unit tests for QrCodePreviewComponent
 * Tests QR code display and interaction logic.
 * Focus: User interactions, event emissions, computed state.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { QrCodePreviewComponent } from './qr-code-preview.component';
import {
  ErrorCorrectionLevel,
  QrCodeExportFormat,
  QrCodeSizePreset
} from '../../../core/models/qr-code.model';

describe('QrCodePreviewComponent', () => {
  let component: QrCodePreviewComponent;
  let fixture: ComponentFixture<QrCodePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrCodePreviewComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(QrCodePreviewComponent);
    component = fixture.componentInstance;

    // Set required input
    fixture.componentRef.setInput('qrData', 'https://example.com');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onSizeChange', () => {
    it('should update selected size signal', () => {
      component.onSizeChange(QrCodeSizePreset.LARGE);

      expect(component.selectedSize()).toBe(QrCodeSizePreset.LARGE);
    });

    it('should emit options changed event', () => {
      spyOn(component.optionsChanged, 'emit');

      component.onSizeChange(QrCodeSizePreset.XLARGE);

      expect(component.optionsChanged.emit).toHaveBeenCalledWith({
        width: QrCodeSizePreset.XLARGE
      });
    });

    it('should update current options computed signal', () => {
      component.onSizeChange(QrCodeSizePreset.SMALL);

      expect(component.currentOptions().width).toBe(QrCodeSizePreset.SMALL);
    });
  });

  describe('onErrorCorrectionChange', () => {
    it('should update selected error correction signal', () => {
      component.onErrorCorrectionChange(ErrorCorrectionLevel.H);

      expect(component.selectedErrorCorrection()).toBe(ErrorCorrectionLevel.H);
    });

    it('should emit options changed event', () => {
      spyOn(component.optionsChanged, 'emit');

      component.onErrorCorrectionChange(ErrorCorrectionLevel.Q);

      expect(component.optionsChanged.emit).toHaveBeenCalledWith({
        errorCorrectionLevel: ErrorCorrectionLevel.Q
      });
    });

    it('should update current options computed signal', () => {
      component.onErrorCorrectionChange(ErrorCorrectionLevel.L);

      expect(component.currentOptions().errorCorrectionLevel).toBe(ErrorCorrectionLevel.L);
    });
  });

  describe('onDownload', () => {
    it('should emit download requested event for PNG', () => {
      spyOn(component.downloadRequested, 'emit');

      component.onDownload(QrCodeExportFormat.PNG);

      expect(component.downloadRequested.emit).toHaveBeenCalledWith(QrCodeExportFormat.PNG);
    });

    it('should emit download requested event for JPEG', () => {
      spyOn(component.downloadRequested, 'emit');

      component.onDownload(QrCodeExportFormat.JPEG);

      expect(component.downloadRequested.emit).toHaveBeenCalledWith(QrCodeExportFormat.JPEG);
    });

    it('should emit download requested event for SVG', () => {
      spyOn(component.downloadRequested, 'emit');

      component.onDownload(QrCodeExportFormat.SVG);

      expect(component.downloadRequested.emit).toHaveBeenCalledWith(QrCodeExportFormat.SVG);
    });
  });

  describe('onCopy', () => {
    it('should emit copy requested event', () => {
      spyOn(component.copyRequested, 'emit');

      component.onCopy();

      expect(component.copyRequested.emit).toHaveBeenCalled();
    });
  });

  describe('currentOptions computed', () => {
    it('should merge input options with local selections', () => {
      fixture.componentRef.setInput('options', {
        width: 256,
        errorCorrectionLevel: ErrorCorrectionLevel.M,
        margin: 4,
        colorDark: '#000000',
        colorLight: '#FFFFFF',
        renderType: 'canvas' as any
      });
      fixture.detectChanges();

      component.onSizeChange(QrCodeSizePreset.LARGE);
      component.onErrorCorrectionChange(ErrorCorrectionLevel.H);

      const options = component.currentOptions();
      expect(options.width).toBe(QrCodeSizePreset.LARGE);
      expect(options.errorCorrectionLevel).toBe(ErrorCorrectionLevel.H);
      expect(options.margin).toBe(4);
    });

    it('should use input options by default', () => {
      const customOptions = {
        width: 512,
        errorCorrectionLevel: ErrorCorrectionLevel.Q,
        margin: 2,
        colorDark: '#FF0000',
        colorLight: '#00FF00',
        renderType: 'svg' as any
      };
      fixture.componentRef.setInput('options', customOptions);
      fixture.detectChanges();

      const options = component.currentOptions();
      expect(options.colorDark).toBe('#FF0000');
      expect(options.colorLight).toBe('#00FF00');
      expect(options.margin).toBe(2);
    });
  });
});
