// src/app/components/statistics-dashboard/statistics-dashboard.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, ChartType } from 'chart.js/auto';
import { StatisticsService, CareerStatistics, FilteredLoan } from '../../services/statistics.service';
import { AdvancedFiltersPanelComponent, AdvancedFilters } from '../advanced-filters-panel/advanced-filters-panel.component';
import { NotificationService } from '../../services/notification.service';

interface PeriodOption {
  type: string;
  value: string;
  label: string;
}

@Component({
  selector: 'app-statistics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AdvancedFiltersPanelComponent],
  templateUrl: './statistics-dashboard.component.html',
  styleUrls: ['./statistics-dashboard.component.css']
})
export class StatisticsDashboardComponent implements OnInit {
  @ViewChild('careerChart', { static: false }) careerChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart', { static: false }) trendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('booksChart', { static: false }) booksChartRef!: ElementRef<HTMLCanvasElement>;

  // Charts
  careerChart?: Chart;
  trendChart?: Chart;
  booksChart?: Chart;

  // Data
  careerStatistics: CareerStatistics[] = [];
  filteredLoans: FilteredLoan[] = [];
  academicOverview: any = {};
  popularBooks: any[] = [];
  loanTrends: any[] = [];
  
  // Filters
  selectedPeriodType: string = 'semestral';
  selectedPeriodValue: string = '2024-S2';
  selectedCarrera: string = 'TODAS';
  selectedStatusFilter: string = 'all';
  
  // UI State
  loading = false;
  error: string | null = null;
  
  // Advanced Filters
  showAdvancedFilters = false;
  filterStats: any = null;
  currentFilters: AdvancedFilters | null = null;
  
  // Available options
  availablePeriods: PeriodOption[] = [
    { type: 'semestral', value: '2024-S2', label: '2024 Semestre II (Apr-Aug)' },
    { type: 'semestral', value: '2024-S1', label: '2024 Semestre I (Oct-Mar)' },
    { type: 'anual', value: '2024', label: 'Año 2024' },
    { type: 'anual', value: '2023', label: 'Año 2023' }
  ];
  
  availableCarreras = [
    { code: 'TODAS', name: 'Todas las carreras' },
    { code: 'ADMINISTRACION', name: 'Administración de Empresas' },
    { code: 'MARKETING', name: 'Marketing' },
    { code: 'NEGOCIOS_INTERNACIONALES', name: 'Negocios Internacionales' },
    { code: 'SISTEMAS', name: 'Ingeniería en Sistemas' },
    { code: 'PSICOLOGIA', name: 'Psicología' },
    { code: 'ARQUITECTURA', name: 'Arquitectura' },
    { code: 'DERECHO', name: 'Derecho' }
  ];
  
