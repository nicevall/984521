// src/app/components/chat/chat.component.ts - CON BOTÓN STOP
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { GeminiService, GeminiResponse } from '../../services/gemini.service';
import { ChatStorageService } from '../../services/chat-storage.service';
import { FileService } from '../../services/file.service';
import { GeminiInfoService } from '../../services/gemini-info.service';
import { Message } from '../../models/message.model';
import { ChatState } from '../../models/chat-state.model';
import { FileAttachment } from '../../models/file-upload.model';

// Components
import { MessageComponent } from '../message/message.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { SystemInfoComponent } from '../system-info/system-info.component';
import { ModelSelectorComponent } from '../model-selector/model-selector.component';

// Directives
import { AutoResizeDirective } from '../../directives/auto-resize.directive';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MessageComponent,
    TypingIndicatorComponent,
    FileUploadComponent,
    SystemInfoComponent,
    ModelSelectorComponent,
    AutoResizeDirective,
    ClickOutsideDirective
  ],
  template: `
    <div class="chat-container">
      <!-- Header -->
      <header class="chat-header glass-effect">
        <div class="header-content">
          <button 
            class="sidebar-toggle apple-button icon-only secondary"
            (click)="onToggleSidebar()"
            title="Toggle sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div class="header-title">
            <h1 class="text-title-3">{{ getConversationTitle() }}</h1>
            <p class="text-caption-1" *ngIf="chatState.isTyping">AI está escribiendo...</p>
            
            <div class="current-model-indicator" (click)="toggleModelSelector()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
              </svg>
              <span>{{ getCurrentModelName() }}</span>
              <span class="model-params">{{ getCurrentModelParams() }}</span>
            </div>
          </div>

          <div class="header-actions">
            <button 
              class="apple-button icon-only secondary model-selector-btn"
              (click)="toggleModelSelector()"
              title="Cambiar modelo AI">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
              </svg>
            </button>

            <button 
              class="apple-button icon-only secondary"
              (click)="startNewConversation()"
              title="Nueva conversación">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>

            <button 
              class="apple-button icon-only secondary"
              (click)="clearConversation()"
              [disabled]="!hasMessages()"
              title="Limpiar conversación">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>

            <button 
              class="apple-button icon-only secondary"
              (click)="toggleSystemInfo()"
              title="Información del sistema">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Chat Messages -->
      <main class="chat-messages apple-scrollbar" #messagesContainer>
        <div class="messages-content">
          <!-- Welcome message when no conversation -->
          <div class="welcome-message" *ngIf="!hasMessages() && !chatState.isTyping">
            <div class="welcome-content">
              <div class="welcome-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                </svg>
              </div>
              <h2 class="text-title-2">¡Hola! Soy tu asistente AI</h2>
              <p class="text-body">
                Puedo ayudarte con preguntas, análisis de imágenes, escritura de código y mucho más. 
                ¿En qué puedo ayudarte hoy?
              </p>
              
              <div class="current-model-info">
                <div class="model-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                  </svg>
                  Modelo actual: {{ getCurrentModelName() }} ({{ getCurrentModelParams() }})
                </div>
                <button class="change-model-btn apple-button primary small" (click)="toggleModelSelector()">
                  Cambiar modelo
                </button>
              </div>
              
              <div class="quick-actions">
                <button 
                  class="quick-action apple-button secondary"
                  (click)="sendQuickMessage('Explícame qué es Angular 18')">
                  Explícame Angular 18
                </button>
                <button 
                  class="quick-action apple-button secondary"
                  (click)="sendQuickMessage('¿Cómo funciona TypeScript?')">
                  ¿Cómo funciona TypeScript?
                </button>
                <button 
                  class="quick-action apple-button secondary"
                  (click)="sendQuickMessage('Ayúdame a crear una aplicación web')">
                  Crear una app web
                </button>
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div class="messages-list" *ngIf="hasMessages()">
            <app-message 
              *ngFor="let message of getCurrentMessages(); trackBy: trackByMessageId"
              [message]="message"
              [useTypewriter]="useTypewriter"
              [typewriterSpeed]="25"
              [typewriterDelay]="200"
              (copyMessage)="showNotification($event)"
              (regenerateMessageEvent)="regenerateResponse($event)">
            </app-message>
          </div>

          <app-typing-indicator 
            [isVisible]="chatState.isTyping"
            message="AI está escribiendo...">
          </app-typing-indicator>
        </div>
      </main>

      <!-- Input Area -->
      <footer class="chat-input-area glass-effect">
        <div class="file-upload-section" *ngIf="showFileUpload" 
             appClickOutside (clickOutside)="hideFileUpload()">
          <app-file-upload 
            [disabled]="chatState.isLoading"
            (filesSelected)="onFilesSelected($event)">
          </app-file-upload>
        </div>

        <div class="selected-files" *ngIf="selectedFiles.length > 0">
          <div class="selected-file" *ngFor="let file of selectedFiles; let i = index">
            <div class="file-preview" *ngIf="isImage(file.type)">
              <img [src]="file.url || file.base64" [alt]="file.name">
            </div>
            <div class="file-info" *ngIf="!isImage(file.type)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              <span>{{ file.name }}</span>
            </div>
            <button 
              class="remove-file"
              (click)="removeSelectedFile(i)"
              title="Remover archivo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="input-controls">
          <button 
            class="attach-button apple-button icon-only secondary"
            (click)="toggleFileUpload()"
            [class.active]="showFileUpload"
            title="Adjuntar archivo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
            </svg>
          </button>

          <div class="input-wrapper">
            <textarea
              #messageInput
              [(ngModel)]="currentMessage"
              appAutoResize
              [minHeight]="44"
              [maxHeight]="120"
              class="message-input apple-input"
              placeholder="Escribe tu mensaje..."
              (keydown)="onKeyDown($event)"
              [disabled]="chatState.isLoading"
              rows="1">
            </textarea>

            <!-- BOTÓN STOP/SEND DINÁMICO -->
            <button 
              *ngIf="!isGenerating"
              class="send-button apple-button icon-only primary"
              (click)="sendMessage()"
              [disabled]="!canSendMessage()"
              title="Enviar mensaje">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9 22,2"/>
              </svg>
            </button>

            <button 
              *ngIf="isGenerating"
              class="stop-button apple-button icon-only secondary"
              (click)="stopGeneration()"
              title="Detener generación">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="error-message" *ngIf="chatState.error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>{{ chatState.error }}</span>
          <button (click)="clearError()" class="clear-error">×</button>
        </div>
      </footer>

      <div class="notification-toast" *ngIf="showNotificationMessage" 
           [class.visible]="showNotificationMessage">
        {{ notificationMessage }}
      </div>

      <app-system-info *ngIf="showSystemInfo"></app-system-info>
      <app-model-selector *ngIf="showModelSelector"></app-model-selector>
    </div>
  `,
  styles: [`
    /* CSS optimizado - solo estilos esenciales */
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      margin-left: 280px;
      background: linear-gradient(180deg, #f5f5f7 0%, #fafafa 100%);
      transition: margin-left 0.3s ease;
    }

    @media (max-width: 768px) {
      .chat-container {
        margin-left: 0;
      }
    }

    .chat-header {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 20px;
      position: relative;
    }

    .sidebar-toggle {
      position: absolute;
      left: 20px;
      display: none;
    }

    @media (max-width: 768px) {
      .sidebar-toggle {
        display: flex;
      }
    }

    .header-title {
      text-align: center;
    }

    .current-model-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(0, 122, 255, 0.1);
      color: #007aff;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 4px;
    }

    .model-params {
      background: rgba(0, 122, 255, 0.2);
      padding: 2px 6px;
      border-radius: 8px;
      font-size: 9px;
      font-weight: 700;
    }

    .header-actions {
      position: absolute;
      right: 20px;
      display: flex;
      gap: 8px;
    }

    .model-selector-btn {
      background: linear-gradient(135deg, #007AFF, #5856D6) !important;
      color: white !important;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .messages-content {
      max-width: 680px;
      margin: 0 auto;
    }

    .welcome-message {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
    }

    .welcome-content {
      text-align: center;
      max-width: 480px;
      padding: 40px;
    }

    .welcome-icon {
      margin-bottom: 24px;
    }

    .welcome-icon svg {
      color: #007aff;
      filter: drop-shadow(0 4px 12px rgba(0, 122, 255, 0.3));
    }

    .current-model-info {
      background: rgba(0, 122, 255, 0.05);
      border: 1px solid rgba(0, 122, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      margin: 24px 0;
    }

    .model-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #007aff;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-top: 24px;
    }

    .chat-input-area {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      border-top: 0.5px solid rgba(0, 0, 0, 0.1);
      padding: 16px 20px 20px;
    }

    .file-upload-section {
      margin-bottom: 12px;
      background: #ffffff;
      border-radius: 12px;
      padding: 16px;
      border: 0.5px solid rgba(0, 0, 0, 0.1);
    }

    .selected-files {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .selected-file {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      border-radius: 8px;
      padding: 8px 12px;
      border: 0.5px solid rgba(0, 0, 0, 0.1);
    }

    .file-preview img {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #6e6e73;
    }

    .remove-file {
      background: none;
      border: none;
      color: #8e8e93;
      cursor: pointer;
      padding: 2px;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .remove-file:hover {
      background: #ff3b30;
      color: white;
    }

    .input-controls {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .input-wrapper {
      flex: 1;
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .message-input {
      flex: 1;
      border-radius: 20px;
      padding: 12px 16px;
      resize: none;
      line-height: 1.4;
    }

    .send-button, .stop-button {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
    }

    .send-button {
      background: #007aff;
      
      &:hover {
        background: #0056d6;
        transform: scale(1.05);
      }
      
      &:disabled {
        background: #c7c7cc;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      
      svg {
        width: 18px;
        height: 18px;
        color: white;
      }
    }

    .stop-button {
      background: #ff3b30;
      box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);
      
      &:hover {
        background: #d70015;
        transform: scale(1.05);
      }
      
      svg {
        width: 16px;
        height: 16px;
        color: white;
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 12px 16px;
      background: rgba(255, 59, 48, 0.1);
      border: 0.5px solid #ff3b30;
      border-radius: 12px;
      color: #d70015;
      font-size: 14px;
    }

    .clear-error {
      background: none;
      border: none;
      color: #ff3b30;
      cursor: pointer;
      font-size: 18px;
      padding: 4px;
      margin-left: auto;
    }

    .notification-toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(60px);
      background: rgba(28, 28, 30, 0.9);
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 15px;
      z-index: 1000;
      opacity: 0;
      transition: all 0.3s ease;
    }

    .notification-toast.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    /* Dark mode optimizado */
    @media (prefers-color-scheme: dark) {
      .chat-container {
        background: linear-gradient(180deg, #1c1c1e 0%, #000000 100%);
      }
      
      .chat-header {
        background: rgba(28, 28, 30, 0.8);
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }
      
      .current-model-indicator {
        background: rgba(0, 122, 255, 0.2);
        color: #64b5f6;
      }
      
      .current-model-info {
        background: rgba(0, 122, 255, 0.1);
        border-color: rgba(0, 122, 255, 0.2);
      }
      
      .model-badge {
        color: #64b5f6;
      }
      
      .chat-input-area {
        background: rgba(28, 28, 30, 0.8);
        border-top-color: rgba(255, 255, 255, 0.1);
      }
      
      .file-upload-section, .selected-file {
        background: #2c2c2e;
        border-color: rgba(255, 255, 255, 0.1);
      }
    }

    /* Responsive optimizado */
    @media (max-width: 768px) {
      .header-content {
        padding: 8px 16px;
      }
      
      .chat-messages {
        padding: 16px;
      }
      
      .welcome-content {
        padding: 20px;
      }
      
      .quick-actions {
        grid-template-columns: 1fr;
        gap: 8px;
      }
      
      .current-model-indicator {
        font-size: 10px;
        padding: 3px 6px;
      }
      
      .model-params {
        font-size: 8px;
        padding: 1px 4px;
      }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  currentMessage = '';
  selectedFiles: FileAttachment[] = [];
  showFileUpload = false;
  showSystemInfo = false;
  showModelSelector = false;
  useTypewriter = true;
  isGenerating = false;

  chatState: ChatState = {
    currentConversation: null,
    conversations: [],
    isLoading: false,
    isTyping: false,
    error: null,
    sidebarOpen: false
  };

  showNotificationMessage = false;
  notificationMessage = '';

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  constructor(
    private geminiService: GeminiService,
    private chatStorage: ChatStorageService,
    private fileService: FileService,
    private geminiInfoService: GeminiInfoService
  ) { }

  ngOnInit() {
    this.chatStorage.chatState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.chatState = state;
        this.shouldScrollToBottom = true;
      });

    // Suscribirse al estado de generación
    this.geminiService.isGenerating
      .pipe(takeUntil(this.destroy$))
      .subscribe(generating => {
        this.isGenerating = generating;
      });

    if (!this.geminiService.isConfigured()) {
      this.showError('API key de Gemini no configurada. Por favor, configura tu API key en el archivo environment.development.ts');
    }

    document.body.addEventListener('closeSystemInfo', () => {
      this.showSystemInfo = false;
    });

    document.body.addEventListener('closeModelSelector', () => {
      this.showModelSelector = false;
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // MÉTODO CORREGIDO para toggle sidebar
  onToggleSidebar() {
    console.log('Toggle sidebar clicked');
    this.chatStorage.toggleSidebar();
  }

  toggleModelSelector() {
    this.showModelSelector = !this.showModelSelector;
  }

  getCurrentModelName(): string {
    return this.geminiService.getCurrentModel().name;
  }

  getCurrentModelParams(): string {
    return this.geminiService.getCurrentModel().parameters;
  }

  // MÉTODO PARA DETENER GENERACIÓN
  stopGeneration() {
    this.geminiService.stopGeneration();
    this.chatStorage.setTyping(false);
    this.showNotification('Generación detenida');
  }

  async sendMessage() {
    if (!this.canSendMessage()) return;

    const messageContent = this.currentMessage.trim();
    const attachments = [...this.selectedFiles];

    this.currentMessage = '';
    this.selectedFiles = [];

    const userMessage = this.chatStorage.addMessage({
      content: messageContent,
      isUser: true,
      attachments: attachments.length > 0 ? attachments : undefined
    });

    this.clearError();

    try {
      this.chatStorage.setTyping(true);

      let response: GeminiResponse;

      if (attachments.length > 0 && attachments.some(file => this.isImage(file.type))) {
        const imageFile = this.createFileFromAttachment(attachments.find(file => this.isImage(file.type))!);
        response = await this.geminiService.generateResponseWithImage(messageContent, imageFile).toPromise() || { text: '', success: false };
      } else {
        response = await this.geminiService.sendMessage(messageContent, false).toPromise() || { text: '', success: false };
      }

      if (response.success) {
        this.chatStorage.addMessage({
          content: response.text,
          isUser: false
        });
      } else {
        this.showError(response.error || 'Error al generar respuesta');
        this.chatStorage.updateLastMessage({ hasError: true });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      this.showError('Error de conexión. Por favor, inténtalo de nuevo.');
      this.chatStorage.updateLastMessage({ hasError: true });
    } finally {
      this.chatStorage.setTyping(false);
    }
  }

  sendQuickMessage(message: string) {
    this.currentMessage = message;
    this.sendMessage();
  }

  regenerateResponse(message: Message) {
    const conversation = this.chatState.currentConversation;
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex(m => m.id === message.id);
    if (messageIndex <= 0) return;

    const userMessage = conversation.messages[messageIndex - 1];
    if (!userMessage.isUser) return;

    conversation.messages.splice(messageIndex, 1);
    this.chatStorage.setCurrentConversation(conversation);

    this.currentMessage = userMessage.content;
    if (userMessage.attachments) {
      this.selectedFiles = [...userMessage.attachments];
    }
    this.sendMessage();
  }

  onFilesSelected(files: FileAttachment[]) {
    this.selectedFiles.push(...files);
    this.hideFileUpload();
  }

  removeSelectedFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  toggleFileUpload() {
    this.showFileUpload = !this.showFileUpload;
  }

  hideFileUpload() {
    this.showFileUpload = false;
  }

  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private createFileFromAttachment(attachment: FileAttachment): File {
    const base64Data = attachment.base64 || attachment.url || '';
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: attachment.type });

    return new File([blob], attachment.name, { type: attachment.type });
  }

  startNewConversation() {
    this.chatStorage.clearCurrentConversation();
    this.geminiService.clearChat();
    this.clearInput();
  }

  clearConversation() {
    if (confirm('¿Estás seguro de que quieres limpiar esta conversación?')) {
      this.startNewConversation();
    }
  }

  toggleSystemInfo() {
    this.showSystemInfo = !this.showSystemInfo;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.isGenerating) {
        this.stopGeneration();
      } else {
        this.sendMessage();
      }
    }
  }

  canSendMessage(): boolean {
    return (this.currentMessage.trim().length > 0 || this.selectedFiles.length > 0)
      && !this.chatState.isLoading
      && !this.chatState.isTyping
      && !this.isGenerating;
  }

  clearInput() {
    this.currentMessage = '';
    this.selectedFiles = [];
    this.hideFileUpload();
  }

  hasMessages(): boolean {
    return (this.chatState.currentConversation?.messages?.length ?? 0) > 0;
  }

  getCurrentMessages(): Message[] {
    return this.chatState.currentConversation?.messages || [];
  }

  getConversationTitle(): string {
    return this.chatState.currentConversation?.title || 'Nueva conversación';
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }

  showError(message: string) {
    this.chatStorage.setError(message);
  }

  clearError() {
    this.chatStorage.setError(null);
  }

  showNotification(message: string) {
    this.notificationMessage = message;
    this.showNotificationMessage = true;

    setTimeout(() => {
      this.showNotificationMessage = false;
    }, 3000);
  }

  private scrollToBottom() {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  }
}