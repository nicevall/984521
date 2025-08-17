// src/app/components/advanced-filters-panel/advanced-filters-panel.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface AdvancedFilters {
  // Filtros básicos
  status_filter?: string;
  carrera_filter?: string;
  
  // Filtros de texto
  student_name_search?: string;
  student_cedula_search?: string;
  book_title_search?: string;
  book_author_search?: string;
  
  // Filtros de fechas
  loan_date_start?: string;
  loan_date_end?: string;
  due_date_start?: string;
  due_date_end?: string;
  return_date_start?: string;
  return_date_end?: string;
  
  // Filtros de multas
  has_fines?: boolean;
  fine_amount_min?: number;
  fine_amount_max?: number;
  fine_paid_status?: boolean;
  days_overdue_min?: number;
  days_overdue_max?: number;
  
  // Filtros administrativos
  brought_cedula?: boolean;
  book_condition?: string;
  
  // Paginación y ordenamiento
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

@Component({
  selector: 'app-advanced-filters-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './advanced-filters-panel.component.html',
  styleUrls: ['./advanced-filters-panel.component.css']
})
export class AdvancedFiltersPanelComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Input() filterStats: any = null;
  @Output() filtersChanged = new EventEmitter<AdvancedFilters>();
  @Output() quickFilterApplied = new EventEmitter<string>();
  @Output() filtersCleared = new EventEmitter<void>();
  @Output() panelClosed = new EventEmitter<void>();

  // Estado de filtros
  filters: AdvancedFilters = {
    page: 1,
    page_size: 20,
    sort_by: 'loan_date',
    sort_order: 'desc'
  };

  // UI State
  activeTab: string = 'basic'; // basic, text, dates, fines, admin
  isCollapsed: boolean = false;
  showAdvanced: boolean = false;

  // Opciones estáticas
  statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'approved', label: 'Aprobados' },
    { value: 'on_loan', label: 'En préstamo' },
    { value: 'overdue', label: 'Atrasados' },
    { value: 'returned', label: 'Devueltos' },
    { value: 'rejected', label: 'Rechazados' },
    { value: 'overdue_fines', label: 'Atrasados con multas' },
    { value: 'paid_fines', label: 'Con multas pagadas' }
  ];

  carreraOptions = [
    { value: 'TODAS', label: 'Todas las carreras' },
    { value: 'ADMINISTRACION', label: 'Administración de Empresas' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'NEGOCIOS_INTERNACIONALES', label: 'Negocios Internacionales' },
    { value: 'SISTEMAS', label: 'Ingeniería en Sistemas' },
    { value: 'PSICOLOGIA', label: 'Psicología' },
    { value: 'ARQUITECTURA', label: 'Arquitectura' },
    { value: 'DERECHO', label: 'Derecho' }
  ];

  sortOptions = [
    { value: 'loan_date', label: 'Fecha de préstamo' },
    { value: 'due_date', label: 'Fecha de vencimiento' },
    { value: 'return_date', label: 'Fecha de devolución' },
    { value: 'total_fine', label: 'Monto de multa' },
    { value: 'days_overdue', label: 'Días de atraso' }
  ];

  bookConditionOptions = [
    { value: '', label: 'Cualquier condición' },
    { value: 'good', label: 'Buena condición' },
    { value: 'damaged', label: 'Dañado' },
    { value: 'lost', label: 'Perdido' }
  ];

  // Filtros rápidos
  quickFilters = [
    { 
      id: 'overdue_loans', 
      label: 'Préstamos Atrasados', 
      icon: 'fas fa-exclamation-triangle',
      color: 'danger'
    },
    { 
      id: 'unpaid_fines', 
      label: 'Multas Pendientes', 
      icon: 'fas fa-dollar-sign',
      color: 'warning'
    },
    { 
      id: 'recent_returns', 
      label: 'Devoluciones Recientes', 
      icon: 'fas fa-check-circle',
      color: 'success'
    },
    { 
      id: 'high_fines', 
      label: 'Multas > $10', 
      icon: 'fas fa-money-bill',
      color: 'danger'
    },
    { 
      id: 'missing_cedula', 
      label: 'Sin Cédula Física', 
      icon: 'fas fa-id-card',
      color: 'info'
    },
    { 
      id: 'damaged_books', 
      label: 'Libros Dañados', 
      icon: 'fas fa-book-dead',
      color: 'warning'
    }
  ];

  ngOnInit() {
    this.initializeDateDefaults();
  }

  initializeDateDefaults() {
    // Configurar fechas por defecto para facilitar la búsqueda
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    // No establecer fechas por defecto para no limitar la búsqueda inicial
    // this.filters.loan_date_start = oneMonthAgo.toISOString().split('T')[0];
    // this.filters.loan_date_end = today.toISOString().split('T')[0];
  }

  // Métodos de navegación de tabs
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }

  // Aplicar filtros
  applyFilters() {
    // Limpiar valores vacíos y undefined
    const cleanFilters = this.cleanFilters(this.filters);
    this.filtersChanged.emit(cleanFilters);
  }

  // Limpiar filtros vacíos
  private cleanFilters(filters: AdvancedFilters): AdvancedFilters {
    const cleaned: AdvancedFilters = {};
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== null && value !== undefined && value !== '' && value !== 'all' && value !== 'TODAS') {
        (cleaned as any)[key] = value;
      }
    });

    // Mantener siempre la paginación y ordenamiento
    cleaned.page = filters.page || 1;
    cleaned.page_size = filters.page_size || 20;
    cleaned.sort_by = filters.sort_by || 'loan_date';
    cleaned.sort_order = filters.sort_order || 'desc';

    return cleaned;
  }

  // Limpiar todos los filtros
  clearAllFilters() {
    this.filters = {
      page: 1,
      page_size: 20,
      sort_by: 'loan_date',
      sort_order: 'desc'
    };
    this.filtersCleared.emit();
  }

  // Aplicar filtro rápido
  applyQuickFilter(filterId: string) {
    this.quickFilterApplied.emit(filterId);
  }

  // Cerrar panel
  closePanel() {
    this.panelClosed.emit();
  }

  // Validaciones
  validateDateRange(startDate: string, endDate: string): boolean {
    if (!startDate || !endDate) return true;
    return new Date(startDate) <= new Date(endDate);
  }

  validateFineRange(): boolean {
    if (this.filters.fine_amount_min === undefined || this.filters.fine_amount_max === undefined) return true;
    return this.filters.fine_amount_min <= this.filters.fine_amount_max;
  }

  // Obtener resumen de filtros activos
  getActiveFiltersCount(): number {
    const cleanFilters = this.cleanFilters(this.filters);
    // Excluir paginación y ordenamiento del conteo
    const excludeKeys = ['page', 'page_size', 'sort_by', 'sort_order'];
    return Object.keys(cleanFilters).filter(key => !excludeKeys.includes(key)).length;
  }

  // Obtener texto descriptivo de filtros activos
  getActiveFiltersDescription(): string[] {
    const descriptions: string[] = [];
    
    if (this.filters.status_filter && this.filters.status_filter !== 'all') {
      const statusLabel = this.statusOptions.find(s => s.value === this.filters.status_filter)?.label;
      descriptions.push(`Estado: ${statusLabel}`);
    }
    
    if (this.filters.carrera_filter && this.filters.carrera_filter !== 'TODAS') {
      const carreraLabel = this.carreraOptions.find(c => c.value === this.filters.carrera_filter)?.label;
      descriptions.push(`Carrera: ${carreraLabel}`);
    }
    
    if (this.filters.student_name_search) {
      descriptions.push(`Estudiante: "${this.filters.student_name_search}"`);
    }
    
    if (this.filters.book_title_search) {
      descriptions.push(`Libro: "${this.filters.book_title_search}"`);
    }
    
    if (this.filters.has_fines === true) {
      descriptions.push('Con multas');
    } else if (this.filters.has_fines === false) {
      descriptions.push('Sin multas');
    }
    
    if (this.filters.fine_amount_min !== undefined || this.filters.fine_amount_max !== undefined) {
      const min = this.filters.fine_amount_min || 0;
      const max = this.filters.fine_amount_max || '∞';
      descriptions.push(`Multas: $${min} - $${max}`);
    }
    
    return descriptions;
  }

  // Presets de fechas comunes
  setDatePreset(preset: string) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (preset) {
      case 'today':
        this.filters.loan_date_start = todayStr;
        this.filters.loan_date_end = todayStr;
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        this.filters.loan_date_start = weekAgo.toISOString().split('T')[0];
        this.filters.loan_date_end = todayStr;
        break;
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        this.filters.loan_date_start = monthAgo.toISOString().split('T')[0];
        this.filters.loan_date_end = todayStr;
        break;
      case 'semester':
        // Semestre actual UIDE
        const currentMonth = today.getMonth() + 1;
        if (currentMonth >= 4 && currentMonth <= 8) {
          // Semestre II: Abril - Agosto
          this.filters.loan_date_start = `${today.getFullYear()}-04-25`;
          this.filters.loan_date_end = `${today.getFullYear()}-08-31`;
        } else {
          // Semestre I: Octubre - Marzo
          const year = currentMonth >= 10 ? today.getFullYear() : today.getFullYear() - 1;
          this.filters.loan_date_start = `${year}-10-25`;
          this.filters.loan_date_end = `${year + 1}-03-15`;
        }
        break;
      case 'clear':
        this.filters.loan_date_start = undefined;
        this.filters.loan_date_end = undefined;
        break;
    }
  }
}