// src/app/components/message/message.component.ts - FORMATO MEJORADO
import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/message.model';
import { TypewriterComponent } from '../typewriter/typewriter.component';
import { HtmlTypewriterComponent } from '../html-typewriter/html-typewriter.component';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, TypewriterComponent, HtmlTypewriterComponent],
  template: `
    <div class="message-container" [class.user-message]="message.isUser" [class.ai-message]="!message.isUser">
      <div class="message-bubble" [class.user-bubble]="message.isUser" [class.ai-bubble]="!message.isUser">
        
        <!-- Avatar para AI -->
        <div *ngIf="!message.isUser" class="message-avatar">
          <div class="ai-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
            </svg>
          </div>
        </div>

        <!-- Contenido del mensaje -->
        <div class="message-content">
          
          <!-- Archivos adjuntos -->
          <div *ngIf="message.attachments && message.attachments.length > 0" class="message-attachments">
            <div *ngFor="let attachment of message.attachments" class="attachment-item">
              <img *ngIf="isImage(attachment.type)" 
                   [src]="attachment.url || attachment.base64" 
                   [alt]="attachment.name"
                   class="attachment-image">
              <div *ngIf="!isImage(attachment.type)" class="attachment-file">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
                <span>{{ attachment.name }}</span>
              </div>
            </div>
          </div>

          <!-- Texto del mensaje con formato mejorado -->
          <div class="message-text">
            <!-- Usar HTML typewriter para mensajes de IA nuevos (con formato) -->
            <app-html-typewriter 
              *ngIf="shouldUseTypewriter"
              [html]="formattedContent"
              [speed]="typewriterSpeed"
              [startDelay]="typewriterDelay">
            </app-html-typewriter>
            
            <!-- Mostrar contenido formateado para mensajes de usuario o IA antiguos -->
            <div *ngIf="!shouldUseTypewriter" [innerHTML]="formattedContent"></div>
          </div>

          <!-- Error indicator -->
          <div *ngIf="message.hasError" class="error-indicator">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>Error al enviar mensaje</span>
          </div>
        </div>

        <!-- Avatar para Usuario -->
        <div *ngIf="message.isUser" class="message-avatar">
          <div class="user-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Metadatos del mensaje -->
      <div class="message-meta">
        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        
        <!-- Acciones del mensaje -->
        <div class="message-actions" *ngIf="!message.isUser">
          <button class="action-button" 
                  (click)="copyToClipboard(message.content)"
                  title="Copiar mensaje">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          
          <button class="action-button" 
                  (click)="regenerateResponse()"
                  title="Regenerar respuesta">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .message-container {
      margin: var(--spacing-md) 0;
      animation: fadeInUp 0.3s ease-out;
    }

    .message-bubble {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-sm);
      max-width: 85%;
    }

    .user-message {
      display: flex;
      justify-content: flex-end;
      
      .message-bubble {
        flex-direction: row-reverse;
        margin-left: auto;
      }
    }

    .ai-message {
      display: flex;
      justify-content: flex-start;
      
      .message-bubble {
        margin-right: auto;
      }
    }

    .message-avatar {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      margin-top: var(--spacing-xs);
    }

    .ai-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--apple-blue), var(--apple-purple));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: var(--chat-bubble-shadow);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--fill-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--label-secondary);
    }

    .message-content {
      flex: 1;
      min-width: 0;
    }

    .user-bubble .message-content {
      background: var(--message-user-bg);
      color: var(--message-user-text);
      border-radius: 18px 18px 4px 18px;
      padding: var(--spacing-sm) var(--spacing-md);
      box-shadow: var(--chat-bubble-shadow);
    }

    .ai-bubble .message-content {
      background: var(--message-ai-bg);
      color: var(--message-ai-text);
      border-radius: 18px 18px 18px 4px;
      padding: var(--spacing-sm) var(--spacing-md);
      box-shadow: var(--chat-bubble-shadow);
      border: 1px solid var(--separator-non-opaque);
    }

    .message-text {
      line-height: 1.5;
      word-wrap: break-word;
      
      /* Estilos para elementos formateados */
      :global(p) {
        margin: 0 0 8px 0;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
      
      :global(strong) {
        font-weight: 700;
      }
      
      :global(em) {
        font-style: italic;
      }
      
      :global(code) {
        background: rgba(0, 0, 0, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: var(--font-family-mono);
        font-size: 0.9em;
        color: #d63384;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }
      
      :global(pre) {
        background: rgba(0, 0, 0, 0.05);
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 8px 0;
        border: 1px solid rgba(0, 0, 0, 0.1);
        
        :global(code) {
          background: none;
          padding: 0;
          border: none;
          color: inherit;
          font-size: 0.9em;
        }
      }
      
      :global(ul), :global(ol) {
        margin: 8px 0;
        padding-left: 20px;
      }
      
      :global(li) {
        margin: 4px 0;
      }
      
      :global(blockquote) {
        border-left: 3px solid var(--apple-blue);
        padding-left: 12px;
        margin: 8px 0;
        font-style: italic;
        opacity: 0.8;
      }
      
      :global(h1), :global(h2), :global(h3), :global(h4), :global(h5), :global(h6) {
        margin: 12px 0 8px 0;
        font-weight: 700;
        
        &:first-child {
          margin-top: 0;
        }
      }
      
      :global(a) {
        color: var(--apple-blue);
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
      
      :global(table) {
        border-collapse: collapse;
        width: 100%;
        margin: 8px 0;
        font-size: 0.9em;
      }
      
      :global(th), :global(td) {
        border: 1px solid rgba(0, 0, 0, 0.1);
        padding: 6px 8px;
        text-align: left;
      }
      
      :global(th) {
        background: rgba(0, 0, 0, 0.05);
        font-weight: 600;
      }
    }

    .message-attachments {
      margin-bottom: var(--spacing-sm);
    }

    .attachment-item {
      margin-bottom: var(--spacing-xs);
    }

    .attachment-image {
      max-width: 200px;
      max-height: 200px;
      border-radius: var(--border-radius-md);
      object-fit: cover;
    }

    .attachment-file {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs);
      background: rgba(0, 0, 0, 0.05);
      border-radius: var(--border-radius-sm);
      font-size: 14px;
    }

    .error-indicator {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      margin-top: var(--spacing-xs);
      color: var(--apple-red);
      font-size: 14px;
    }

    .message-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: var(--spacing-xs);
      padding: 0 var(--spacing-md);
      opacity: 0;
      transition: opacity var(--transition-fast);
    }

    .message-container:hover .message-meta {
      opacity: 1;
    }

    .message-time {
      font-size: 12px;
      color: var(--label-tertiary);
    }

    .message-actions {
      display: flex;
      gap: var(--spacing-xs);
    }

    .action-button {
      background: none;
      border: none;
      color: var(--label-tertiary);
      cursor: pointer;
      padding: var(--spacing-xs);
      border-radius: var(--border-radius-sm);
      transition: all var(--transition-fast);
      
      &:hover {
        background: var(--fill-tertiary);
        color: var(--label-secondary);
      }
    }

    .user-message .message-meta {
      flex-direction: row-reverse;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Dark mode para código y elementos formateados */
    @media (prefers-color-scheme: dark) {
      .message-text {
        :global(code) {
          background: rgba(255, 255, 255, 0.15);
          color: #ff9d6e;
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        :global(pre) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        :global(th), :global(td) {
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        :global(th) {
          background: rgba(255, 255, 255, 0.1);
        }
        
        :global(blockquote) {
          border-left-color: #64b5f6;
        }
      }
    }

    @media (max-width: 768px) {
      .message-bubble {
        max-width: 95%;
      }
      
      .attachment-image {
        max-width: 150px;
        max-height: 150px;
      }
      
      .message-text {
        font-size: 15px;
      }
    }
  `]
})
export class MessageComponent implements OnInit {
  @Input() message!: Message;
  @Input() useTypewriter: boolean = true;
  @Input() typewriterSpeed: number = 30;
  @Input() typewriterDelay: number = 300;