  statusFilters = [
    { value: 'all', label: 'Todos los préstamos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'approved', label: 'Aprobados' },
    { value: 'on_loan', label: 'En préstamo' },
    { value: 'overdue', label: 'Atrasados (con multas)' },
    { value: 'returned', label: 'Devueltos' }
  ];

  // Summary data
  summaryStats = {
    totalLoans: 0,
    totalStudents: 0,
    overdueLoans: 0,
    totalFines: 0,
    averageLoansPerDay: 0
  };

  constructor(
    private statisticsService: StatisticsService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit() {
    await this.loadDashboardData();
    await this.loadFilterStatistics();
  }

  ngAfterViewInit() {
    // Charts will be created after data is loaded
  }

  async loadDashboardData() {
    this.loading = true;
    this.error = null;
    
    try {
      // Load all dashboard data in parallel
      const [
        careerStatsResult,
        overviewResult,
        popularBooksResult,
        trendsResult,
        filteredLoansResult
      ] = await Promise.all([
        this.loadCareerStatistics(),
        this.loadAcademicOverview(),
        this.loadPopularBooks(),
        this.loadLoanTrends(),
        this.loadFilteredLoans()
      ]);

      // Update summary statistics
      this.updateSummaryStats();
      
      // Create charts after data is loaded
      setTimeout(() => {
        this.createCharts();
      }, 100);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.error = 'Error cargando datos del dashboard';
    } finally {
      this.loading = false;
    }
  }

  async loadCareerStatistics() {
    const result = await this.statisticsService.getLoansByCareer(
      this.selectedPeriodType,
      this.selectedPeriodValue,
      this.selectedCarrera === 'TODAS' ? undefined : this.selectedCarrera
    );
    
    if (result.success) {
      this.careerStatistics = result.data || [];
    }
    return result;
  }

  async loadAcademicOverview() {
    const dates = this.statisticsService.getPeriodDates(this.selectedPeriodType, this.selectedPeriodValue);
    const result = await this.statisticsService.getAcademicOverview(dates.start, dates.end);
    
    if (result.success) {
      this.academicOverview = result.data || {};
    }
    return result;
  }

  async loadPopularBooks() {
    const result = await this.statisticsService.getPopularBooks(
      this.selectedCarrera === 'TODAS' ? undefined : this.selectedCarrera,
      this.selectedPeriodValue,
      10
    );
    
    if (result.success) {
      this.popularBooks = result.data || [];
    }
    return result;
  }

  async loadLoanTrends() {
    const dates = this.statisticsService.getPeriodDates(this.selectedPeriodType, this.selectedPeriodValue);
    const granularity = this.selectedPeriodType === 'anual' ? 'monthly' : 'daily';
    
    const result = await this.statisticsService.getLoanTrends(
      granularity,
      dates.start,
      dates.end
    );
    
    if (result.success) {
      this.loanTrends = result.data || [];
    }
    return result;
  }

  async loadFilteredLoans() {
    const result = await this.statisticsService.getFilteredLoans(this.selectedStatusFilter, 1, 50);
    
    if (result.success) {
      this.filteredLoans = result.loans || [];
    }
    return result;
  }

  updateSummaryStats() {
    this.summaryStats = {
      totalLoans: this.academicOverview.total_prestamos_periodo || 0,
      totalStudents: this.academicOverview.estudiantes_unicos || 0,
      overdueLoans: this.filteredLoans.filter(loan => loan.status === 'overdue').length,
      totalFines: this.filteredLoans
        .filter(loan => loan.fine_info && loan.fine_info.total_fine > 0)
        .reduce((sum, loan) => sum + (loan.fine_info?.total_fine || 0), 0),
      averageLoansPerDay: this.academicOverview.promedio_prestamos_dia || 0
    };
  }

  createCharts() {
    this.createCareerChart();
    this.createTrendChart();
    this.createPopularBooksChart();
  }

  createCareerChart() {
    if (!this.careerChartRef?.nativeElement || this.careerStatistics.length === 0) return;

    const ctx = this.careerChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.careerChart) {
      this.careerChart.destroy();
    }

    const labels = this.careerStatistics.map(stat => stat.carrera);
    const loansData = this.careerStatistics.map(stat => stat.total_prestamos);
    const studentsData = this.careerStatistics.map(stat => stat.estudiantes_activos);

    this.careerChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Préstamos',
            data: loansData,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'Estudiantes Activos',
            data: studentsData,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Carreras'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Número de Préstamos'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Estudiantes Activos'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        },
        plugins: {
          title: {
            display: true,
            text: `Estadísticas por Carrera - ${this.statisticsService.formatPeriodLabel(this.selectedPeriodType, this.selectedPeriodValue)}`
          },
          legend: {
            display: true
          }
        }
      }
    });
  }

  createTrendChart() {
    if (!this.trendChartRef?.nativeElement || this.loanTrends.length === 0) return;

    const ctx = this.trendChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const labels = this.loanTrends.map(trend => trend.period);
    const data = this.loanTrends.map(trend => trend.loans);

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Préstamos por Período',
          data: data,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Período'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Número de Préstamos'
            },
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Tendencia de Préstamos'
          }
        }
      }
    });
  }

  createPopularBooksChart() {
    if (!this.booksChartRef?.nativeElement || this.popularBooks.length === 0) return;

    const ctx = this.booksChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.booksChart) {
      this.booksChart.destroy();
    }

    const labels = this.popularBooks.map(book => book.titulo.length > 30 ? book.titulo.substring(0, 30) + '...' : book.titulo);
    const data = this.popularBooks.map(book => book.total_prestamos);

    this.booksChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)',
            'rgba(255, 99, 255, 0.8)',
            'rgba(99, 255, 132, 0.8)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Libros Más Populares'
          },
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  // Event handlers for filters
  async onPeriodChange() {
    await this.loadDashboardData();
  }

  async onCarreraChange() {
    await this.loadDashboardData();
  }

  async onStatusFilterChange() {
    await this.loadFilteredLoans();
    this.updateSummaryStats();
  }

  // Show data summary
  async showDataSummary() {
    this.loading = true;
    try {
      const summary = await this.statisticsService.getDataSummary();
      
      if (summary.success) {
        const carrerasInfo = summary.carreras_distribution
          .map((c: any) => `• ${c.carrera}: ${c.estudiantes} estudiantes`)
          .join('\n');
        
        const loansInfo = summary.loans_by_status
          .map((l: any) => `• ${this.getStatusLabel(l.status)}: ${l.cantidad}`)
          .join('\n');
        
        const healthStatus = summary.data_health.has_sufficient_data ? 
          '✅ Datos suficientes para estadísticas' : 
          '⚠️ Se recomienda generar más datos';
        
        alert(
          `📊 RESUMEN DE DATOS ACTUALES\n\n` +
          `📈 Totales:\n` +
          `• Estudiantes: ${summary.summary.total_students}\n` +
          `• Libros: ${summary.summary.total_books}\n` +
          `• Préstamos: ${summary.summary.total_loans}\n` +
          `• Préstamos atrasados: ${summary.summary.overdue_loans}\n` +
          `• Multas pendientes: $${summary.summary.total_fines_pending}\n\n` +
          `🎓 Distribución por Carreras:\n${carrerasInfo}\n\n` +
          `📋 Préstamos por Estado:\n${loansInfo}\n\n` +
          `🔍 Estado del Sistema:\n${healthStatus}\n\n` +
          `⏰ Última actualización: ${new Date(summary.timestamp).toLocaleString()}`
        );
      } else {
        alert(`❌ Error obteniendo resumen: ${summary.error}`);
      }
    } catch (error) {
      console.error('Error showing data summary:', error);
      alert('❌ Error de conexión obteniendo resumen de datos');
    } finally {
      this.loading = false;
    }
  }

  // Generate test data
  async generateTestData() {
    const confirmGenerate = confirm(
      '¿Generar datos de prueba automáticos?\n\n' +
      'Esto creará:\n' +
      '• 150 estudiantes UIDE realistas\n' +
      '• 200+ libros académicos por carrera\n' +
      '• 250 préstamos con multas automáticas\n' +
      '• Períodos académicos UIDE completos\n\n' +
      '⚠️ Nota: Esto puede tomar 30-60 segundos'
    );

    if (!confirmGenerate) return;

    this.loading = true;
    this.error = null;

    try {
      console.log('🚀 Iniciando generación de datos UIDE...');
      
      // Primero verificar estado actual
      const dataSummary = await this.statisticsService.getDataSummary();
      
      if (dataSummary.success && dataSummary.summary.total_students > 50) {
        const forceRegenerate = confirm(
          '⚠️ Ya existen datos en el sistema:\n\n' +
          `• Estudiantes: ${dataSummary.summary.total_students}\n` +
          `• Libros: ${dataSummary.summary.total_books}\n` +
          `• Préstamos: ${dataSummary.summary.total_loans}\n\n` +
          '¿Regenerar datos igualmente?\n' +
          '(Los datos existentes se mantendrán)'
        );
        
        if (!forceRegenerate) {
          this.loading = false;
          return;
        }
      }

      // Generar datos
      const result = await this.statisticsService.generateTestData(false);
      
      if (result.success) {
        // Mostrar notificación de éxito usando el servicio
        this.notificationService.dataGenerated(result.statistics);
        
        // Mostrar detalles adicionales
        this.notificationService.success(
          '🎓 Datos Académicos UIDE Configurados',
          `${result.academic_data.semester_1_period} | ${result.academic_data.semester_2_period} | ${result.academic_data.fine_rate}`
        );
        
        // Recargar dashboard con nuevos datos
        await this.loadDashboardData();
        
      } else if (result.warning) {
        alert(
          `⚠️ ${result.warning}\n\n` +
          `${result.message}\n\n` +
          `Datos existentes:\n` +
          `• Estudiantes: ${result.existing_data.students}\n` +
          `• Libros: ${result.existing_data.books}\n` +
          `• Préstamos: ${result.existing_data.loans}\n\n` +
          `💡 ${result.recommendation}`
        );
      } else {
        this.error = result.error || 'Error desconocido generando datos';
        alert(`❌ Error: ${this.error}`);
      }
      
    } catch (error) {
      console.error('Error generating test data:', error);
      this.error = 'Error de conexión generando datos de prueba';
      alert(`❌ Error de conexión: ${this.error}`);
    } finally {
      this.loading = false;
    }
  }

  // Export data
  exportData() {
    const data = {
      period: this.statisticsService.formatPeriodLabel(this.selectedPeriodType, this.selectedPeriodValue),
      carrera: this.selectedCarrera,
      summary: this.summaryStats,
      careerStatistics: this.careerStatistics,
      popularBooks: this.popularBooks,
      trends: this.loanTrends,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estadisticas-uide-${this.selectedPeriodValue}-${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Helper methods for template
  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'approved': 'Aprobado',
      'on_loan': 'En Préstamo',
      'overdue': 'Atrasado',
      'returned': 'Devuelto',
      'rejected': 'Rechazado'
    };
    return statusMap[status] || status;
  }

  async processFinePayment(loan: FilteredLoan) {
    if (!loan.fine_info || loan.fine_info.total_fine <= 0) return;

    const confirmPayment = confirm(
      `¿Procesar pago de multa?\n\n` +
      `Estudiante: ${loan.student_name}\n` +
      `Libro: ${loan.book_title}\n` +
      `Días atrasado: ${loan.fine_info.days_overdue}\n` +
      `Monto: $${loan.fine_info.total_fine.toFixed(2)}`
    );

    if (!confirmPayment) return;

    try {
      this.loading = true;
      const result = await this.statisticsService.processFinePayment(
        loan.id,
        loan.fine_info.total_fine,
        `Pago procesado desde dashboard - ${new Date().toISOString()}`
      );

      if (result.success) {
        // Usar el servicio de notificaciones para mostrar confirmación
        this.notificationService.finePaymentProcessed(loan.fine_info.total_fine, loan.student_name);
        
        await this.loadFilteredLoans();
        this.updateSummaryStats();
      } else {
        this.notificationService.systemError('pago de multa', result.error);
      }
    } catch (error) {
      console.error('Error processing fine payment:', error);
      alert('Error procesando el pago de multa');
    } finally {
      this.loading = false;
    }
  }

  viewLoanDetails(loan: FilteredLoan) {
    const details = [
      `ID: ${loan.id}`,
      `Libro: ${loan.book_title}`,
      `Estudiante: ${loan.student_name} (${loan.student_cedula})`,
      `Carrera: ${loan.student_carrera}`,
      `Estado: ${this.getStatusLabel(loan.status)}`,
      `Fecha préstamo: ${loan.loan_date}`,
      `Fecha vencimiento: ${loan.due_date}`,
      loan.return_date ? `Fecha devolución: ${loan.return_date}` : '',
      loan.fine_info && loan.fine_info.total_fine > 0 ? 
        `Multa: $${loan.fine_info.total_fine.toFixed(2)} (${loan.fine_info.days_overdue} días)` : 
        'Sin multa'
    ].filter(detail => detail).join('\n');

    alert(`Detalles del Préstamo:\n\n${details}`);
  }

  // Advanced Filters Methods
  async loadFilterStatistics() {
    try {
      this.filterStats = await this.statisticsService.getFilterStatistics();
    } catch (error) {
      console.error('Error loading filter statistics:', error);
    }
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  async onAdvancedFiltersChanged(filters: AdvancedFilters) {
    this.loading = true;
    this.currentFilters = filters;
    
    try {
      const result = await this.statisticsService.advancedSearch(filters);
      
      if (result.success) {
        this.filteredLoans = result.loans || [];
        this.updateSummaryStats();
        
        // Mostrar notificación de filtros aplicados
        this.notificationService.filterApplied(this.filteredLoans.length, 'Filtros Avanzados');
        
        console.log('Advanced filters applied:', result);
      } else {
        this.notificationService.systemError('filtros avanzados', result.error || 'Error desconocido');
        this.error = result.error || 'Error aplicando filtros avanzados';
      }
    } catch (error) {
      console.error('Error applying advanced filters:', error);
      this.error = 'Error de conexión aplicando filtros';
    } finally {
      this.loading = false;
    }
  }

  async onQuickFilterApplied(filterName: string) {
    this.loading = true;
    
    try {
      const result = await this.statisticsService.applyQuickFilter(filterName);
      
      if (result.success) {
        this.filteredLoans = result.loans || [];
        this.updateSummaryStats();
        
        console.log(`Quick filter '${filterName}' applied:`, result);
      } else {
        this.error = result.error || 'Error aplicando filtro rápido';
      }
    } catch (error) {
      console.error('Error applying quick filter:', error);
      this.error = 'Error de conexión aplicando filtro rápido';
    } finally {
      this.loading = false;
    }
  }

  onAdvancedFiltersCleared() {
    this.currentFilters = null;
    this.loadFilteredLoans(); // Reload with default filters
  }

  onAdvancedFiltersPanelClosed() {
    this.showAdvancedFilters = false;
  }

  async exportFilteredData(format: string = 'json') {
    if (!this.currentFilters) {
      alert('No hay filtros aplicados para exportar');
      return;
    }

    this.loading = true;
    try {
      const result = await this.statisticsService.exportFilteredData(this.currentFilters, format);
      
      if (format === 'json') {
        // Download JSON
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prestamos_filtrados_${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Download CSV blob
        const url = window.URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prestamos_filtrados_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      console.log('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exportando datos');
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy() {
    if (this.careerChart) this.careerChart.destroy();
    if (this.trendChart) this.trendChart.destroy();
    if (this.booksChart) this.booksChart.destroy();
  }
}