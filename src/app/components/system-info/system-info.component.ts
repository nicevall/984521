// src/app/components/system-info/system-info.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackendChatService } from '../../services/backend-chat.service';
import { BackendHealthStatus } from '../../models/backend-response.model';

@Component({
    selector: 'app-system-info',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="system-info-overlay" (click)="closeModal()">
      <div class="system-info-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="text-title-2">Sistema Bibliotecario - Estado</h2>
          <button class="close-button" (click)="closeModal()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-content">
          <div class="info-section">
            <h3 class="section-title">Estado de Conexión</h3>
            <div class="status-item">
              <div class="status-indicator" [class.success]="backendStatus?.status === 'healthy'" [class.error]="backendStatus?.status !== 'healthy'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path *ngIf="backendStatus?.status === 'healthy'" d="M20 6L9 17l-5-5"/>
                  <circle *ngIf="backendStatus?.status !== 'healthy'" cx="12" cy="12" r="10"/>
                  <line *ngIf="backendStatus?.status !== 'healthy'" x1="15" y1="9" x2="9" y2="15"/>
                  <line *ngIf="backendStatus?.status !== 'healthy'" x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <span>{{ backendStatus?.status === 'healthy' ? 'Backend conectado' : 'Backend desconectado' }}</span>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-title">Configuración Actual</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Carrera seleccionada:</span>
                <span class="value">{{ getCurrentCareerName() }}</span>
              </div>
              <div class="info-item">
                <span class="label">Código de carrera:</span>
                <span class="value">{{ getCurrentCareerCode() }}</span>
              </div>
              <div class="info-item">
                <span class="label">Sesión activa:</span>
                <span class="value">{{ hasActiveSession() ? 'Sí' : 'No' }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-title">Funcionalidades</h3>
            <div class="capabilities-grid">
              <div class="capability-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span>Chat inteligente con IA</span>
              </div>
              <div class="capability-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span>Búsqueda de libros</span>
              </div>
              <div class="capability-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span>RAG con base de conocimiento UIDE</span>
              </div>
              <div class="capability-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span>Respuestas contextuales por carrera</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-title">Prueba de Conexión</h3>
            <button 
              class="test-button apple-button primary"
              (click)="testConnection()"
              [disabled]="testing">
              {{ testing ? 'Probando...' : 'Probar Backend' }}
            </button>
            
            <div *ngIf="testResult" class="test-result" 
                 [class.success]="testResult.success" 
                 [class.error]="!testResult.success">
              <div class="result-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path *ngIf="testResult.success" d="M20 6L9 17l-5-5"/>
                  <circle *ngIf="!testResult.success" cx="12" cy="12" r="10"/>
                  <line *ngIf="!testResult.success" x1="15" y1="9" x2="9" y2="15"/>
                  <line *ngIf="!testResult.success" x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span>{{ testResult.success ? 'Conexión exitosa' : 'Error de conexión' }}</span>
              </div>
              <div class="result-details" *ngIf="testResult.response || testResult.error">
                {{ testResult.response || testResult.error }}
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-title">Información Técnica</h3>
            <div class="tech-info">
              <div class="tech-item">
                <span class="label">Frontend:</span>
                <span class="value">Angular 18</span>
              </div>
              <div class="tech-item">
                <span class="label">Backend:</span>
                <span class="value">FastAPI + Python</span>
              </div>
              <div class="tech-item">
                <span class="label">IA:</span>
                <span class="value">Google Gemini + RAG</span>
              </div>
              <div class="tech-item">
                <span class="label">Modo:</span>
                <span class="value">{{ isDarkMode ? 'Oscuro' : 'Claro' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="apple-button secondary" (click)="closeModal()">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .system-info-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease-out;
    }

    .system-info-modal {
      background: var(--system-background);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--separator-non-opaque);
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--separator-non-opaque);
      background: var(--system-secondary-background);
    }

    .close-button {
      background: none;
      border: none;
      color: var(--label-secondary);
      cursor: pointer;
      padding: var(--spacing-xs);
      border-radius: var(--border-radius-sm);
      transition: all var(--transition-fast);
      
      &:hover {
        background: var(--fill-tertiary);
        color: var(--label-primary);
      }
    }

    .modal-content {
      padding: var(--spacing-lg);
      max-height: 60vh;
      overflow-y: auto;
    }

    .info-section {
      margin-bottom: var(--spacing-xl);
      
      &:last-child {
        margin-bottom: 0;
      }
    }

    .section-title {
      margin-bottom: var(--spacing-md);
      color: var(--label-primary);
      font-weight: 600;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      
      &.success {
        background: var(--apple-green);
        color: white;
      }
      
      &.error {
        background: var(--apple-red);
        color: white;
      }
    }

    .info-grid, .tech-info {
      display: grid;
      gap: var(--spacing-sm);
    }

    .info-item, .tech-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm);
      background: var(--system-secondary-background);
      border-radius: var(--border-radius-md);
    }

    .label {
      font-weight: 500;
      color: var(--label-secondary);
    }

    .value {
      font-family: var(--font-family-mono);
      color: var(--label-primary);
      font-size: 14px;
    }

    .capabilities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-sm);
    }

    .capability-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
      background: var(--system-secondary-background);
      border-radius: var(--border-radius-md);
      color: var(--apple-green);
    }

    .test-button {
      margin-bottom: var(--spacing-md);
    }

    .test-result {
      padding: var(--spacing-md);
      border-radius: var(--border-radius-md);
      border: 1px solid;
      
      &.success {
        background: rgba(52, 199, 89, 0.1);
        border-color: var(--apple-green);
        color: var(--apple-green);
      }
      
      &.error {
        background: rgba(255, 59, 48, 0.1);
        border-color: var(--apple-red);
        color: var(--apple-red);
      }
    }

    .result-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-weight: 600;
      margin-bottom: var(--spacing-sm);
    }

    .result-details {
      font-size: 14px;
      opacity: 0.8;
      font-family: var(--font-family-mono);
    }

    .modal-footer {
      padding: var(--spacing-lg);
      border-top: 1px solid var(--separator-non-opaque);
      background: var(--system-secondary-background);
      text-align: right;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (max-width: 768px) {
      .system-info-modal {
        width: 95%;
        margin: var(--spacing-md);
      }
      
      .capabilities-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SystemInfoComponent implements OnInit {
    backendStatus: BackendHealthStatus | null = null;
    testing = false;
    testResult: any = null;
    isDarkMode = false;

    constructor(private backendChatService: BackendChatService) { }

    async ngOnInit() {
        this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.loadBackendStatus();
    }

    async testConnection() {
        this.testing = true;
        this.testResult = null;

        this.backendChatService.testChatSystem().subscribe({
            next: (response) => {
                this.testResult = {
                    success: response.success || false,
                    response: response.message || 'Conexión exitosa con el backend'
                };
                this.testing = false;
            },
            error: (error) => {
                this.testResult = {
                    success: false,
                    error: error.message || 'Error de conexión con el backend'
                };
                this.testing = false;
            }
        });
    }

    private loadBackendStatus() {
        this.backendChatService.testConnection().subscribe({
            next: (response) => {
                this.backendStatus = response;
            },
            error: (error) => {
                this.backendStatus = {
                    status: 'unhealthy',
                    message: 'Error de conexión',
                    timestamp: new Date().toISOString()
                };
            }
        });
    }

    getCurrentCareerName(): string {
        const carreraMap: { [key: string]: string } = {
            'ADMINISTRACION': 'Administración de Empresas',
            'MARKETING': 'Marketing',
            'NEGOCIOS_INTERNACIONALES': 'Negocios Internacionales',
            'SISTEMAS': 'Ingeniería en Sistemas',
            'PSICOLOGIA': 'Psicología',
            'ARQUITECTURA': 'Arquitectura',
            'DERECHO': 'Derecho'
        };
        const carrera = this.backendChatService.getCurrentCarrera();
        return carreraMap[carrera] || carrera;
    }

    getCurrentCareerCode(): string {
        return this.backendChatService.getCurrentCarrera();
    }

    hasActiveSession(): boolean {
        return this.backendChatService.hasActiveSession();
    }

    closeModal() {
        document.body.dispatchEvent(new CustomEvent('closeSystemInfo'));
    }
}