  @Output() copyMessage = new EventEmitter<string>();
  @Output() regenerateMessageEvent = new EventEmitter<Message>();

  shouldUseTypewriter: boolean = false;
  formattedContent: string = '';

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    // Formatear contenido al inicializar
    this.updateFormattedContent();
    
    // Solo usar typewriter para mensajes nuevos de AI
    this.shouldUseTypewriter = this.useTypewriter &&
      !this.message.isUser &&
      this.isRecentMessage();

    console.log('MessageComponent - shouldUseTypewriter:', this.shouldUseTypewriter, 'isUser:', this.message.isUser, 'isRecent:', this.isRecentMessage());
  }

  private isRecentMessage(): boolean {
    const now = new Date().getTime();
    const messageTime = new Date(this.message.timestamp).getTime();
    const timeDiff = now - messageTime;

    // Considerar "reciente" si es menor a 10 segundos (más generoso)
    return timeDiff < 10000;
  }

  private updateFormattedContent(): void {
    this.formattedContent = this.formatMessage(this.message.content);
  }


  formatMessage(content: string): string {
    // Formateo mejorado específico para el formato de IA
    let formatted = content.trim();

    // PASO 1: Limpiar formato problemático de asteriscos sueltos
    // Remover asteriscos que no están en pares (markdown malformado)
    formatted = formatted.replace(/(?<!\*)\*(?!\*)/g, '');
    
    // PASO 2: Dividir en bloques lógicos por párrafos dobles
    const paragraphs = formatted.split(/\n\s*\n/);
    
    const formattedParagraphs = paragraphs.map(paragraph => {
      let p = paragraph.trim();
      if (!p) return '';

      // PASO 3: Detectar y formatear listas correctamente
      // Buscar líneas que empiecen con "- " o "* " para listas
      const lines = p.split('\n');
      const isListBlock = lines.some(line => line.trim().match(/^[-*•]\s+/));
      
      if (isListBlock) {
        // Procesar como lista
        const listItems = lines
          .map(line => line.trim())
          .filter(line => line)
          .map(line => {
            // Convertir "- texto" o "* texto" a item de lista
            if (line.match(/^[-*•]\s+/)) {
              const content = line.replace(/^[-*•]\s+/, '').trim();
              return `<li>${this.formatInlineElements(content)}</li>`;
            }
            // Si no es item de lista, agregarlo como texto normal
            return line;
          })
          .filter(line => line.startsWith('<li>'))
          .join('');
        
        return listItems ? `<ul>${listItems}</ul>` : '';
      }
      
      // PASO 4: Formatear párrafos normales
      p = this.formatInlineElements(p);
      return `<p>${p}</p>`;
    }).filter(p => p);

    // PASO 5: Unir todo y hacer limpieza final
    formatted = formattedParagraphs.join('');
    
    // Limpiar elementos vacíos y espacios extra
    formatted = formatted
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/<ul>\s*<\/ul>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return formatted;
  }

  private formatInlineElements(text: string): string {
    return text
      // Texto en negrita (**texto**)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      
      // Texto en cursiva (*texto*)
      .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
      .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em>$1</em>')
      
      // Código inline
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      
      // Enlaces
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      
      // URLs automáticas
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      
      // Saltos de línea simples
      .replace(/\n/g, '<br>');
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  formatTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  async copyToClipboard(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      this.copyMessage.emit('Mensaje copiado al portapapeles');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.copyMessage.emit('Error al copiar el mensaje');
    }
  }

  regenerateResponse() {
    this.regenerateMessageEvent.emit(this.message);
  }
}