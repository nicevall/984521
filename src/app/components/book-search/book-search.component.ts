import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book.service';
import { BookReservationComponent } from '../book-reservation/book-reservation.component';

@Component({
  selector: 'app-book-search',
  standalone: true,
  imports: [CommonModule, FormsModule, BookReservationComponent],
  template: `
    <div class="book-search-container">
      <div class="search-header">
        <h3>Búsqueda de Libros - Biblioteca UIDE</h3>
        <div class="search-form">
          <div class="search-input-group">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Buscar por título, autor, tema..."
              (keyup.enter)="searchBooks()"
              class="search-input"
            >
            <button 
              (click)="searchBooks()" 
              [disabled]="isSearching || !searchQuery.trim()"
              class="search-btn"
            >
              {{ isSearching ? 'Buscando...' : 'Buscar' }}
            </button>
          </div>
          
          <div class="filter-section">
            <select [(ngModel)]="selectedCareer" (change)="onCareerChange()" class="career-filter">
              <option value="">Todas las carreras</option>
              <option value="SISTEMAS">Ingeniería en Tecnologías de la Información y Comunicación</option>
              <option value="ADMINISTRACION">Administración de Empresas</option>
              <option value="MARKETING">Marketing</option>
              <option value="NEGOCIOS_INTERNACIONALES">Negocios Internacionales</option>
              <option value="PSICOLOGIA">Psicología</option>
              <option value="ARQUITECTURA">Arquitectura</option>
              <option value="DERECHO">Derecho</option>
            </select>
          </div>
        </div>
      </div>

      <div class="search-results" *ngIf="searchResults.length > 0 || hasSearched">
        <div class="results-header" *ngIf="searchResults.length > 0">
          <p>{{ searchResults.length }} libro(s) encontrado(s)</p>
        </div>

        <div class="no-results" *ngIf="hasSearched && searchResults.length === 0">
          <p>No se encontraron libros que coincidan con tu búsqueda.</p>
          <p>Intenta con términos diferentes o selecciona una carrera específica.</p>
        </div>

        <div class="books-grid">
          <div class="book-card" *ngFor="let book of searchResults">
            <div class="book-header">
              <h4>{{ book.titulo }}</h4>
              <div class="status-badge" [ngClass]="getStatusClass(book.status)">
                {{ getStatusText(book.status) }}
              </div>
            </div>
            
            <div class="book-details">
              <p><strong>Autor:</strong> {{ book.autor }}</p>
              <p><strong>Editorial:</strong> {{ book.editorial || 'N/A' }}</p>
              <p><strong>Año:</strong> {{ book['año_publicacion'] || 'N/A' }}</p>
              <p><strong>Categoría:</strong> {{ book.categoria }}</p>
              <p><strong>Carrera:</strong> {{ book.carrera_principal }}</p>
              <p *ngIf="book.codigo_biblioteca"><strong>Código:</strong> {{ book.codigo_biblioteca }}</p>
              <p *ngIf="book.descripcion"><strong>Descripción:</strong> {{ book.descripcion }}</p>
            </div>

            <div class="book-actions">
              <button 
                *ngIf="book.status === 'available'"
                (click)="showReservationModal(book)"
                class="reserve-btn"
              >
                Reservar Libro
              </button>
              
              <button 
                *ngIf="book.status !== 'available'"
                (click)="checkAvailability(book)"
                class="check-btn"
              >
                Ver Disponibilidad
              </button>
              
              <button 
                (click)="viewBookDetails(book)"
                class="details-btn"
              >
                Ver Detalles
              </button>
            </div>

            <!-- Book availability info for non-available books -->
            <div class="availability-info" *ngIf="book.status !== 'available' && book.availability_info">
              <p class="availability-message">{{ book.availability_info.message }}</p>
              <div *ngIf="book.availability_info.current_loan">
                <p><strong>Estudiante:</strong> {{ book.availability_info.student_info?.nombre }}</p>
                <p><strong>Carrera:</strong> {{ book.availability_info.student_info?.carrera }}</p>
                <p *ngIf="book.availability_info.current_loan.due_date">
                  <strong>Fecha de devolución:</strong> {{ formatDate(book.availability_info.current_loan.due_date) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="error-message" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>
    </div>

    <!-- Reservation Modal -->
    <div class="modal-backdrop" *ngIf="showReservationModalFlag" (click)="closeReservationModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Reservar Libro</h3>
          <button class="close-btn" (click)="closeReservationModal()">×</button>
        </div>
        <app-book-reservation 
          [book]="selectedBook"
          (reservationComplete)="onReservationComplete($event)"
          (cancel)="closeReservationModal()"
        ></app-book-reservation>
      </div>
    </div>
  `,
  styles: [`
    .book-search-container {
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
    }

    .search-header {
      margin-bottom: 20px;
    }

    .search-header h3 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .search-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .search-input-group {
      display: flex;
      gap: 10px;
    }

    .search-input {
      flex: 1;
      padding: 10px 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }

    .search-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .search-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      transition: background 0.3s;
    }

    .search-btn:hover:not(:disabled) {
      background: #0056b3;
    }

    .search-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .filter-section {
      display: flex;
      gap: 10px;
    }

    .career-filter {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      background: white;
    }

    .results-header {
      margin: 20px 0 15px 0;
    }

    .results-header p {
      margin: 0;
      color: #666;
      font-weight: bold;
    }

    .no-results {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .books-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .book-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s;
    }

    .book-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }

    .book-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }

    .book-header h4 {
      margin: 0;
      color: #333;
      font-size: 16px;
      line-height: 1.4;
      flex: 1;
      margin-right: 10px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      white-space: nowrap;
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

    .book-details {
      margin-bottom: 15px;
    }

    .book-details p {
      margin: 6px 0;
      color: #666;
      font-size: 14px;
    }

    .book-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .reserve-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: bold;
      transition: background 0.3s;
    }

    .reserve-btn:hover {
      background: #218838;
    }

    .check-btn {
      background: #ffc107;
      color: #212529;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: bold;
      transition: background 0.3s;
    }

    .check-btn:hover {
      background: #e0a800;
    }

    .details-btn {
      background: #6c757d;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: bold;
      transition: background 0.3s;
    }

    .details-btn:hover {
      background: #5a6268;
    }

    .availability-info {
      margin-top: 15px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 6px;
      font-size: 13px;
    }

    .availability-message {
      margin: 0 0 8px 0;
      font-weight: bold;
      color: #856404;
    }

    .availability-info p {
      margin: 4px 0;
      color: #666;
    }

    .error-message {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 6px;
      padding: 15px;
      margin-top: 20px;
      color: #721c24;
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 90%;
      overflow-y: auto;
      position: relative;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 20px 0 20px;
      border-bottom: 1px solid #eee;
      margin-bottom: 20px;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #333;
    }

    @media (max-width: 768px) {
      .books-grid {
        grid-template-columns: 1fr;
      }
      
      .search-input-group {
        flex-direction: column;
      }
      
      .book-actions {
        justify-content: center;
      }
    }
  `]
})
export class BookSearchComponent implements OnInit {
  @Output() reservationMade = new EventEmitter<any>();

