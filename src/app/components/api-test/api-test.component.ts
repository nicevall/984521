// src/app/components/api-test/api-test.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModelCheckerService } from '../../services/model-checker.service';
import { GeminiService } from '../../services/gemini.service';

@Component({
    selector: 'app-api-test',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="api-test-container">
      <h2>🔧 Prueba de configuración de Gemini API</h2>
      
      <div class="test-section">
        <h3>1. Estado de la API Key</h3>
        <div class="status" [class.success]="geminiService.isConfigured()" [class.error]="!geminiService.isConfigured()">
          <span>{{ geminiService.isConfigured() ? '✅ API Key configurada' : '❌ API Key no configurada' }}</span>
        </div>
      </div>

      <div class="test-section" *ngIf="geminiService.isConfigured()">
        <h3>2. Modelos disponibles</h3>
        <button (click)="checkModels()" [disabled]="checking" class="test-button">
          {{ checking ? 'Verificando...' : 'Verificar modelos disponibles' }}
        </button>
        
        <div *ngIf="availableModels.length > 0" class="models-list">
          <h4>Modelos encontrados:</h4>
          <ul>
            <li *ngFor="let model of availableModels" class="model-item">
              ✅ {{ model }}
            </li>
          </ul>
        </div>

        <div *ngIf="bestModel" class="best-model">
          <strong>🎯 Mejor modelo recomendado: {{ bestModel }}</strong>
        </div>
      </div>

      <div class="test-section" *ngIf="geminiService.isConfigured()">
        <h3>3. Prueba de mensaje</h3>
        <button (click)="testMessage()" [disabled]="testing" class="test-button">
          {{ testing ? 'Enviando...' : 'Enviar mensaje de prueba' }}
        </button>
        
        <div *ngIf="testResult" class="test-result">
          <h4>Resultado:</h4>
          <div [class.success]="testResult.success" [class.error]="!testResult.success">
            {{ testResult.success ? '✅' : '❌' }} {{ testResult.text }}
          </div>
        </div>
      </div>

      <div class="instructions" *ngIf="!geminiService.isConfigured()">
        <h3>📝 Cómo configurar:</h3>
        <ol>
          <li>Ve a <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
          <li>Crea una nueva API key</li>
          <li>Copia la API key</li>
          <li>Pégala en <code>src/environments/environment.development.ts</code></li>
          <li>Reinicia el servidor de desarrollo</li>
        </ol>
      </div>
    </div>
  `,
    styles: [`
    .api-test-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .test-section {
      margin-bottom: 30px;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
    }

    .status {
      padding: 10px;
      border-radius: 6px;
      font-weight: 500;
    }

    .status.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .status.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .test-button {
      background: #007AFF;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.2s;
    }

    .test-button:hover:not(:disabled) {
      background: #0056b3;
    }

    .test-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .models-list {
      margin-top: 15px;
    }

    .model-item {
      padding: 5px 0;
      font-family: monospace;
    }

    .best-model {
      margin-top: 15px;
      padding: 15px;
      background: #e7f3ff;
      border: 1px solid #b3d7ff;
      border-radius: 6px;
      color: #0066cc;
    }

    .test-result {
      margin-top: 15px;
    }

    .test-result .success {
      color: #155724;
      background: #d4edda;
      padding: 10px;
      border-radius: 6px;
    }

    .test-result .error {
      color: #721c24;
      background: #f8d7da;
      padding: 10px;
      border-radius: 6px;
    }

    .instructions {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      padding: 20px;
      border-radius: 8px;
    }

    .instructions code {
      background: #f8f9fa;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }

    .instructions a {
      color: #007AFF;
      text-decoration: none;
    }

    .instructions a:hover {
      text-decoration: underline;
    }
  `]
})
export class ApiTestComponent {
    availableModels: string[] = [];
    bestModel: string = '';
    checking = false;
    testing = false;
    testResult: any = null;

    constructor(
        private modelChecker: ModelCheckerService,
        public geminiService: GeminiService
    ) { }

    async checkModels() {
        this.checking = true;
        try {
            this.availableModels = await this.modelChecker.checkAvailableModels();
            this.bestModel = await this.modelChecker.findBestModel();
        } catch (error: any) {
            console.error('Error checking models:', error);
            alert('Error verificando modelos: ' + error.message);
        } finally {
            this.checking = false;
        }
    }

    async testMessage() {
        this.testing = true;
        try {
            const response = await this.geminiService.generateResponse('¡Hola! ¿Puedes responder este mensaje de prueba?').toPromise();
            this.testResult = response;
        } catch (error: any) {
            console.error('Error testing message:', error);
            this.testResult = {
                success: false,
                text: 'Error: ' + error.message
            };
        } finally {
            this.testing = false;
        }
    }
}