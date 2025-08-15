import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackendChatService } from '../../services/backend-chat.service';
import { CarreraOption } from '../../models/backend-response.model';

@Component({
  selector: 'app-career-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="career-selector-overlay" (click)="closeSelector()">
      <div class="career-selector-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="text-title-3">Seleccionar Carrera</h3>
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
          <div class="current-career-info">
            <div class="current-label">Carrera Actual:</div>
            <div class="current-career">
              <div class="career-name">{{ getCurrentCareerName() }}</div>
              <div class="career-code">{{ currentCarrera }}</div>
            </div>
          </div>

          <div class="careers-grid">
            <div 
              *ngFor="let carrera of availableCarreras"
              class="career-card"
              [class.active]="carrera.code === currentCarrera"
              (click)="selectCarrera(carrera)">
              
              <div class="career-header">
                <div class="career-title">
                  <h4>{{ carrera.name }}</h4>
                </div>
                <div class="career-badge">{{ carrera.code }}</div>
              </div>

              <div class="career-status" *ngIf="carrera.code === currentCarrera">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
                Seleccionada
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-info">
            <p class="text-caption-1">
              Selecciona tu carrera para obtener recomendaciones de libros y contenido académico específico.
              El asistente adaptará sus respuestas según tu área de estudio.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .career-selector-overlay {
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

    .career-selector-modal {
      background: #ffffff;
      border-radius: 20px;
      width: 90%;
      max-width: 700px;
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

    .current-career-info {
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
      
      .current-career {
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        .career-name {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        
        .career-code {
          font-size: 14px;
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
        }
      }
    }

    .careers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .career-card {
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
    }

    .career-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
      
      .career-title {
        flex: 1;
        
        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1d1d1f;
          letter-spacing: -0.01em;
          line-height: 1.3;
        }
      }
      
      .career-badge {
        background: rgba(0, 0, 0, 0.06);
        color: #1d1d1f;
        font-size: 12px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 12px;
        white-space: nowrap;
        margin-left: 12px;
      }
    }

    .career-status {
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
      .career-selector-modal {
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
      
      .career-card {
        background: #3a3a3c;
        border-color: rgba(255, 255, 255, 0.1);
        
        &:hover {
          border-color: #007aff;
          background: rgba(58, 58, 60, 0.8);
        }
        
        &.active {
          background: linear-gradient(135deg, rgba(0, 122, 255, 0.15), rgba(88, 86, 214, 0.15));
        }
        
        .career-title h4 {
          color: #ffffff;
        }
        
        .career-badge {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .career-selector-modal {
        width: 95%;
        max-height: 95vh;
      }
      
      .careers-grid {
        grid-template-columns: 1fr;
      }
      
      .career-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .career-badge {
        margin-left: 0 !important;
      }
    }
  `]
})
export class CareerSelectorComponent implements OnInit {
  availableCarreras: CarreraOption[] = [
    { code: 'ADMINISTRACION', name: 'Administración de Empresas' },
    { code: 'MARKETING', name: 'Marketing' },
    { code: 'NEGOCIOS_INTERNACIONALES', name: 'Negocios Internacionales' },
    { code: 'SISTEMAS', name: 'Ingeniería en Sistemas' },
    { code: 'PSICOLOGIA', name: 'Psicología' },
    { code: 'ARQUITECTURA', name: 'Arquitectura' },
    { code: 'DERECHO', name: 'Derecho' }
  ];
  
  currentCarrera: string = 'SISTEMAS';

  constructor(private backendChatService: BackendChatService) { }

  ngOnInit() {
    this.currentCarrera = this.backendChatService.getCurrentCarrera();
    
    // Try to load available careers from backend
    this.backendChatService.getAvailableCarreras().subscribe({
      next: (response) => {
        if (response.success && response.carreras) {
          this.availableCarreras = response.carreras;
        }
      },
      error: (error) => {
        console.warn('Could not load careers from backend, using default list:', error);
      }
    });
  }

  selectCarrera(carrera: CarreraOption) {
    if (carrera.code === this.currentCarrera) return;

    this.currentCarrera = carrera.code;
    this.backendChatService.setCarrera(carrera.code);
    
    this.showNotification(`Carrera cambiada a ${carrera.name}`);
    
    // Close the modal after a short delay
    setTimeout(() => {
      this.closeSelector();
    }, 1000);
  }

  getCurrentCareerName(): string {
    const career = this.availableCarreras.find(c => c.code === this.currentCarrera);
    return career ? career.name : this.currentCarrera;
  }

  closeSelector() {
    document.body.dispatchEvent(new CustomEvent('closeCareerSelector'));
  }

  private showNotification(message: string, isError: boolean = false) {
    const notification = document.createElement('div');
    notification.className = `career-notification ${isError ? 'error' : 'success'}`;
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