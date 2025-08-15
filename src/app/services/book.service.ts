import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private baseUrl = 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Search books
  searchBooks(query: string, carrera?: string): Observable<any> {
    const params: any = { query };
    if (carrera) {
      params.carrera = carrera;
    }
    
    return this.http.get(`${this.baseUrl}/books/search`, { params });
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

  // Admin endpoints
  getPendingLoans(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/loans/pending`);
  }

  getActiveLoans(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/loans/active`);
  }

  getLoanStatistics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/loans/stats`);
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
      this.getHttpOptions()
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
      this.getHttpOptions()
    );
  }

  // Get all available careers
  getCareers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/carreras`);
  }
}