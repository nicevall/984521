import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  nombre_completo: string;
  role: string;
  is_active: boolean;
  can_approve: boolean;
  can_reject: boolean;
  can_return: boolean;
  can_manage_users: boolean;
  last_login: string | null;
  total_loans_processed: number;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  admin_info: AdminUser;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private baseUrl = 'http://localhost:8000/api/v1/admin';
  private currentAdminSubject = new BehaviorSubject<AdminUser | null>(null);
  private tokenKey = 'admin_token';
  private adminKey = 'admin_user';

  public currentAdmin$ = this.currentAdminSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar admin desde localStorage al inicializar
    this.loadStoredAdmin();
  }

  private loadStoredAdmin(): void {
    const token = localStorage.getItem(this.tokenKey);
    const adminData = localStorage.getItem(this.adminKey);
    
    if (token && adminData) {
      try {
        const admin = JSON.parse(adminData);
        this.currentAdminSubject.next(admin);
      } catch (error) {
        console.error('Error parsing stored admin data:', error);
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap(response => {
          // Guardar token y datos del admin
          localStorage.setItem(this.tokenKey, response.access_token);
          localStorage.setItem(this.adminKey, JSON.stringify(response.admin_info));
          
          // Actualizar el subject
          this.currentAdminSubject.next(response.admin_info);
        })
      );
  }

  logout(): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.post(`${this.baseUrl}/logout`, {}, { headers })
      .pipe(
        tap(() => {
          this.clearStoredData();
        })
      );
  }

  logoutLocal(): void {
    this.clearStoredData();
  }

  private clearStoredData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.adminKey);
    this.currentAdminSubject.next(null);
  }

  getCurrentAdmin(): Observable<AdminUser> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<AdminUser>(`${this.baseUrl}/me`, { headers })
      .pipe(
        tap(admin => {
          // Actualizar datos almacenados
          localStorage.setItem(this.adminKey, JSON.stringify(admin));
          this.currentAdminSubject.next(admin);
        })
      );
  }

  refreshCurrentAdmin(): Observable<AdminUser> {
    return this.getCurrentAdmin();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const admin = this.currentAdminSubject.value;
    return !!(token && admin);
  }

  getCurrentAdminValue(): AdminUser | null {
    return this.currentAdminSubject.value;
  }

  // Métodos para verificar permisos
  canApproveLoans(): boolean {
    const admin = this.getCurrentAdminValue();
    return admin ? admin.can_approve : false;
  }

  canRejectLoans(): boolean {
    const admin = this.getCurrentAdminValue();
    return admin ? admin.can_reject : false;
  }

  canReturnBooks(): boolean {
    const admin = this.getCurrentAdminValue();
    return admin ? admin.can_return : false;
  }

  canManageUsers(): boolean {
    const admin = this.getCurrentAdminValue();
    return admin ? admin.can_manage_users : false;
  }

  isAdmin(): boolean {
    const admin = this.getCurrentAdminValue();
    return admin ? admin.role === 'admin' : false;
  }

  isSupervisor(): boolean {
    const admin = this.getCurrentAdminValue();
    return admin ? admin.role === 'supervisor' : false;
  }

  isBibliotecario(): boolean {
    const admin = this.getCurrentAdminValue();
    return admin ? admin.role === 'bibliotecario' : false;
  }

  getRoleDisplay(): string {
    const admin = this.getCurrentAdminValue();
    if (!admin) return 'No autenticado';
    
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrador',
      'supervisor': 'Supervisor',
      'bibliotecario': 'Bibliotecario'
    };
    
    return roleMap[admin.role] || admin.role;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Métodos para operaciones autenticadas
  getAuthenticatedHttpOptions() {
    return {
      headers: this.getAuthHeaders()
    };
  }
}