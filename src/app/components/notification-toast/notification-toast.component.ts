// src/app/components/notification-toast/notification-toast.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div 
        *ngFor="let notification of notifications" 
        class="notification-toast" 
        [class]="'notification-' + notification.type"
        (mouseenter)="pauseAutoDismiss($event)"
        (mouseleave)="resumeAutoDismiss($event)">
        
        <div class="notification-icon">
          <i [class]="getIcon(notification.type)"></i>
        </div>
        
        <div class="notification-content">
          <div class="notification-title" *ngIf="notification.title">
            {{ notification.title }}
          </div>
          <div class="notification-message">
            {{ notification.message }}
          </div>
          <div class="notification-time">
            {{ getRelativeTime(notification.timestamp) }}
          </div>
        </div>
        
        <div class="notification-actions" *ngIf="notification.actions && notification.actions.length > 0">
          <button 
            *ngFor="let action of notification.actions"
            class="notification-action-btn"
            [class]="action.style || 'primary'"
            (click)="executeAction(action.action, notification.id)">
            {{ action.label }}
          </button>
        </div>
        
        <button 
          class="notification-close"
          (click)="removeNotification(notification.id)"
          title="Cerrar notificación">
          <i class="fas fa-times"></i>
        </button>
        
        <div 
          *ngIf="!notification.persistent && notification.duration && notification.duration > 0"
          class="notification-progress">
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./notification-toast.component.css']
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.notifications.subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Eliminar notificación
  removeNotification(id: string) {
    this.notificationService.remove(id);
  }

  // Ejecutar acción de notificación
  executeAction(action: () => void, notificationId: string) {
    action();
    // Opcional: remover la notificación después de ejecutar la acción
    // this.removeNotification(notificationId);
  }

  // Obtener icono según el tipo
  getIcon(type: Notification['type']): string {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[type];
  }

  // Obtener tiempo relativo
  getRelativeTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      return 'Ahora';
    } else if (minutes < 60) {
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return timestamp.toLocaleDateString();
    }
  }

  // Pausar auto-dismiss al hacer hover
  pauseAutoDismiss(event: MouseEvent) {
    const element = event.currentTarget as HTMLElement;
    element.classList.add('paused');
  }

  // Reanudar auto-dismiss al quitar hover
  resumeAutoDismiss(event: MouseEvent) {
    const element = event.currentTarget as HTMLElement;
    element.classList.remove('paused');
  }
}