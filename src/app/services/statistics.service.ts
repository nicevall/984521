// src/app/services/statistics.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminAuthService } from './admin-auth.service';

export interface CareerStatistics {
  carrera: string;
  total_prestamos: number;
  estudiantes_activos: number;
  libros_mas_solicitados: Array<{titulo: string, cantidad: number}>;
  promedio_dias_prestamo: number;
  tasa_devolucion_puntual: number;
  total_multas: number;
}

export interface AcademicMetrics {
  total_prestamos_periodo: number;
  estudiantes_unicos: number;
  libro_mas_popular: string;
  carrera_mas_activa: string;
  promedio_prestamos_dia: number;
}

export interface LoanTrend {
  period: string;
  loans: number;
}

export interface PopularBook {
  titulo: string;
  autor: string;
  categoria: string;
  total_prestamos: number;
}

export interface FilteredLoan {
  id: number;
  book_title: string;
  student_name: string;
  student_cedula: string;
  student_carrera: string;
  loan_date: string;
  due_date: string;
  return_date?: string;
  status: string;
  fine_info?: {
    days_overdue: number;
    fine_per_day: number;
    total_fine: number;
    fine_paid: boolean;
    overdue_message: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = 'http://localhost:8000/api/v1/admin/statistics';
  private finesUrl = 'http://localhost:8000/api/v1/admin/fines';
  private filtersUrl = 'http://localhost:8000/api/v1/admin/advanced-filters';

  constructor(
    private http: HttpClient,
    private adminAuthService: AdminAuthService
  ) {}

  private getAuthHeaders(): RequestInit {
    const options = this.adminAuthService.getAuthenticatedHttpOptions();
    // Convertir HttpHeaders a Record<string, string>
    const headers: Record<string, string> = {};
    
    if (options.headers) {
      (options.headers as any).keys().forEach((key: string) => {
        headers[key] = (options.headers as any).get(key);
      });
    }
    
    return { headers };
  }

  // ENDPOINTS DE ESTADÍSTICAS
  async getLoansByCareer(periodType: string, periodValue: string, carreraFilter?: string): Promise<any> {
    try {
      let url = `${this.apiUrl}/loans-by-career?period_type=${periodType}&period_value=${periodValue}`;
      if (carreraFilter && carreraFilter !== 'TODAS') {
        url += `&carrera_filter=${carreraFilter}`;
      }

      const response = await fetch(url, this.getAuthHeaders());
      return await response.json();
    } catch (error) {
      console.error('Error getting loans by career:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async getAcademicOverview(startDate: string, endDate: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiUrl}/academic-overview?start_date=${startDate}&end_date=${endDate}`,
        this.getAuthHeaders()
      );
      return await response.json();
    } catch (error) {
      console.error('Error getting academic overview:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async getPopularBooks(carrera?: string, period?: string, limit: number = 10): Promise<any> {
    try {
      let url = `${this.apiUrl}/popular-books?limit=${limit}`;
      if (carrera && carrera !== 'TODAS') url += `&carrera=${carrera}`;
      if (period) url += `&period=${period}`;

      const response = await fetch(url, this.getAuthHeaders());
      return await response.json();
    } catch (error) {
      console.error('Error getting popular books:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async getLoanTrends(granularity: string, startDate: string, endDate: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiUrl}/trends?granularity=${granularity}&period_start=${startDate}&period_end=${endDate}`,
        this.getAuthHeaders()
      );
      return await response.json();
    } catch (error) {
      console.error('Error getting loan trends:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async getAvailablePeriods(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/available-periods`);
      return await response.json();
    } catch (error) {
      console.error('Error getting available periods:', error);
      // Fallback periods if endpoint fails
      return {
        success: true,
        periods: {
          anual: [
            { value: "2024", label: "Año 2024" },
            { value: "2023", label: "Año 2023" }
          ],
          semestral: [
            { value: "2024-S1", label: "2024 Semestre I (Oct-Mar)" },
            { value: "2024-S2", label: "2024 Semestre II (Apr-Aug)" }
          ],
          mensual: [
            { value: "2024-01", label: "Enero 2024" },
            { value: "2024-02", label: "Febrero 2024" },
            { value: "2024-03", label: "Marzo 2024" }
          ]
        }
      };
    }
  }

  // ENDPOINTS DE MULTAS Y FILTROS
  async getFilteredLoans(statusFilter: string = 'all', page: number = 1, pageSize: number = 20): Promise<any> {
    try {
      const response = await fetch(
        `${this.finesUrl}/loans/filtered?status_filter=${statusFilter}&page=${page}&page_size=${pageSize}&include_fines=true`,
        this.getAuthHeaders()
      );
      return await response.json();
    } catch (error) {
      console.error('Error getting filtered loans:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async getOverdueSummary(): Promise<any> {
    try {
      const response = await fetch(`${this.finesUrl}/overdue-summary`, this.getAuthHeaders());
      return await response.json();
    } catch (error) {
      console.error('Error getting overdue summary:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async updateOverdueLoans(): Promise<any> {
    try {
      const response = await fetch(`${this.finesUrl}/update-overdue`, {
        method: 'POST',
        ...this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating overdue loans:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async processFinePayment(loanId: number, paymentAmount: number, notes: string = ''): Promise<any> {
    try {
      const response = await fetch(`${this.finesUrl}/process-payment/${loanId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAuthHeaders().headers as Record<string, string>)
        },
        body: JSON.stringify({
          payment_amount: paymentAmount,
          notes: notes
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error processing fine payment:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async validateReservationDate(reservationDate?: string): Promise<any> {
    try {
      let url = `${this.finesUrl}/validate-reservation-date`;
      if (reservationDate) {
        url += `?reservation_date=${encodeURIComponent(reservationDate)}`;
      }

      const response = await fetch(url, { method: 'POST' });
      return await response.json();
    } catch (error) {
      console.error('Error validating reservation date:', error);
      return { valid: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async getSuggestedDates(): Promise<any> {
    try {
      const response = await fetch(`${this.finesUrl}/suggested-dates`);
      return await response.json();
    } catch (error) {
      console.error('Error getting suggested dates:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  // GENERACIÓN DE DATOS DE PRUEBA
  async generateTestData(forceRegenerate: boolean = false): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/data-generator/generate-test-data?force_regenerate=${forceRegenerate}`, {
        method: 'POST',
        ...this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error generating test data:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async getDataSummary(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/data-generator/data-summary`, this.getAuthHeaders());
      return await response.json();
    } catch (error) {
      console.error('Error getting data summary:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async clearTestData(confirm: boolean = false): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/data-generator/clear-test-data?confirm=${confirm}`, {
        method: 'DELETE',
        ...this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error clearing test data:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  // FILTROS AVANZADOS
  async advancedSearch(filters: any): Promise<any> {
    try {
      const response = await fetch(`${this.filtersUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAuthHeaders().headers as Record<string, string>)
        },
        body: JSON.stringify(filters)
      });
      return await response.json();
    } catch (error) {
      console.error('Error in advanced search:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async getFilterStatistics(): Promise<any> {
    try {
      const response = await fetch(`${this.filtersUrl}/filter-stats`, this.getAuthHeaders());
      return await response.json();
    } catch (error) {
      console.error('Error getting filter statistics:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async applyQuickFilter(filterName: string, page: number = 1, pageSize: number = 20): Promise<any> {
    try {
      const response = await fetch(`${this.filtersUrl}/quick-filter?filter_name=${filterName}&page=${page}&page_size=${pageSize}`, {
        method: 'POST',
        ...this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error applying quick filter:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  async exportFilteredData(filters: any, format: string = 'json'): Promise<any> {
    try {
      const exportRequest = {
        filters: filters,
        export_format: format,
        include_charts: false,
        include_summary: true
      };

      const response = await fetch(`${this.filtersUrl}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAuthHeaders().headers as Record<string, string>)
        },
        body: JSON.stringify(exportRequest)
      });

      if (format === 'json') {
        return await response.json();
      } else {
        // Para CSV, devolver blob
        return await response.blob();
      }
    } catch (error) {
      console.error('Error exporting filtered data:', error);
      return { success: false, error: (error as Error).message || 'Error desconocido' };
    }
  }

  // MÉTODOS HELPER
  getPeriodDates(periodType: string, periodValue: string): { start: string, end: string } {
    const currentYear = new Date().getFullYear();
    
    if (periodType === 'anual') {
      const year = parseInt(periodValue);
      return {
        start: `${year}-01-01`,
        end: `${year}-12-31`
      };
    } else if (periodType === 'semestral') {
      const [yearStr, semesterStr] = periodValue.split('-S');
      const year = parseInt(yearStr);
      const semester = parseInt(semesterStr);
      
      if (semester === 1) {
        // Semestre I: Oct 25 del año anterior - Mar 15 del año actual
        return {
          start: `${year - 1}-10-25`,
          end: `${year}-03-15`
        };
      } else {
        // Semestre II: Apr 25 - Aug 31 del mismo año
        return {
          start: `${year}-04-25`,
          end: `${year}-08-31`
        };
      }
    } else if (periodType === 'mensual') {
      const [yearStr, monthStr] = periodValue.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Último día del mes
      
      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      };
    }
    
    // Fallback: año actual
    return {
      start: `${currentYear}-01-01`,
      end: `${currentYear}-12-31`
    };
  }

  formatPeriodLabel(periodType: string, periodValue: string): string {
    if (periodType === 'anual') {
      return `Año ${periodValue}`;
    } else if (periodType === 'semestral') {
      const [year, semester] = periodValue.split('-S');
      const semesterName = semester === '1' ? 'I' : 'II';
      return `${year} Semestre ${semesterName}`;
    } else if (periodType === 'mensual') {
      const [year, month] = periodValue.split('-');
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return periodValue;
  }
}