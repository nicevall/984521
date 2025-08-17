import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminAuthService, LoginRequest, AdminUser } from '../../services/admin-auth.service';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <!-- Header -->
        <div class="login-header">
          <div class="logo-section">
            <h1>📚 Sistema Biblioteca UIDE</h1>
            <h2>Panel de Administración</h2>
          </div>
        </div>

        <!-- Información de usuarios disponibles -->
        <div class="demo-users-info" *ngIf="showDemoUsers">
          <h3>Usuarios Demo Disponibles:</h3>
          <div class="user-card" *ngFor="let user of demoUsers">
            <div class="user-info">
              <strong>{{ user.username }}</strong>
              <span class="role-badge" [class]="'role-' + user.role">{{ user.roleDisplay }}</span>
            </div>
            <div class="user-permissions">
              <span class="permission" *ngFor="let permission of user.permissions">{{ permission }}</span>
            </div>
            <button class="quick-login-btn" (click)="quickLogin(user.username, user.password)">
              Acceso Rápido
            </button>
          </div>
          <button class="toggle-demo-btn" (click)="showDemoUsers = false">
            Ocultar usuarios demo
          </button>
        </div>

        <!-- Botón para mostrar usuarios demo -->
        <div class="show-demo-section" *ngIf="!showDemoUsers">
          <button class="show-demo-btn" (click)="showDemoUsers = true">
            Ver usuarios demo disponibles
          </button>
        </div>

        <!-- Formulario de login -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="username">Usuario:</label>
            <input
              type="text"
              id="username"
              formControlName="username"
              class="form-control"
              placeholder="Ingrese su nombre de usuario"
              [class.error]="loginForm.get('username')?.invalid && loginForm.get('username')?.touched"
            >
            <div class="error-message" *ngIf="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
              El usuario es requerido
            </div>
          </div>

          <div class="form-group">
            <label for="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              class="form-control"
              placeholder="Ingrese su contraseña"
              [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
            >
            <div class="error-message" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              La contraseña es requerida
            </div>
          </div>

          <button
            type="submit"
            class="login-btn"
            [disabled]="loginForm.invalid || isLoading"
          >
            {{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
        </form>

        <!-- Mensajes de estado -->
        <div class="success-message" *ngIf="successMessage">
          {{ successMessage }}
        </div>

        <div class="error-message" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>

        <!-- Usuario actual (si está logueado) -->
        <div class="current-user-info" *ngIf="currentAdmin">
          <h3>Sesión Activa</h3>
          <div class="user-details">
            <p><strong>Usuario:</strong> {{ currentAdmin.username }}</p>
            <p><strong>Nombre:</strong> {{ currentAdmin.nombre_completo }}</p>
            <p><strong>Rol:</strong> 
              <span class="role-badge" [class]="'role-' + currentAdmin.role">
                {{ getRoleDisplay(currentAdmin.role) }}
              </span>
            </p>
            <p><strong>Permisos:</strong></p>
            <div class="permissions-list">
              <span class="permission" *ngIf="currentAdmin.can_approve">✅ Aprobar Préstamos</span>
              <span class="permission" *ngIf="currentAdmin.can_reject">❌ Rechazar Préstamos</span>
              <span class="permission" *ngIf="currentAdmin.can_return">📤 Procesar Devoluciones</span>
              <span class="permission" *ngIf="currentAdmin.can_manage_users">👥 Gestionar Usuarios</span>
            </div>
          </div>
          <div class="action-buttons">
            <button class="dashboard-btn" (click)="goToDashboard()">
              Ir al Dashboard
            </button>
            <button class="logout-btn" (click)="logout()">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
      padding: 40px;
      min-width: 400px;
      max-width: 600px;
      width: 100%;
    }

    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .logo-section h1 {
      color: #2c3e50;
      margin: 0 0 10px 0;
      font-size: 28px;
    }

    .logo-section h2 {
      color: #7f8c8d;
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: normal;
    }

    .demo-users-info {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      border: 2px solid #e9ecef;
    }

    .demo-users-info h3 {
      color: #495057;
      margin: 0 0 15px 0;
      font-size: 16px;
    }

    .user-card {
      background: white;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 10px;
      border: 1px solid #dee2e6;
    }

    .user-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .user-info strong {
      color: #2c3e50;
      font-size: 14px;
    }

    .role-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .role-badge.role-admin {
      background: #e74c3c;
      color: white;
    }

    .role-badge.role-supervisor {
      background: #f39c12;
      color: white;
    }

    .role-badge.role-bibliotecario {
      background: #27ae60;
      color: white;
    }

    .user-permissions {
      margin-bottom: 10px;
    }

    .permission {
      display: inline-block;
      background: #ecf0f1;
      color: #2c3e50;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      margin: 2px;
    }

    .quick-login-btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.3s;
    }

    .quick-login-btn:hover {
      background: #2980b9;
    }

    .toggle-demo-btn, .show-demo-btn {
      background: #95a5a6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-top: 10px;
      width: 100%;
    }

    .show-demo-section {
      text-align: center;
      margin-bottom: 20px;
    }

    .login-form {
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #2c3e50;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #ecf0f1;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #3498db;
    }

    .form-control.error {
      border-color: #e74c3c;
    }

    .login-btn {
      width: 100%;
      padding: 14px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s;
    }

    .login-btn:hover:not(:disabled) {
      background: #2980b9;
    }

    .login-btn:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
    }

    .current-user-info {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }

    .current-user-info h3 {
      color: #155724;
      margin: 0 0 15px 0;
    }

    .user-details p {
      margin: 8px 0;
      color: #155724;
    }

    .permissions-list {
      margin-top: 10px;
    }

    .permissions-list .permission {
      background: #c3e6cb;
      color: #155724;
      margin: 2px;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .dashboard-btn {
      flex: 1;
      background: #28a745;
      color: white;
      border: none;
      padding: 10px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .logout-btn {
      flex: 1;
      background: #dc3545;
      color: white;
      border: none;
      padding: 10px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .success-message {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 6px;
      padding: 12px;
      margin: 10px 0;
      color: #155724;
      text-align: center;
    }

    .error-message {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 6px;
      padding: 12px;
      margin: 10px 0;
      color: #721c24;
      text-align: center;
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 20px;
        min-width: auto;
      }
      
      .action-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class AdminLoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  currentAdmin: AdminUser | null = null;
  showDemoUsers = false;

  private subscription = new Subscription();

  demoUsers = [
    {
      username: 'admin',
      password: '123456',
      role: 'admin',
      roleDisplay: 'Administrador',
      permissions: ['✅ Todos los permisos', '👥 Gestión completa']
    },
    {
      username: 'test_admin',
      password: '123456',
      role: 'supervisor',
      roleDisplay: 'Supervisor',
      permissions: ['✅ Aprobar', '❌ Rechazar', '📤 Devoluciones']
    },
    {
      username: 'bibliotecario_test',
      password: '123456',
      role: 'bibliotecario',
      roleDisplay: 'Bibliotecario',
      permissions: ['✅ Aprobar préstamos únicamente']
    }
  ];

  constructor(
    private fb: FormBuilder,
    private adminAuthService: AdminAuthService,
    private layoutService: LayoutService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    // Suscribirse al estado del admin actual
    this.subscription.add(
      this.adminAuthService.currentAdmin$.subscribe(admin => {
        this.currentAdmin = admin;
        if (admin) {
          this.successMessage = `¡Bienvenido ${admin.nombre_completo}!`;
          this.errorMessage = '';
        }
      })
    );

    // Si ya está logueado, mostrar información
    if (this.adminAuthService.isLoggedIn()) {
      this.currentAdmin = this.adminAuthService.getCurrentAdminValue();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const credentials: LoginRequest = this.loginForm.value;

      this.subscription.add(
        this.adminAuthService.login(credentials).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = `¡Inicio de sesión exitoso! Bienvenido ${response.admin_info.nombre_completo}`;
            
            // Limpiar formulario
            this.loginForm.reset();
            
            // Redireccionar al dashboard después de 2 segundos
            setTimeout(() => {
              this.layoutService.setCurrentView('admin');
            }, 2000);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.error?.detail || 'Error al iniciar sesión. Verifica tus credenciales.';
            console.error('Login error:', error);
          }
        })
      );
    } else {
      this.markFormGroupTouched();
    }
  }

  quickLogin(username: string, password: string) {
    this.loginForm.patchValue({ username, password });
    this.onSubmit();
  }

  logout() {
    this.isLoading = true;
    this.subscription.add(
      this.adminAuthService.logout().subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Sesión cerrada exitosamente';
          this.currentAdmin = null;
        },
        error: (error) => {
          this.isLoading = false;
          // Incluso si hay error, hacer logout local
          this.adminAuthService.logoutLocal();
          this.successMessage = 'Sesión cerrada';
          this.currentAdmin = null;
          console.error('Logout error:', error);
        }
      })
    );
  }

  goToDashboard() {
    this.layoutService.setCurrentView('admin');
  }

  getRoleDisplay(role: string): string {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrador',
      'supervisor': 'Supervisor',
      'bibliotecario': 'Bibliotecario'
    };
    return roleMap[role] || role;
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}