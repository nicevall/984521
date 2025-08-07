// src/app/components/model-selector/model-selector.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService, GeminiModel } from '../../services/gemini.service';

@Component({
    selector: 'app-model-selector',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="model-selector-overlay" (click)="closeSelector()">
      <div class="model-selector-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="text-title-3">Seleccionar Modelo AI</h3>
          <button 
            class="close-button apple-button icon-only secondary"
            (click)="closeSelector()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-content">
          <div class="current-model-info">
            <div class="current-label">Modelo Actual:</div>
            <div class="current-model">
              <div class="model-name">{{ currentModel.name }}</div>
              <div class="model-params">{{ currentModel.parameters }}</div>
            </div>
          </div>

          <div class="models-grid">
            <div 
              *ngFor="let model of availableModels"
              class="model-card"
              [class.active]="model.id === currentModel.id"
              [class.recommended]="model.isRecommended"
              (click)="selectModel(model)">
              
              <div class="model-header">
                <div class="model-title">
                  <h4>{{ model.name }}</h4>
                  <span class="model-badge" *ngIf="model.isRecommended">Recomendado</span>
                </div>
                <div class="model-parameters">{{ model.parameters }}</div>
              </div>

              <p class="model-description">{{ model.description }}</p>

              <div class="model-capabilities">
                <span 
                  *ngFor="let capability of model.capabilities"
                  class="capability-tag">
                  {{ capability }}
                </span>
              </div>

              <div class="model-status" *ngIf="model.id === currentModel.id">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
                En uso
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-info">
            <p class="text-caption-1">
              Todos los modelos están disponibles gratuitamente en el tier free de Gemini API.
              Los modelos 2.0 y 2.5 incluyen las últimas mejoras y capacidades.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .model-selector-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease-out;
    }

    .model-selector-modal {
      background: #ffffff;
      border-radius: 20px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 24px 16px;
      border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
      background: rgba(248, 248, 248, 0.8);
      
      h3 {
        margin: 0;
        color: #1d1d1f;
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      
      .close-button {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.05);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: rgba(0, 0, 0, 0.1);
          transform: scale(1.05);
        }
        
        svg {
          width: 16px;
          height: 16px;
          color: #333;
        }
      }
    }

    .modal-content {
      padding: 24px;
      max-height: calc(90vh - 120px);
      overflow-y: auto;
      
      &::-webkit-scrollbar {
        width: 0;
      }
    }

    .current-model-info {
      background: linear-gradient(135deg, #007AFF, #5856D6);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
      color: white;
      
      .current-label {
        font-size: 14px;
        opacity: 0.8;
        margin-bottom: 8px;
        font-weight: 500;
      }
      
      .current-model {
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        .model-name {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        
        .model-params {
          font-size: 14px;
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
        }
      }
    }

    .models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 16px;
    }

    .model-card {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 16px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        border-color: #007aff;
      }
      
      &.active {
        border-color: #007aff;
        background: linear-gradient(135deg, rgba(0, 122, 255, 0.05), rgba(88, 86, 214, 0.05));
        box-shadow: 0 4px 20px rgba(0, 122, 255, 0.15);
      }
      
      &.recommended::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(135deg, #34C759, #30D158);
      }
    }

    .model-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 12px;
      
      .model-title {
        display: flex;
        flex-direction: column;
        gap: 6px;
        
        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1d1d1f;
          letter-spacing: -0.01em;
        }
        
        .model-badge {
          display: inline-block;
          background: #34C759;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          width: fit-content;
        }
      }
      
      .model-parameters {
        background: rgba(0, 0, 0, 0.06);
        color: #1d1d1f;
        font-size: 12px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 12px;
        white-space: nowrap;
      }
    }

    .model-description {
      color: #6e6e73;
      font-size: 14px;
      line-height: 1.4;
      margin-bottom: 16px;
      margin-top: 0;
    }

    .model-capabilities {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
      
      .capability-tag {
        background: rgba(0, 122, 255, 0.1);
        color: #007aff;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 8px;
        border: 0.5px solid rgba(0, 122, 255, 0.2);
      }
    }

    .model-status {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #007aff;
      font-size: 13px;
      font-weight: 600;
      
      svg {
        width: 14px;
        height: 14px;
      }
    }

    .modal-footer {
      padding: 16px 24px 24px;
      border-top: 0.5px solid rgba(0, 0, 0, 0.1);
      background: rgba(248, 248, 248, 0.8);
      
      .footer-info {
        text-align: center;
        
        p {
          margin: 0;
          color: #6e6e73;
          font-size: 13px;
          line-height: 1.4;
        }
      }
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(50px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .model-selector-modal {
        background: #2c2c2e;
      }
      
      .modal-header {
        background: rgba(44, 44, 46, 0.8);
        border-bottom-color: rgba(255, 255, 255, 0.1);
        
        h3 {
          color: #ffffff;
        }
        
        .close-button {
          background: rgba(255, 255, 255, 0.1);
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          
          svg {
            color: #ffffff;
          }
        }
      }
      
      .modal-footer {
        background: rgba(44, 44, 46, 0.8);
        border-top-color: rgba(255, 255, 255, 0.1);
      }
      
      .model-card {
        background: #3a3a3c;
        border-color: rgba(255, 255, 255, 0.1);
        
        &:hover {
          border-color: #007aff;
          background: rgba(58, 58, 60, 0.8);
        }
        
        &.active {
          background: linear-gradient(135deg, rgba(0, 122, 255, 0.15), rgba(88, 86, 214, 0.15));
        }
        
        .model-title h4 {
          color: #ffffff;
        }
        
        .model-parameters {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
      }
      
      .model-description {
        color: #8e8e93;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .model-selector-modal {
        width: 95%;
        max-height: 95vh;
      }
      
      .models-grid {
        grid-template-columns: 1fr;
      }
      
      .model-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class ModelSelectorComponent implements OnInit {
    availableModels: GeminiModel[] = [];
    currentModel: GeminiModel = {} as GeminiModel;

    constructor(private geminiService: GeminiService) { }

    ngOnInit() {
        this.availableModels = this.geminiService.getAvailableModels();
        this.currentModel = this.geminiService.getCurrentModel();
    }

    selectModel(model: GeminiModel) {
        if (model.id === this.currentModel.id) return;

        const success = this.geminiService.switchModel(model.id);
        if (success) {
            this.currentModel = model;
            // Opcional: Emitir evento o mostrar notificación
            this.showNotification(`Modelo cambiado a ${model.name}`);
        } else {
            this.showNotification('Error al cambiar modelo', true);
        }
    }

    closeSelector() {
        // Emitir evento para cerrar el modal
        document.body.dispatchEvent(new CustomEvent('closeModelSelector'));
    }

    private showNotification(message: string, isError: boolean = false) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `model-notification ${isError ? 'error' : 'success'}`;
        notification.textContent = message;
        notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${isError ? '#ff3b30' : '#34c759'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      animation: slideInNotification 0.3s ease-out;
    `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}