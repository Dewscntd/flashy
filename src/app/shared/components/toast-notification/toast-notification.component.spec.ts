/**
 * Unit tests for ToastNotificationComponent
 * Tests notification display and dismiss functionality
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ToastNotificationComponent } from './toast-notification.component';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ToastNotificationComponent', () => {
  let component: ToastNotificationComponent;
  let fixture: ComponentFixture<ToastNotificationComponent>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockNotificationsSignal: any;

  beforeEach(async () => {
    mockNotificationsSignal = signal<ReadonlyArray<Notification>>([]);

    mockNotificationService = jasmine.createSpyObj('NotificationService', ['dismiss'], {
      notifications$: mockNotificationsSignal.asReadonly()
    });

    await TestBed.configureTestingModule({
      imports: [ToastNotificationComponent, HttpClientTestingModule],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should get notifications from service', () => {
      expect(component.notifications).toBe(mockNotificationService.notifications$);
    });

    it('should start with empty notifications', () => {
      expect(component.notifications()).toEqual([]);
    });
  });

  describe('dismiss', () => {
    it('should call notification service dismiss', () => {
      component.dismiss('test-id');

      expect(mockNotificationService.dismiss).toHaveBeenCalledWith('test-id');
    });

    it('should call dismiss with correct ID', () => {
      component.dismiss('notification-123');

      expect(mockNotificationService.dismiss).toHaveBeenCalledWith('notification-123');
    });

    it('should handle multiple dismiss calls', () => {
      component.dismiss('id1');
      component.dismiss('id2');
      component.dismiss('id3');

      expect(mockNotificationService.dismiss).toHaveBeenCalledTimes(3);
      expect(mockNotificationService.dismiss).toHaveBeenCalledWith('id1');
      expect(mockNotificationService.dismiss).toHaveBeenCalledWith('id2');
      expect(mockNotificationService.dismiss).toHaveBeenCalledWith('id3');
    });
  });

  describe('getIcon', () => {
    it('should return checkmark for success type', () => {
      const icon = component.getIcon('success');
      expect(icon).toBe('✓');
    });

    it('should return X for error type', () => {
      const icon = component.getIcon('error');
      expect(icon).toBe('✕');
    });

    it('should return warning symbol for warning type', () => {
      const icon = component.getIcon('warning');
      expect(icon).toBe('⚠');
    });

    it('should return info symbol for info type', () => {
      const icon = component.getIcon('info');
      expect(icon).toBe('ℹ');
    });

    it('should return info symbol for unknown type', () => {
      const icon = component.getIcon('unknown' as any);
      expect(icon).toBe('ℹ');
    });

    it('should return info symbol for empty string', () => {
      const icon = component.getIcon('');
      expect(icon).toBe('ℹ');
    });

    it('should handle case sensitivity', () => {
      const icon1 = component.getIcon('SUCCESS' as any);
      const icon2 = component.getIcon('Success' as any);

      // Should not match, return default
      expect(icon1).toBe('ℹ');
      expect(icon2).toBe('ℹ');
    });
  });

  describe('getTypeClass', () => {
    it('should return toast-success for success type', () => {
      const cssClass = component.getTypeClass('success');
      expect(cssClass).toBe('toast-success');
    });

    it('should return toast-error for error type', () => {
      const cssClass = component.getTypeClass('error');
      expect(cssClass).toBe('toast-error');
    });

    it('should return toast-warning for warning type', () => {
      const cssClass = component.getTypeClass('warning');
      expect(cssClass).toBe('toast-warning');
    });

    it('should return toast-info for info type', () => {
      const cssClass = component.getTypeClass('info');
      expect(cssClass).toBe('toast-info');
    });

    it('should handle any type string', () => {
      const cssClass = component.getTypeClass('custom' as any);
      expect(cssClass).toBe('toast-custom');
    });

    it('should handle empty string', () => {
      const cssClass = component.getTypeClass('');
      expect(cssClass).toBe('toast-');
    });

    it('should preserve case', () => {
      const cssClass = component.getTypeClass('SUCCESS' as any);
      expect(cssClass).toBe('toast-SUCCESS');
    });
  });

  describe('notification display', () => {
    it('should display success notification', () => {
      const notification: Notification = {
        id: '1',
        message: 'Success message',
        type: 'success',
        duration: 3000
      };
      mockNotificationsSignal.set([notification]);

      expect(component.notifications().length).toBe(1);
      expect(component.notifications()[0].type).toBe('success');
      expect(component.notifications()[0].message).toBe('Success message');
    });

    it('should display error notification', () => {
      const notification: Notification = {
        id: '1',
        message: 'Error message',
        type: 'error',
        duration: 3000
      };
      mockNotificationsSignal.set([notification]);

      expect(component.notifications()[0].type).toBe('error');
    });

    it('should display warning notification', () => {
      const notification: Notification = {
        id: '1',
        message: 'Warning message',
        type: 'warning',
        duration: 3000
      };
      mockNotificationsSignal.set([notification]);

      expect(component.notifications()[0].type).toBe('warning');
    });

    it('should display info notification', () => {
      const notification: Notification = {
        id: '1',
        message: 'Info message',
        type: 'info',
        duration: 3000
      };
      mockNotificationsSignal.set([notification]);

      expect(component.notifications()[0].type).toBe('info');
    });

    it('should display multiple notifications', () => {
      const notifications: Notification[] = [
        { id: '1', message: 'Message 1', type: 'success', duration: 3000 },
        { id: '2', message: 'Message 2', type: 'error', duration: 3000 },
        { id: '3', message: 'Message 3', type: 'warning', duration: 3000 }
      ];
      mockNotificationsSignal.set(notifications);

      expect(component.notifications().length).toBe(3);
    });

    it('should display notifications in order', () => {
      const notifications: Notification[] = [
        { id: '1', message: 'First', type: 'info', duration: 3000 },
        { id: '2', message: 'Second', type: 'success', duration: 3000 },
        { id: '3', message: 'Third', type: 'error', duration: 3000 }
      ];
      mockNotificationsSignal.set(notifications);

      const displayed = component.notifications();
      expect(displayed[0].message).toBe('First');
      expect(displayed[1].message).toBe('Second');
      expect(displayed[2].message).toBe('Third');
    });
  });

  describe('reactivity', () => {
    it('should update when notifications change', () => {
      const notifications1: Notification[] = [
        { id: '1', message: 'Message 1', type: 'success', duration: 3000 }
      ];
      mockNotificationsSignal.set(notifications1);

      expect(component.notifications().length).toBe(1);

      const notifications2: Notification[] = [
        { id: '1', message: 'Message 1', type: 'success', duration: 3000 },
        { id: '2', message: 'Message 2', type: 'error', duration: 3000 }
      ];
      mockNotificationsSignal.set(notifications2);

      expect(component.notifications().length).toBe(2);
    });

    it('should update when notification removed', () => {
      const notifications: Notification[] = [
        { id: '1', message: 'Message 1', type: 'success', duration: 3000 },
        { id: '2', message: 'Message 2', type: 'error', duration: 3000 }
      ];
      mockNotificationsSignal.set(notifications);

      expect(component.notifications().length).toBe(2);

      mockNotificationsSignal.set([notifications[0]]);

      expect(component.notifications().length).toBe(1);
    });

    it('should update when all notifications cleared', () => {
      const notifications: Notification[] = [
        { id: '1', message: 'Message 1', type: 'success', duration: 3000 }
      ];
      mockNotificationsSignal.set(notifications);

      expect(component.notifications().length).toBe(1);

      mockNotificationsSignal.set([]);

      expect(component.notifications().length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty notifications array', () => {
      mockNotificationsSignal.set([]);

      expect(component.notifications()).toEqual([]);
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle notification with empty message', () => {
      const notification: Notification = {
        id: '1',
        message: '',
        type: 'info',
        duration: 3000
      };
      mockNotificationsSignal.set([notification]);

      expect(component.notifications()[0].message).toBe('');
    });

    it('should handle notification with very long message', () => {
      const longMessage = 'a'.repeat(1000);
      const notification: Notification = {
        id: '1',
        message: longMessage,
        type: 'info',
        duration: 3000
      };
      mockNotificationsSignal.set([notification]);

      expect(component.notifications()[0].message).toBe(longMessage);
    });

    it('should handle notification with special characters in message', () => {
      const notification: Notification = {
        id: '1',
        message: '<script>alert("xss")</script>',
        type: 'error',
        duration: 3000
      };
      mockNotificationsSignal.set([notification]);

      expect(component.notifications()[0].message).toContain('script');
    });

    it('should handle notification with Unicode characters', () => {
      const notification: Notification = {
        id: '1',
        message: 'Hello 世界 🌍',
        type: 'success',
        duration: 3000
      };
      mockNotificationsSignal.set([notification]);

      expect(component.notifications()[0].message).toBe('Hello 世界 🌍');
    });

    it('should handle notification without duration', () => {
      const notification: Notification = {
        id: '1',
        message: 'Test',
        type: 'info'
      };
      mockNotificationsSignal.set([notification]);

      expect(component.notifications()[0].duration).toBeUndefined();
    });

    it('should handle dismiss with empty string ID', () => {
      expect(() => {
        component.dismiss('');
      }).not.toThrow();

      expect(mockNotificationService.dismiss).toHaveBeenCalledWith('');
    });

    it('should handle dismiss with special characters in ID', () => {
      expect(() => {
        component.dismiss('id-with-special-chars-!@#$%');
      }).not.toThrow();
    });
  });

  describe('pure presentation logic', () => {
    it('should not modify notification data', () => {
      const notification: Notification = {
        id: '1',
        message: 'Test message',
        type: 'success',
        duration: 3000
      };
      const originalNotification = { ...notification };
      mockNotificationsSignal.set([notification]);

      component.getIcon(notification.type);
      component.getTypeClass(notification.type);

      expect(component.notifications()[0]).toEqual(originalNotification);
    });

    it('should be stateless except for injected service', () => {
      const icon1 = component.getIcon('success');
      const icon2 = component.getIcon('success');

      expect(icon1).toBe(icon2);

      const class1 = component.getTypeClass('error');
      const class2 = component.getTypeClass('error');

      expect(class1).toBe(class2);
    });

    it('should delegate all state to service', () => {
      expect(component.notifications).toBe(mockNotificationService.notifications$);
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid notification changes', () => {
      const notifications1: Notification[] = [
        { id: '1', message: 'Message 1', type: 'success', duration: 3000 }
      ];
      mockNotificationsSignal.set(notifications1);

      const notifications2: Notification[] = [
        { id: '2', message: 'Message 2', type: 'error', duration: 3000 }
      ];
      mockNotificationsSignal.set(notifications2);

      const notifications3: Notification[] = [];
      mockNotificationsSignal.set(notifications3);

      expect(component.notifications()).toEqual([]);
    });

    it('should support dismiss and re-add', () => {
      const notification: Notification = {
        id: '1',
        message: 'Test',
        type: 'info',
        duration: 3000
      };

      mockNotificationsSignal.set([notification]);
      expect(component.notifications().length).toBe(1);

      component.dismiss('1');

      mockNotificationsSignal.set([]);
      expect(component.notifications().length).toBe(0);

      mockNotificationsSignal.set([notification]);
      expect(component.notifications().length).toBe(1);
    });

    it('should handle all notification types together', () => {
      const notifications: Notification[] = [
        { id: '1', message: 'Success', type: 'success', duration: 3000 },
        { id: '2', message: 'Error', type: 'error', duration: 3000 },
        { id: '3', message: 'Warning', type: 'warning', duration: 3000 },
        { id: '4', message: 'Info', type: 'info', duration: 3000 }
      ];
      mockNotificationsSignal.set(notifications);

      expect(component.getIcon('success')).toBe('✓');
      expect(component.getIcon('error')).toBe('✕');
      expect(component.getIcon('warning')).toBe('⚠');
      expect(component.getIcon('info')).toBe('ℹ');

      expect(component.notifications().length).toBe(4);
    });
  });
});
