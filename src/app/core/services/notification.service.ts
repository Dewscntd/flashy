/**
 * Service for managing user notifications (toast messages).
 * Follows Single Responsibility Principle: manages notifications only.
 */

import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  readonly id: string;
  readonly message: string;
  readonly type: NotificationType;
  readonly duration?: number;
}

/**
 * Manages application-wide notifications using Angular signals.
 * Components can subscribe to notifications$ to display toasts.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly notifications = signal<ReadonlyArray<Notification>>([]);
  private readonly defaultDuration = 3000; // 3 seconds

  /**
   * Read-only signal of active notifications.
   * Components can use this to reactively display notifications.
   */
  readonly notifications$ = this.notifications.asReadonly();

  /**
   * Shows a success notification.
   *
   * @param message - Message to display
   * @param duration - Optional duration in milliseconds (default: 3000)
   */
  success(message: string, duration?: number): void {
    this.addNotification(message, 'success', duration);
  }

  /**
   * Shows an error notification.
   *
   * @param message - Error message to display
   * @param duration - Optional duration in milliseconds (default: 3000)
   */
  error(message: string, duration?: number): void {
    this.addNotification(message, 'error', duration);
  }

  /**
   * Shows a warning notification.
   *
   * @param message - Warning message to display
   * @param duration - Optional duration in milliseconds (default: 3000)
   */
  warning(message: string, duration?: number): void {
    this.addNotification(message, 'warning', duration);
  }

  /**
   * Shows an info notification.
   *
   * @param message - Info message to display
   * @param duration - Optional duration in milliseconds (default: 3000)
   */
  info(message: string, duration?: number): void {
    this.addNotification(message, 'info', duration);
  }

  /**
   * Removes a specific notification by ID.
   *
   * @param id - Notification ID to remove
   */
  dismiss(id: string): void {
    this.notifications.update(current =>
      current.filter(notification => notification.id !== id)
    );
  }

  /**
   * Clears all active notifications.
   */
  clearAll(): void {
    this.notifications.set([]);
  }

  /**
   * Adds a notification to the queue and auto-dismisses after duration.
   *
   * @param message - Notification message
   * @param type - Notification type
   * @param duration - Auto-dismiss duration in milliseconds
   */
  private addNotification(message: string, type: NotificationType, duration?: number): void {
    const notification: Notification = {
      id: crypto.randomUUID(),
      message,
      type,
      duration: duration ?? this.defaultDuration
    };

    this.notifications.update(current => [...current, notification]);

    // Auto-dismiss after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }
  }
}
