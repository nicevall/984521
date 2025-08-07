// src/app/app.component.ts - VERSIÓN FINAL
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { ChatStorageService } from './services/chat-storage.service';
import { ChatState } from './models/chat-state.model';

// Components
import { ChatComponent } from './components/chat/chat.component';
import { ConversationListComponent } from './components/conversation-list/conversation-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ChatComponent,
    ConversationListComponent
  ],
  template: `
    <div class="app-container" [class.sidebar-open]="chatState.sidebarOpen">
      <!-- Sidebar de Conversaciones (Componente Separado) -->
      <app-conversation-list></app-conversation-list>

      <!-- Main Content - Chat -->
      <main class="main-content">
        <app-chat></app-chat>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      background: linear-gradient(180deg, #f5f5f7 0%, #fafafa 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      
      @media (max-width: 768px) {
        width: 100%;
      }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .app-container {
        &.sidebar-open {
          .main-content {
            pointer-events: none;
          }
        }
      }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .app-container {
        background: linear-gradient(180deg, #1c1c1e 0%, #000000 100%);
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
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

    // Inicializar tema
    this.initializeTheme();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Theme management
  private initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }
}