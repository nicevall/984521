import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book.service';

@Component({
  selector: 'app-book-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reservation-container" *ngIf="book">
      <div class="book-info">
        <h3>{{ book.titulo }}</h3>
        <p><strong>Autor:</strong> {{ book.autor }}</p>
        <p><strong>Categoría:</strong> {{ book.categoria }}</p>
        <p><strong>Carrera:</strong> {{ book.carrera_principal }}</p>
        <div class="status-badge" [ngClass]="getStatusClass()">
          {{ getStatusText() }}
        </div>
      </div>

      <div class="reservation-form" *ngIf="canReserve()">
        <h4>Reservar Libro</h4>
        <div class="form-group">
          <label for="cedula">Número de Cédula:</label>
          <input 
            type="text" 
            id="cedula" 
            [(ngModel)]="studentCedula" 
            placeholder="Ingresa tu número de cédula"
            [disabled]="isLoading"
            maxlength="10"
          >
        </div>
        
        <div class="warning-box" *ngIf="showWarning">
          <p class="warning-text">
            🔴 <strong>IMPORTANTE:</strong> Debes traer tu cédula original para retirar el libro.
          </p>
          <p class="warning-text">
            ⚠️ <strong>ADVERTENCIA:</strong> Si no traes tu cédula hoy, tu reserva será cancelada automáticamente.
          </p>
        </div>

        <div class="form-actions">
          <button 
            (click)="reserveBook()" 
            [disabled]="!studentCedula || isLoading"
            class="reserve-btn"
          >
            {{ isLoading ? 'Procesando...' : 'Reservar Libro' }}
          </button>
          <button (click)="cancelReservation()" class="cancel-btn">
            Cancelar
          </button>
        </div>
      </div>

      <div class="unavailable-info" *ngIf="!canReserve()">
        <h4>Libro No Disponible</h4>
        <p>{{ unavailableMessage }}</p>
        <div class="current-loan-info" *ngIf="currentLoan">
          <p><strong>Estado:</strong> {{ getStatusText() }}</p>
          <p *ngIf="currentLoan.reservation_date">
            <strong>Fecha de reserva:</strong> {{ formatDate(currentLoan.reservation_date) }}
          </p>
          <p *ngIf="currentLoan.due_date">
            <strong>Fecha de devolución:</strong> {{ formatDate(currentLoan.due_date) }}
          </p>
        </div>
      </div>

      <div class="success-message" *ngIf="reservationSuccess">
        <h4>¡Reserva Exitosa!</h4>
        <p>{{ successMessage }}</p>
        <div class="instructions">
          <h5>Instrucciones:</h5>
          <ul>
            <li>Trae tu cédula original</li>
            <li>Dirígete a la biblioteca hoy mismo</li>
            <li>Pregunta por el libro con código: {{ book.codigo_biblioteca }}</li>
            <li>Presenta tu cédula al bibliotecario</li>
          </ul>
        </div>
      </div>

      <div class="error-message" *ngIf="errorMessage">
        <p>{{ errorMessage }}</p>
      </div>
    </div>
  `,
  styles: [`
    .reservation-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .book-info {
      margin-bottom: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .book-info h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .book-info p {
      margin: 5px 0;
      color: #666;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 10px;
    }

    .status-available {
      background: #d4edda;
      color: #155724;
    }

    .status-pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-on-loan {
      background: #f8d7da;
      color: #721c24;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #333;
    }

    .form-group input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-group input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .warning-box {
      background: #ffe6e6;
      border: 2px solid #ff0000;
      border-radius: 6px;
      padding: 15px;
      margin: 15px 0;
    }

    .warning-text {
      margin: 5px 0;
      color: #d32f2f;
      font-weight: bold;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .reserve-btn {
      flex: 1;
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .reserve-btn:hover:not(:disabled) {
      background: #218838;
    }

    .reserve-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .cancel-btn {
      background: #6c757d;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .cancel-btn:hover {
      background: #5a6268;
    }

    .unavailable-info {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 15px;
      margin-top: 15px;
    }

    .current-loan-info {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #dee2e6;
    }

    .success-message {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 6px;
      padding: 15px;
      margin-top: 15px;
    }

    .success-message h4 {
      color: #155724;
      margin: 0 0 10px 0;
    }

    .instructions {
      margin-top: 15px;
    }

    .instructions h5 {
      color: #155724;
      margin: 0 0 10px 0;
    }

    .instructions ul {
      margin: 0;
      padding-left: 20px;
    }

    .instructions li {
      margin: 5px 0;
      color: #155724;
    }

    .error-message {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 6px;
      padding: 15px;
      margin-top: 15px;
      color: #721c24;
    }
  `]
})
export class BookReservationComponent implements OnInit {
  @Input() book: any = null;
  @Output() reservationComplete = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  studentCedula: string = '';
  isLoading: boolean = false;
  showWarning: boolean = false;
  reservationSuccess: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  unavailableMessage: string = '';
  currentLoan: any = null;

  constructor(private bookService: BookService) {}

  ngOnInit() {
    if (this.book) {
      this.checkBookAvailability();
    }
  }

  checkBookAvailability() {
    this.bookService.checkBookAvailability(this.book.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.book.status = response.book.status;
          this.currentLoan = response.current_loan;
          this.unavailableMessage = response.message;
        }
      },
      error: (error) => {
        console.error('Error checking availability:', error);
      }
    });
  }

  canReserve(): boolean {
    return this.book && this.book.status === 'available' && !this.reservationSuccess;
  }

  getStatusClass(): string {
    switch (this.book?.status) {
      case 'available': return 'status-available';
      case 'pending': return 'status-pending';
      case 'on_loan': return 'status-on-loan';
      default: return 'status-available';
    }
  }

  getStatusText(): string {
    switch (this.book?.status) {
      case 'available': return 'Disponible';
      case 'pending': return 'Reservado';
      case 'on_loan': return 'Prestado';
      default: return 'Disponible';
    }
  }

  reserveBook() {
    if (!this.studentCedula || this.studentCedula.length !== 10) {
      this.errorMessage = 'Por favor ingresa un número de cédula válido (10 dígitos)';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.showWarning = true;

    this.bookService.reserveBook(this.book.id, this.studentCedula).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.reservationSuccess = true;
          this.successMessage = response.message;
          this.book.status = 'pending';
          this.reservationComplete.emit(response);
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.detail || 'Error al procesar la reserva';
      }
    });
  }

  cancelReservation() {
    this.cancel.emit();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }
}