  searchQuery: string = '';
  selectedCareer: string = '';
  searchResults: any[] = [];
  isSearching: boolean = false;
  hasSearched: boolean = false;
  errorMessage: string = '';

  showReservationModalFlag: boolean = false;
  selectedBook: any = null;

  constructor(private bookService: BookService) {}

  ngOnInit() {
    // Auto-search if there's an initial query
    if (this.searchQuery.trim()) {
      this.searchBooks();
    }
  }

  searchBooks() {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.isSearching = true;
    this.errorMessage = '';
    this.hasSearched = true;

    this.bookService.searchBooks(this.searchQuery, this.selectedCareer || undefined).subscribe({
      next: (response) => {
        this.isSearching = false;
        if (response.success) {
          this.searchResults = response.books || [];
        } else {
          this.errorMessage = 'Error en la búsqueda de libros';
          this.searchResults = [];
        }
      },
      error: (error) => {
        this.isSearching = false;
        this.errorMessage = 'Error al buscar libros: ' + (error.error?.detail || error.message);
        this.searchResults = [];
      }
    });
  }

  onCareerChange() {
    if (this.hasSearched) {
      this.searchBooks();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'available': return 'status-available';
      case 'pending': return 'status-pending';
      case 'on_loan': return 'status-on-loan';
      default: return 'status-available';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'available': return 'Disponible';
      case 'pending': return 'Reservado';
      case 'on_loan': return 'Prestado';
      default: return 'Disponible';
    }
  }

  showReservationModal(book: any) {
    this.selectedBook = book;
    this.showReservationModalFlag = true;
  }

  closeReservationModal() {
    this.showReservationModalFlag = false;
    this.selectedBook = null;
  }

  checkAvailability(book: any) {
    this.bookService.checkBookAvailability(book.id).subscribe({
      next: (response) => {
        if (response.success) {
          book.availability_info = response;
          book.status = response.book.status;
        }
      },
      error: (error) => {
        console.error('Error checking availability:', error);
      }
    });
  }

  viewBookDetails(book: any) {
    // Could open a detailed modal or navigate to a book detail page
    console.log('View details for book:', book);
  }

  onReservationComplete(result: any) {
    // Close modal and refresh search results
    this.closeReservationModal();
    this.reservationMade.emit(result);
    
    // Update book status in search results
    if (result.success && this.selectedBook) {
      const bookIndex = this.searchResults.findIndex(b => b.id === this.selectedBook.id);
      if (bookIndex > -1) {
        this.searchResults[bookIndex].status = 'pending';
      }
    }
    
    // Refresh search to get updated statuses
    if (this.hasSearched) {
      setTimeout(() => this.searchBooks(), 1000);
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }
}