// src/app/components/system-info/system-info.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiInfoService, GeminiInfo } from '../../services/gemini-info.service';

@Component({
    selector: 'app-system-info',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="system-info-overlay" (click)="closeModal()">
      <div class="system-info-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="text-title-2">Información del Sistema</h2>
          <button class="close-button" (click)="closeModal()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-content" *ngIf="geminiInfo">
          <div class="info-section">
            <h3 class="section-title">Estado de Configuración</h3>
            <div class="status-item">
              <div class="status-indicator" [class.success]="geminiInfo.isConfigured" [class.error]="!geminiInfo.isConfigured">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path *ngIf="geminiInfo.isConfigured" d="M20 6L9 17l-5-5"/>
                  <circle *ngIf="!geminiInfo.isConfigured" cx="12" cy="12" r="10"/>
                  <line *ngIf="!geminiInfo.isConfigured" x1="15" y1="9" x2="9" y2="15"/>
                  <line *ngIf="!geminiInfo.isConfigured" x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <span>{{ geminiInfo.isConfigured ? 'API Key configurada' : 'API Key no configurada' }}</span>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-title">Modelo de IA</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Modelo actual:</span>
                <span class="value">{{ geminiInfo.model }}</span>
              </div>
              <div class="info-item">
                <span class="label">Versión:</span>
                <span class="value">{{ geminiInfo.version }}</span>
              </div>
              <div class="info-item">
                <span class="label">Librería:</span>
                <span class="value">&#64;google/generative-ai v{{ geminiInfo.libraryVersion }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-title">Capacidades</h3>
            <div class="capabilities-grid">
              <div *ngFor="let capability of geminiInfo.capabilities" class="capability-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span>{{ capability }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3 class="section-title">Prueba de Conexión</h3>
            <button 
              class="test-button apple-button primary"
              (click)="testConnection()"
              [disabled]="testing || !geminiInfo.isConfigured">
              {{ testing ? 'Probando...' : 'Probar Conexión' }}
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
                <span class="label">Framework:</span>
                <span class="value">Angular 18</span>
              </div>
              <div class="tech-item">
                <span class="label">Diseño:</span>
                <span class="value">Apple Human Interface Guidelines</span>
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
    geminiInfo: GeminiInfo | null = null;
    testing = false;
    testResult: any = null;
    isDarkMode = false;

    constructor(private geminiInfoService: GeminiInfoService) { }

    async ngOnInit() {
        this.geminiInfo = await this.geminiInfoService.getGeminiInfo();
        this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    async testConnection() {
        this.testing = true;
        this.testResult = null;

        try {
            this.testResult = await this.geminiInfoService.testCurrentModel();
        } catch (error) {
            this.testResult = {
                success: false,
                error: 'Error inesperado durante la prueba'
            };
        } finally {
            this.testing = false;
        }
    }

    closeModal() {
        document.body.dispatchEvent(new CustomEvent('closeSystemInfo'));
    }
}