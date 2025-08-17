import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminAuthService } from './admin-auth.service';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private baseUrl = 'http://localhost:8000/api/v1';

  constructor(
    private http: HttpClient,
    private adminAuthService: AdminAuthService
  ) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Search books with advanced filters
  searchBooks(
    query: string, 
    carrera?: string,
    categoria?: string,
    disponible?: boolean,
    nivel_academico?: string,
    año_desde?: number,
    año_hasta?: number,
    idioma?: string
  ): Observable<any> {
    const params: any = {};
    
    if (query) params.q = query;
    if (carrera) params.carrera = carrera;
    if (categoria) params.categoria = categoria;
    if (disponible !== undefined) params.disponible = disponible;
    if (nivel_academico) params.nivel_academico = nivel_academico;
    if (año_desde) params.año_desde = año_desde;
    if (año_hasta) params.año_hasta = año_hasta;
    if (idioma) params.idioma = idioma;
    
    return this.http.get(`${this.baseUrl}/books/search`, { params });
  }

  // Get available filter options
  getFilterOptions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/books/filters`);
  }

  // Get book by ID
  getBook(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/books/${id}`);
  }

  // Reserve a book
  reserveBook(bookId: number, studentCedula: string): Observable<any> {
    const payload = { student_cedula: studentCedula };
    return this.http.post(
      `${this.baseUrl}/books/${bookId}/reserve`,
      payload,
      this.getHttpOptions()
    );
  }

  // Check book availability
  checkBookAvailability(bookId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/books/${bookId}/availability`);
  }

  // Get student loans
  getStudentLoans(cedula: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/students/${cedula}/loans`);
  }

  // Admin endpoints (require authentication)
  getPendingLoans(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/loans/pending`, this.adminAuthService.getAuthenticatedHttpOptions());
  }

  getActiveLoans(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/loans/active`, this.adminAuthService.getAuthenticatedHttpOptions());
  }

  getLoanStatistics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/stats`, this.adminAuthService.getAuthenticatedHttpOptions());
  }

  approveLoan(loanId: number, broughtCedula: boolean, notes?: string, loanDays?: number): Observable<any> {
    const payload = {
      brought_cedula: broughtCedula,
      notes: notes || '',
      loan_days: loanDays || 14
    };
    return this.http.post(
      `${this.baseUrl}/admin/loans/${loanId}/approve`,
      payload,
      this.adminAuthService.getAuthenticatedHttpOptions()
    );
  }

  returnBook(loanId: number, condition: string, notes?: string): Observable<any> {
    const payload = {
      condition: condition,
      notes: notes || ''
    };
    return this.http.post(
      `${this.baseUrl}/admin/loans/${loanId}/return`,
      payload,
      this.adminAuthService.getAuthenticatedHttpOptions()
    );
  }

  // Get all available careers
  getCareers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/carreras`);
  }
}