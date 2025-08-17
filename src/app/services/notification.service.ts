// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  timestamp: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private notificationId = 0;

  constructor() {}

  // Observable para que los componentes puedan suscribirse
  get notifications() {
    return this.notifications$.asObservable();
  }

  // Método principal para mostrar notificaciones
  show(notification: Partial<Notification>): string {
    const id = this.generateId();
    const newNotification: Notification = {
      id,
      type: notification.type || 'info',
      title: notification.title || '',
      message: notification.message || '',
      duration: notification.duration || (notification.persistent ? 0 : this.getDefaultDuration(notification.type || 'info')),
      persistent: notification.persistent || false,
      actions: notification.actions || [],
      timestamp: new Date()
    };

    const currentNotifications = this.notifications$.value;
    this.notifications$.next([...currentNotifications, newNotification]);

    // Auto-remove notification after duration (if not persistent)
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newNotification.duration);
    }

    return id;
  }

  // Métodos específicos para cada tipo
  success(title: string, message: string, actions?: NotificationAction[]): string {
    return this.show({
      type: 'success',
      title,
      message,
      actions
    });
  }

  error(title: string, message: string, persistent = false, actions?: NotificationAction[]): string {
    return this.show({
      type: 'error',
      title,
      message,
      persistent,
      actions
    });
  }

  warning(title: string, message: string, actions?: NotificationAction[]): string {
    return this.show({
      type: 'warning',
      title,
      message,
      actions
    });
  }

  info(title: string, message: string, actions?: NotificationAction[]): string {
    return this.show({
      type: 'info',
      title,
      message,
      actions
    });
  }

  // Notificaciones específicas para el sistema UIDE
  dataGenerated(stats: any): string {
    return this.success(
      '✅ Datos Generados Exitosamente',
      `${stats.students_created} estudiantes, ${stats.books_created} libros, ${stats.loans_created} préstamos generados en ${stats.generation_time_seconds?.toFixed(1)}s`,
      [
        {
          label: 'Ver Dashboard',
          action: () => console.log('Navigate to dashboard'),
          style: 'primary'
        }
      ]
    );
  }

  finePaymentProcessed(amount: number, studentName: string): string {
    return this.success(
      '💰 Multa Pagada',
      `Pago de $${amount.toFixed(2)} procesado para ${studentName}`,
      [
        {
          label: 'Ver Recibo',
          action: () => console.log('Show receipt'),
          style: 'secondary'
        }
      ]
    );
  }

  filterApplied(resultCount: number, filterType: string): string {
    return this.info(
      '🔍 Filtros Aplicados',
      `${resultCount} resultados encontrados usando filtro "${filterType}"`,
      [
        {
          label: 'Exportar',
          action: () => console.log('Export filtered data'),
          style: 'secondary'
        }
      ]
    );
  }

  validationError(field: string, error: string): string {
    return this.warning(
      '⚠️ Error de Validación',
      `${field}: ${error}`
    );
  }

  systemError(operation: string, error: string): string {
    return this.error(
      '❌ Error del Sistema',
      `Error en ${operation}: ${error}`,
      true,
      [
        {
          label: 'Reintentar',
          action: () => console.log('Retry operation'),
          style: 'primary'
        },
        {
          label: 'Reportar',
          action: () => console.log('Report error'),
          style: 'secondary'
        }
      ]
    );
  }

  dataExported(format: string, recordCount: number): string {
    return this.success(
      '📥 Datos Exportados',
      `${recordCount} registros exportados en formato ${format.toUpperCase()}`
    );
  }

  connectionError(): string {
    return this.error(
      '🌐 Error de Conexión',
      'No se pudo conectar con el servidor. Verificando conexión...',
      true,
      [
        {
          label: 'Reintentar',
          action: () => window.location.reload(),
          style: 'primary'
        }
      ]
    );
  }

  // Eliminar notificación
  remove(id: string): void {
    const currentNotifications = this.notifications$.value;
    this.notifications$.next(currentNotifications.filter(n => n.id !== id));
  }

  // Limpiar todas las notificaciones
  clear(): void {
    this.notifications$.next([]);
  }

  // Limpiar por tipo
  clearByType(type: Notification['type']): void {
    const currentNotifications = this.notifications$.value;
    this.notifications$.next(currentNotifications.filter(n => n.type !== type));
  }

  // Generar ID único
  private generateId(): string {
    return `notification-${++this.notificationId}-${Date.now()}`;
  }

  // Duración por defecto según el tipo
  private getDefaultDuration(type: Notification['type']): number {
    const durations = {
      success: 4000,
      info: 5000,
      warning: 6000,
      error: 8000
    };
    return durations[type];
  }

  // Obtener estadísticas de notificaciones
  getStats(): { total: number; byType: Record<string, number> } {
    const notifications = this.notifications$.value;
    const byType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: notifications.length,
      byType
    };
  }
}