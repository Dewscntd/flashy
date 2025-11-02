/**
 * Toast Notification Component - displays toast messages.
 * Follows Single Responsibility: only displays notifications.
 * Fully declarative and composable.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-notification.component.html',
  styleUrl: './toast-notification.component.css'
})
export class ToastNotificationComponent {
  private readonly notificationService = inject(NotificationService);

  /**
   * Signal of active notifications from the service.
   */
  readonly notifications = this.notificationService.notifications$;

  /**
   * Dismisses a notification.
   */
  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }

  /**
   * Gets the icon for a notification type.
   */
  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  }

  /**
   * Gets CSS class for notification type.
   */
  getTypeClass(type: string): string {
    return `toast-${type}`;
  }
}
