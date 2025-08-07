// src/app/components/conversation-list/conversation-list.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { ChatStorageService } from '../../services/chat-storage.service';
import { ChatState } from '../../models/chat-state.model';
import { ConversationSummary } from '../../models/conversation.model';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar-overlay" 
         [class.visible]="chatState.sidebarOpen"
         (click)="closeSidebar()">
    </div>

    <aside class="sidebar apple-sidebar" [class.open]="chatState.sidebarOpen">
      <div class="sidebar-header">
        <h2 class="text-title-3">Conversaciones</h2>
        <button 
          class="close-sidebar apple-button icon-only secondary"
          (click)="closeSidebar()"
          title="Cerrar sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="sidebar-content apple-scrollbar">
        <!-- New Chat Button -->
        <button 
          class="new-chat-button apple-button primary"
          (click)="startNewChat()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nueva conversación
        </button>

        <!-- Conversations List -->
        <div class="conversations-list">
          <div 
            class="conversation-item"
            *ngFor="let conversation of chatState.conversations; trackBy: trackByConversationId"
            [class.active]="isActiveConversation(conversation.id)"
            (click)="loadConversation(conversation.id)">
            
            <div class="conversation-info">
              <!-- MOSTRAR SIEMPRE TÍTULO Y PREVIEW -->
              <h4 class="conversation-title">{{ conversation.title }}</h4>
              <p class="conversation-preview">{{ conversation.lastMessage }}</p>
              <div class="conversation-meta">
                <span class="conversation-time">{{ formatTime(conversation.updatedAt) }}</span>
                <span class="conversation-count">{{ conversation.messageCount }} mensajes</span>
              </div>
            </div>

            <div class="conversation-actions">
              <button 
                class="action-button"
                (click)="deleteConversation($event, conversation.id)"
                title="Eliminar conversación">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Empty state -->
          <div class="empty-conversations" *ngIf="chatState.conversations.length === 0">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </div>
            <p class="text-body">No hay conversaciones aún</p>
            <p class="text-caption-1">Inicia una nueva conversación para comenzar</p>
          </div>
        </div>
      </div>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <div class="settings-section">
          <button 
            class="settings-button apple-button secondary"
            (click)="openSettings()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Configuración
          </button>

          <button 
            class="export-button apple-button secondary"
            (click)="exportConversations()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar
          </button>
        </div>

        <div class="app-info">
          <div class="app-branding">
            <div class="app-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
              </svg>
            </div>
            <span class="app-title">Chatbot v1.0</span>
          </div>
          <p class="powered-by">Powered by Gemini AI</p>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    /* Sidebar Overlay para móvil */
    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 150;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      
      &.visible {
        opacity: 1;
        pointer-events: auto;
      }
      
      @media (min-width: 769px) {
        display: none;
      }
    }

    /* Sidebar Principal */
    .sidebar {
      width: 280px;
      display: flex;
      flex-direction: column;
      background: rgba(242, 242, 247, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-right: 0.5px solid rgba(0, 0, 0, 0.1);
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 200;
      transform: translateX(-100%);
      transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
      
      &.open {
        transform: translateX(0);
      }
      
      @media (min-width: 769px) {
        position: relative;
        transform: none;
        
        &.open {
          transform: none;
        }
      }
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: rgba(255, 255, 255, 0.6);
      border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
      
      h2 {
        margin: 0;
        color: #1d1d1f;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      
      .close-sidebar {
        width: 28px;
        height: 28px;
        border-radius: 6px;
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
          width: 14px;
          height: 14px;
          color: #333;
        }
        
        @media (min-width: 769px) {
          display: none;
        }
      }
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      
      &::-webkit-scrollbar {
        width: 0;
      }
    }

    .new-chat-button {
      width: 100%;
      justify-content: center;
      gap: 8px;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #007aff;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
      
      &:hover {
        background: #0056d6;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      svg {
        width: 16px;
        height: 16px;
      }
    }

    .conversations-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .conversation-item {
      display: flex;
      align-items: flex-start;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      background: transparent;
      position: relative;
      
      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      
      &.active {
        background: #007aff;
        color: white;
        box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
        
        .conversation-title,
        .conversation-preview,
        .conversation-time,
        .conversation-count {
          color: white;
        }
        
        .conversation-actions .action-button {
          color: rgba(255, 255, 255, 0.8);
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
            color: white;
          }
        }
      }
    }

    .conversation-info {
      flex: 1;
      min-width: 0;
      text-align: left;
      
      .conversation-title {
        font-size: 15px;
        font-weight: 600;
        margin: 0 0 6px 0;
        color: #1d1d1f;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.2;
      }
      
      .conversation-preview {
        font-size: 13px;
        margin: 0 0 8px 0;
        color: #6e6e73;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.3;
        max-height: 16px;
      }
      
      .conversation-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      
      .conversation-time {
        font-size: 11px;
        color: #8e8e93;
        font-weight: 500;
      }
      
      .conversation-count {
        font-size: 10px;
        color: #c7c7cc;
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 8px;
        font-weight: 500;
      }
    }

    .conversation-actions {
      opacity: 0;
      transition: opacity 0.2s ease;
      margin-left: 8px;
      
      .conversation-item:hover & {
        opacity: 1;
      }
      
      .conversation-item.active & {
        opacity: 1;
      }
      
      .action-button {
        background: none;
        border: none;
        color: #8e8e93;
        cursor: pointer;
        padding: 6px;
        border-radius: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover {
          background: rgba(255, 59, 48, 0.1);
          color: #ff3b30;
        }
        
        svg {
          width: 14px;
          height: 14px;
        }
      }
    }

    .empty-conversations {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 16px;
      color: #8e8e93;
      
      .empty-icon {
        margin-bottom: 16px;
        opacity: 0.6;
        
        svg {
          color: #c7c7cc;
        }
      }
      
      p {
        margin: 4px 0;
        
        &:first-of-type {
          font-size: 16px;
          font-weight: 500;
          color: #6e6e73;
        }
        
        &:last-of-type {
          font-size: 13px;
          color: #8e8e93;
        }
      }
    }

    .sidebar-footer {
      border-top: 0.5px solid rgba(0, 0, 0, 0.1);
      padding: 16px;
      background: rgba(255, 255, 255, 0.6);
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
      
      button {
        justify-content: flex-start;
        gap: 10px;
        font-size: 14px;
        font-weight: 500;
        padding: 10px 12px;
        background: rgba(0, 0, 0, 0.05);
        color: #1d1d1f;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        
        svg {
          width: 16px;
          height: 16px;
          color: #6e6e73;
        }
      }
    }

    .app-info {
      text-align: center;
      padding-top: 12px;
      border-top: 0.5px solid rgba(0, 0, 0, 0.05);
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .sidebar {
        background: rgba(28, 28, 30, 0.8);
        border-right-color: rgba(255, 255, 255, 0.1);
      }
      
      .sidebar-header {
        background: rgba(44, 44, 46, 0.6);
        border-bottom-color: rgba(255, 255, 255, 0.1);
        
        h2 {
          color: #ffffff;
        }
        
        .close-sidebar {
          background: rgba(255, 255, 255, 0.1);
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          
          svg {
            color: #ffffff;
          }
        }
      }
      
      .sidebar-footer {
        background: rgba(44, 44, 46, 0.6);
        border-top-color: rgba(255, 255, 255, 0.1);
      }
      
      .conversation-item {
        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }
      }
      
      .conversation-title {
        color: #ffffff;
      }
      
      .conversation-preview {
        color: #8e8e93;
      }
      
      .conversation-time {
        color: #6e6e73;
      }
      
      .conversation-count {
        background: rgba(255, 255, 255, 0.1);
        color: #8e8e93;
      }
      
      .settings-section button {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        
        &:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        svg {
          color: #8e8e93;
        }
      }
      
      .empty-conversations {
        .empty-icon svg {
          color: #48484a;
        }
        
        p:first-of-type {
          color: #8e8e93;
        }
        
        p:last-of-type {
          color: #6e6e73;
        }
      }
      
      .sidebar-overlay {
        background: rgba(0, 0, 0, 0.6);
      }
    }
  `]
})
export class ConversationListComponent implements OnInit, OnDestroy {
  chatState: ChatState = {
    currentConversation: null,
    conversations: [],
    isLoading: false,
    isTyping: false,
    error: null,
    sidebarOpen: false
  };

  private destroy$ = new Subject<void>();

  constructor(private chatStorage: ChatStorageService) { }

  ngOnInit() {
    // Subscribe to chat state changes
    this.chatStorage.chatState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.chatState = state;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // LISTENER MEJORADO para cerrar sidebar al hacer clic fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const sidebarElement = document.querySelector('.sidebar');
    const toggleButton = document.querySelector('.sidebar-toggle');

    // Si el sidebar está abierto y se hace clic fuera
    if (this.chatState.sidebarOpen &&
      sidebarElement &&
      !sidebarElement.contains(target) &&
      !toggleButton?.contains(target)) {
      this.closeSidebar();
    }
  }

  // Sidebar management
  closeSidebar() {
    this.chatStorage.setSidebarOpen(false);
  }

  // Conversation management  
  startNewChat() {
    this.chatStorage.clearCurrentConversation();
    this.closeSidebar(); // Close sidebar on mobile after action
  }

  loadConversation(conversationId: string) {
    const conversation = this.chatStorage.loadConversation(conversationId);
    if (conversation) {
      this.chatStorage.setCurrentConversation(conversation);
      this.closeSidebar(); // Close sidebar on mobile after loading conversation
    }
  }

  deleteConversation(event: Event, conversationId: string) {
    event.stopPropagation(); // Prevent conversation selection

    if (confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      this.chatStorage.deleteConversation(conversationId);
    }
  }

  isActiveConversation(conversationId: string): boolean {
    return this.chatState.currentConversation?.id === conversationId;
  }

  trackByConversationId(index: number, conversation: ConversationSummary): string {
    return conversation.id;
  }

  // Settings and export
  openSettings() {
    alert('Configuración próximamente disponible');
  }

  exportConversations() {
    try {
      const data = this.chatStorage.exportConversations();
      const blob = new Blob([data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `chatbot-conversations-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting conversations:', error);
      alert('Error al exportar conversaciones');
    }
  }

  // Utility methods
  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return 'Ahora';
    } else if (minutes < 60) {
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else if (days < 7) {
      return `${days}d`;
    } else {
      return date.toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric'
      });
    }
  }
}