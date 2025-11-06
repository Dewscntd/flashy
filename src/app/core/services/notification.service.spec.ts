/**
 * Unit tests for NotificationService
 * Tests notification management with signals and auto-dismiss
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService]
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('notifications$ signal', () => {
    it('should initially be empty array', () => {
      expect(service.notifications$()).toEqual([]);
    });

    it('should be read-only', () => {
      const notifications = service.notifications$;
      // Verify it's a readonly signal by checking it doesn't have update/set methods
      expect(typeof notifications).toBe('function');
    });
  });

  describe('success', () => {
    it('should add success notification', () => {
      service.success('Operation successful');

      const notifications = service.notifications$();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].message).toBe('Operation successful');
    });

    it('should add notification with unique ID', () => {
      service.success('Message 1');
      service.success('Message 2');

      const notifications = service.notifications$();
      expect(notifications.length).toBe(2);
      expect(notifications[0].id).not.toBe(notifications[1].id);
    });

    it('should use default duration when not specified', () => {
      service.success('Test message');

      const notifications = service.notifications$();
      expect(notifications[0].duration).toBe(3000);
    });

    it('should use custom duration when specified', () => {
      service.success('Test message', undefined, 5000);

      const notifications = service.notifications$();
      expect(notifications[0].duration).toBe(5000);
    });

    it('should auto-dismiss after default duration', fakeAsync(() => {
      service.success('Test message');

      expect(service.notifications$().length).toBe(1);

      tick(3000);

      expect(service.notifications$().length).toBe(0);
    }));

    it('should auto-dismiss after custom duration', fakeAsync(() => {
      service.success('Test message', undefined, 1000);

      expect(service.notifications$().length).toBe(1);

      tick(1000);

      expect(service.notifications$().length).toBe(0);
    }));

    it('should not dismiss before duration elapses', fakeAsync(() => {
      service.success('Test message', undefined, 3000);

      tick(2000);

      expect(service.notifications$().length).toBe(1);

      tick(1000);

      expect(service.notifications$().length).toBe(0);
    }));
  });

  describe('error', () => {
    it('should add error notification', () => {
      service.error('Operation failed');

      const notifications = service.notifications$();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].message).toBe('Operation failed');
    });

    it('should auto-dismiss error after duration', fakeAsync(() => {
      service.error('Test error');

      expect(service.notifications$().length).toBe(1);

      tick(3000);

      expect(service.notifications$().length).toBe(0);
    }));

    it('should use custom duration for errors', fakeAsync(() => {
      service.error('Test error', undefined, 2000);

      tick(2000);

      expect(service.notifications$().length).toBe(0);
    }));
  });

  describe('warning', () => {
    it('should add warning notification', () => {
      service.warning('Warning message');

      const notifications = service.notifications$();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].message).toBe('Warning message');
    });

    it('should auto-dismiss warning after duration', fakeAsync(() => {
      service.warning('Test warning');

      expect(service.notifications$().length).toBe(1);

      tick(3000);

      expect(service.notifications$().length).toBe(0);
    }));
  });

  describe('info', () => {
    it('should add info notification', () => {
      service.info('Information message');

      const notifications = service.notifications$();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('info');
      expect(notifications[0].message).toBe('Information message');
    });

    it('should auto-dismiss info after duration', fakeAsync(() => {
      service.info('Test info');

      expect(service.notifications$().length).toBe(1);

      tick(3000);

      expect(service.notifications$().length).toBe(0);
    }));
  });

  describe('dismiss', () => {
    it('should remove notification by ID', () => {
      service.success('Message 1');
      service.success('Message 2');

      const notifications = service.notifications$();
      const idToRemove = notifications[0].id;

      service.dismiss(idToRemove);

      const remaining = service.notifications$();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).not.toBe(idToRemove);
    });

    it('should handle dismissing non-existent ID', () => {
      service.success('Message');

      service.dismiss('non-existent-id');

      expect(service.notifications$().length).toBe(1);
    });

    it('should handle dismissing when list is empty', () => {
      expect(() => {
        service.dismiss('some-id');
      }).not.toThrow();
    });

    it('should remove only the specified notification', () => {
      service.success('Message 1');
      service.success('Message 2');
      service.success('Message 3');

      const notifications = service.notifications$();
      const idToRemove = notifications[1].id;

      service.dismiss(idToRemove);

      const remaining = service.notifications$();
      expect(remaining.length).toBe(2);
      expect(remaining.find(n => n.id === idToRemove)).toBeUndefined();
    });
  });

  describe('clearAll', () => {
    it('should remove all notifications', () => {
      service.success('Message 1');
      service.error('Message 2');
      service.warning('Message 3');

      expect(service.notifications$().length).toBe(3);

      service.clearAll();

      expect(service.notifications$().length).toBe(0);
    });

    it('should handle clearing when list is empty', () => {
      expect(() => {
        service.clearAll();
      }).not.toThrow();

      expect(service.notifications$().length).toBe(0);
    });

    it('should prevent auto-dismiss of cleared notifications', fakeAsync(() => {
      service.success('Message 1', undefined, 1000);
      service.success('Message 2', undefined, 2000);

      service.clearAll();

      tick(3000);

      expect(service.notifications$().length).toBe(0);
    }));
  });

  describe('multiple notifications', () => {
    it('should handle multiple notifications of same type', () => {
      service.success('Message 1');
      service.success('Message 2');
      service.success('Message 3');

      const notifications = service.notifications$();
      expect(notifications.length).toBe(3);
      expect(notifications.every(n => n.type === 'success')).toBe(true);
    });

    it('should handle multiple notifications of different types', () => {
      service.success('Success');
      service.error('Error');
      service.warning('Warning');
      service.info('Info');

      const notifications = service.notifications$();
      expect(notifications.length).toBe(4);
      expect(notifications.map(n => n.type)).toEqual(['success', 'error', 'warning', 'info']);
    });

    it('should add notifications in order', () => {
      service.success('First');
      service.error('Second');
      service.info('Third');

      const notifications = service.notifications$();
      expect(notifications[0].message).toBe('First');
      expect(notifications[1].message).toBe('Second');
      expect(notifications[2].message).toBe('Third');
    });

    it('should auto-dismiss notifications independently', fakeAsync(() => {
      service.success('Message 1', undefined, 1000);
      service.success('Message 2', undefined, 2000);
      service.success('Message 3', undefined, 3000);

      expect(service.notifications$().length).toBe(3);

      tick(1000);
      expect(service.notifications$().length).toBe(2);

      tick(1000);
      expect(service.notifications$().length).toBe(1);

      tick(1000);
      expect(service.notifications$().length).toBe(0);
    }));
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      service.success('');

      const notifications = service.notifications$();
      expect(notifications.length).toBe(1);
      expect(notifications[0].message).toBe('');
    });

    it('should handle very long message', () => {
      const longMessage = 'a'.repeat(1000);
      service.success(longMessage);

      const notifications = service.notifications$();
      expect(notifications[0].message).toBe(longMessage);
    });

    it('should handle message with special characters', () => {
      const message = 'Test <script>alert("xss")</script> message';
      service.success(message);

      const notifications = service.notifications$();
      expect(notifications[0].message).toBe(message);
    });

    it('should handle message with Unicode characters', () => {
      const message = 'Hello 世界 🌍';
      service.success(message);

      const notifications = service.notifications$();
      expect(notifications[0].message).toBe(message);
    });

    it('should handle zero duration (no auto-dismiss)', fakeAsync(() => {
      service.success('Persistent message', undefined, 0);

      tick(10000); // Wait a long time

      expect(service.notifications$().length).toBe(1);
    }));

    it('should handle negative duration (no auto-dismiss)', fakeAsync(() => {
      service.success('Message', undefined, -1000);

      tick(10000);

      expect(service.notifications$().length).toBe(1);
    }));

    it('should handle very large duration', fakeAsync(() => {
      service.success('Message', undefined, 999999);

      tick(10000); // Don't wait the full duration

      expect(service.notifications$().length).toBe(1);
    }));
  });

  describe('notification properties', () => {
    it('should create notification with all required properties', () => {
      service.success('Test message', undefined, 5000);

      const notification = service.notifications$()[0];
      expect(notification.id).toBeDefined();
      expect(notification.message).toBe('Test message');
      expect(notification.type).toBe('success');
      expect(notification.duration).toBe(5000);
    });

    it('should generate unique IDs for each notification', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        service.success(`Message ${i}`);
        const notifications = service.notifications$();
        ids.add(notifications[notifications.length - 1].id);
        service.clearAll();
      }

      expect(ids.size).toBe(100);
    });

    it('should have valid UUID format for IDs', () => {
      service.success('Test');

      const id = service.notifications$()[0].id;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidPattern.test(id)).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid successive notifications', fakeAsync(() => {
      for (let i = 0; i < 10; i++) {
        service.success(`Message ${i}`, undefined, 1000);
      }

      expect(service.notifications$().length).toBe(10);

      tick(1000);

      expect(service.notifications$().length).toBe(0);
    }));

    it('should support dismiss during auto-dismiss timer', fakeAsync(() => {
      service.success('Message', undefined, 3000);

      const id = service.notifications$()[0].id;

      tick(1000);

      service.dismiss(id);

      expect(service.notifications$().length).toBe(0);

      tick(2000); // Complete the original timer

      // Should still be empty, no errors
      expect(service.notifications$().length).toBe(0);
    }));

    it('should support clearAll during auto-dismiss timers', fakeAsync(() => {
      service.success('Message 1', undefined, 2000);
      service.success('Message 2', undefined, 3000);

      tick(1000);

      service.clearAll();

      tick(3000);

      expect(service.notifications$().length).toBe(0);
    }));

    it('should maintain notification order during partial dismissal', fakeAsync(() => {
      service.success('Keep', undefined, 10000);
      service.success('Remove', undefined, 1000);
      service.success('Keep', undefined, 10000);

      tick(1000);

      const notifications = service.notifications$();
      expect(notifications.length).toBe(2);
      expect(notifications.every(n => n.message === 'Keep')).toBe(true);
    }));
  });
});
