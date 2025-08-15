import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-dashboard">
      <header class="dashboard-header">
        <h1>Panel de Administración - Biblioteca UIDE</h1>
        <div class="stats-overview" *ngIf="statistics">
          <div class="stat-card">
            <h3>{{ statistics.loan_stats.pending }}</h3>
            <p>Préstamos Pendientes</p>
          </div>
          <div class="stat-card">
            <h3>{{ statistics.loan_stats.active }}</h3>
            <p>Préstamos Activos</p>
          </div>
          <div class="stat-card">
            <h3>{{ statistics.loan_stats.overdue }}</h3>
            <p>Préstamos Vencidos</p>
          </div>
          <div class="stat-card">
            <h3>{{ statistics.book_stats.utilization_rate }}%</h3>
            <p>Tasa de Utilización</p>
          </div>
        </div>
      </header>

      <div class="dashboard-tabs">
        <button 
          class="tab-button" 
          [class.active]="activeTab === 'pending'"
          (click)="setActiveTab('pending')"
        >
          Solicitudes Pendientes ({{ pendingLoans.length }})
        </button>
        <button 
          class="tab-button" 
          [class.active]="activeTab === 'active'"
          (click)="setActiveTab('active')"
        >
          Préstamos Activos ({{ activeLoans.length }})
        </button>
      </div>

      <div class="tab-content">
        <!-- Pending Loans Tab -->
        <div *ngIf="activeTab === 'pending'" class="pending-loans">
          <h2>Solicitudes Pendientes de Aprobación</h2>
          <div *ngIf="pendingLoans.length === 0" class="empty-state">
            <p>No hay solicitudes pendientes</p>
          </div>
          
          <div class="loan-card" *ngFor="let loan of pendingLoans">
            <div class="loan-header">
              <h3>{{ loan.book?.titulo }}</h3>
              <span class="days-pending" [class.overdue]="loan.is_overdue">
                {{ loan.days_pending }} día(s) pendiente
              </span>
            </div>
            
            <div class="loan-details">
              <div class="book-info">
                <p><strong>Autor:</strong> {{ loan.book?.autor }}</p>
                <p><strong>Código:</strong> {{ loan.book?.codigo_biblioteca }}</p>
                <p><strong>Categoría:</strong> {{ loan.book?.categoria }}</p>
              </div>
              
              <div class="student-info">
                <p><strong>Estudiante:</strong> {{ loan.student?.nombre }}</p>
                <p><strong>Cédula:</strong> {{ loan.student?.cedula }}</p>
                <p><strong>Carrera:</strong> {{ loan.student?.carrera }}</p>
                <p><strong>Fecha de reserva:</strong> {{ formatDate(loan.reservation_date) }}</p>
              </div>
            </div>
            
            <div class="loan-actions">
              <div class="action-question">
                <p><strong>¿El estudiante trajo su cédula?</strong></p>
              </div>
              
              <div class="action-buttons">
                <button 
                  class="approve-btn"
                  (click)="approveLoan(loan.id, true)"
                  [disabled]="processingLoan === loan.id"
                >
                  {{ processingLoan === loan.id ? 'Procesando...' : 'Sí - Aprobar Préstamo' }}
                </button>
                
                <button 
                  class="reject-btn"
                  (click)="approveLoan(loan.id, false)"
                  [disabled]="processingLoan === loan.id"
                >
                  {{ processingLoan === loan.id ? 'Procesando...' : 'No - Cancelar Reserva' }}
                </button>
              </div>
              
              <div class="notes-section">
                <input 
                  type="text" 
                  [(ngModel)]="loanNotes[loan.id]" 
                  placeholder="Notas adicionales (opcional)"
                  class="notes-input"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Active Loans Tab -->
        <div *ngIf="activeTab === 'active'" class="active-loans">
          <h2>Préstamos Activos</h2>
          <div *ngIf="activeLoans.length === 0" class="empty-state">
            <p>No hay préstamos activos</p>
          </div>
          
          <div class="loan-card" *ngFor="let loan of activeLoans">
            <div class="loan-header">
              <h3>{{ loan.book?.titulo }}</h3>
              <span class="due-date" [class.overdue]="loan.is_overdue" [class.due-soon]="loan.due_soon">
                {{ loan.is_overdue ? 'VENCIDO' : (loan.due_soon ? 'VENCE PRONTO' : 'Vence en ' + loan.days_until_due + ' días') }}
              </span>
            </div>
            
            <div class="loan-details">
              <div class="book-info">
                <p><strong>Autor:</strong> {{ loan.book?.autor }}</p>
                <p><strong>Código:</strong> {{ loan.book?.codigo_biblioteca }}</p>
              </div>
              
              <div class="student-info">
                <p><strong>Estudiante:</strong> {{ loan.student?.nombre }}</p>
                <p><strong>Cédula:</strong> {{ loan.student?.cedula }}</p>
                <p><strong>Fecha de préstamo:</strong> {{ formatDate(loan.loan_date) }}</p>
                <p><strong>Fecha de vencimiento:</strong> {{ formatDate(loan.due_date) }}</p>
              </div>
            </div>
            
            <div class="return-section">
              <h4>Procesar Devolución</h4>
              <div class="return-options">
                <label>
                  <input 
                    type="radio" 
                    [name]="'condition-' + loan.id" 
                    value="good"
                    [(ngModel)]="returnConditions[loan.id]"
                  >
                  Buen estado
                </label>
                <label>
                  <input 
                    type="radio" 
                    [name]="'condition-' + loan.id" 
                    value="damaged"
                    [(ngModel)]="returnConditions[loan.id]"
                  >
                  Dañado
                </label>
                <label>
                  <input 
                    type="radio" 
                    [name]="'condition-' + loan.id" 
                    value="lost"
                    [(ngModel)]="returnConditions[loan.id]"
                  >
                  Perdido
                </label>
              </div>
              
              <input 
                type="text" 
                [(ngModel)]="returnNotes[loan.id]" 
                placeholder="Notas de devolución (opcional)"
                class="notes-input"
              >
              
              <button 
                class="return-btn"
                (click)="returnBook(loan.id)"
                [disabled]="!returnConditions[loan.id] || processingReturn === loan.id"
              >
                {{ processingReturn === loan.id ? 'Procesando...' : 'Procesar Devolución' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="success-message" *ngIf="successMessage">
        {{ successMessage }}
      </div>

      <div class="error-message" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .dashboard-header {
      margin-bottom: 30px;
    }

    .dashboard-header h1 {
      color: #333;
      margin-bottom: 20px;
    }

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .stat-card h3 {
      font-size: 2em;
      margin: 0 0 10px 0;
      color: #007bff;
    }

    .stat-card p {
      margin: 0;
      color: #666;
      font-weight: bold;
    }

    .dashboard-tabs {
      display: flex;
      margin-bottom: 20px;
    }

    .tab-button {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      padding: 10px 20px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .tab-button.active {
      background: #007bff;
      color: white;
    }

    .tab-button:hover:not(.active) {
      background: #e9ecef;
    }

    .loan-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .loan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      border-bottom: 1px solid #dee2e6;
      padding-bottom: 10px;
    }

    .loan-header h3 {
      margin: 0;
      color: #333;
    }

    .days-pending {
      background: #fff3cd;
      color: #856404;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }

    .days-pending.overdue {
      background: #f8d7da;
      color: #721c24;
    }

    .due-date {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      background: #d4edda;
      color: #155724;
    }

    .due-date.due-soon {
      background: #fff3cd;
      color: #856404;
    }

    .due-date.overdue {
      background: #f8d7da;
      color: #721c24;
    }

    .loan-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .loan-details p {
      margin: 5px 0;
      color: #666;
    }

    .loan-actions {
      border-top: 1px solid #dee2e6;
      padding-top: 15px;
    }

    .action-question {
      margin-bottom: 15px;
    }

    .action-question p {
      margin: 0;
      font-weight: bold;
      color: #333;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }

    .approve-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background 0.3s;
    }

    .approve-btn:hover:not(:disabled) {
      background: #218838;
    }

    .reject-btn {
      background: #dc3545;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background 0.3s;
    }

    .reject-btn:hover:not(:disabled) {
      background: #c82333;
    }

    .approve-btn:disabled,
    .reject-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .notes-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .return-section {
      border-top: 1px solid #dee2e6;
      padding-top: 15px;
    }

    .return-section h4 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .return-options {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
    }

    .return-options label {
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
    }

    .return-btn {
      background: #17a2b8;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background 0.3s;
      margin-top: 10px;
    }

    .return-btn:hover:not(:disabled) {
      background: #138496;
    }

    .return-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .success-message {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 6px;
      padding: 15px;
      margin-top: 20px;
      color: #155724;
    }

    .error-message {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 6px;
      padding: 15px;
      margin-top: 20px;
      color: #721c24;
    }

    @media (max-width: 768px) {
      .loan-details {
        grid-template-columns: 1fr;
      }
      
      .action-buttons {
        flex-direction: column;
      }
      
      .return-options {
        flex-direction: column;
        gap: 10px;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  activeTab: 'pending' | 'active' = 'pending';
  pendingLoans: any[] = [];
  activeLoans: any[] = [];
  statistics: any = null;
  
  loanNotes: { [key: number]: string } = {};
  returnNotes: { [key: number]: string } = {};
  returnConditions: { [key: number]: string } = {};
  
  processingLoan: number | null = null;
  processingReturn: number | null = null;
  
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private bookService: BookService) {}

  ngOnInit() {
    this.loadData();
    // Initialize return conditions to 'good' by default
    this.returnConditions = {};
  }

  loadData() {
    this.loadStatistics();
    this.loadPendingLoans();
    this.loadActiveLoans();
  }

  loadStatistics() {
    this.bookService.getLoanStatistics().subscribe({
      next: (response) => {
        if (response.success) {
          this.statistics = response;
        }
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  loadPendingLoans() {
    this.bookService.getPendingLoans().subscribe({
      next: (response) => {
        if (response.success) {
          this.pendingLoans = response.pending_loans;
          // Initialize notes object
          this.pendingLoans.forEach(loan => {
            if (!this.loanNotes[loan.id]) {
              this.loanNotes[loan.id] = '';
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading pending loans:', error);
        this.errorMessage = 'Error al cargar préstamos pendientes';
      }
    });
  }

  loadActiveLoans() {
    this.bookService.getActiveLoans().subscribe({
      next: (response) => {
        if (response.success) {
          this.activeLoans = response.active_loans;
          // Initialize return conditions and notes
          this.activeLoans.forEach(loan => {
            if (!this.returnConditions[loan.id]) {
              this.returnConditions[loan.id] = 'good';
            }
            if (!this.returnNotes[loan.id]) {
              this.returnNotes[loan.id] = '';
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading active loans:', error);
        this.errorMessage = 'Error al cargar préstamos activos';
      }
    });
  }

  setActiveTab(tab: 'pending' | 'active') {
    this.activeTab = tab;
    this.clearMessages();
  }

  approveLoan(loanId: number, broughtCedula: boolean) {
    this.processingLoan = loanId;
    this.clearMessages();

    const notes = this.loanNotes[loanId] || '';
    
    this.bookService.approveLoan(loanId, broughtCedula, notes).subscribe({
      next: (response) => {
        this.processingLoan = null;
        if (response.success) {
          this.successMessage = response.message;
          this.loadData(); // Refresh all data
        } else {
          this.errorMessage = response.message || 'Error al procesar la solicitud';
        }
      },
      error: (error) => {
        this.processingLoan = null;
        this.errorMessage = error.error?.detail || 'Error al procesar la solicitud';
      }
    });
  }

  returnBook(loanId: number) {
    this.processingReturn = loanId;
    this.clearMessages();

    const condition = this.returnConditions[loanId];
    const notes = this.returnNotes[loanId] || '';
    
    this.bookService.returnBook(loanId, condition, notes).subscribe({
      next: (response) => {
        this.processingReturn = null;
        if (response.success) {
          this.successMessage = response.message;
          this.loadData(); // Refresh all data
        } else {
          this.errorMessage = response.message || 'Error al procesar la devolución';
        }
      },
      error: (error) => {
        this.processingReturn = null;
        this.errorMessage = error.error?.detail || 'Error al procesar la devolución';
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }
}