// src/app/app.component.ts - VERSIÓN FINAL
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { ChatStorageService } from './services/chat-storage.service';
import { ChatState } from './models/chat-state.model';

// Components
import { ChatComponent } from './components/chat/chat.component';
import { ConversationListComponent } from './components/conversation-list/conversation-list.component';
import { BookSearchComponent } from './components/book-search/book-search.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ChatComponent,
    ConversationListComponent,
    BookSearchComponent,
    AdminDashboardComponent
  ],
  template: `
    <div class="app-container">
      <!-- Navigation Header -->
      <nav class="top-navigation">
        <div class="nav-brand">
          <h1>Biblioteca UIDE - Asistente IA</h1>
        </div>
        <div class="nav-tabs">
          <button 
            class="nav-tab" 
            [class.active]="currentView === 'chat'"
            (click)="setCurrentView('chat')"
          >
            Chat IA
          </button>
          <button 
            class="nav-tab" 
            [class.active]="currentView === 'search'"
            (click)="setCurrentView('search')"
          >
            Buscar Libros
          </button>
          <button 
            class="nav-tab" 
            [class.active]="currentView === 'admin'"
            (click)="setCurrentView('admin')"
          >
            Admin Panel
          </button>
        </div>
      </nav>

      <!-- Content Container -->
      <div class="content-container" [class.sidebar-open]="chatState.sidebarOpen">
        <!-- Sidebar de Conversaciones (Solo visible en chat) -->
        <app-conversation-list *ngIf="currentView === 'chat'"></app-conversation-list>

        <!-- Main Content -->
        <main class="main-content" [class.full-width]="currentView !== 'chat'">
          <!-- Chat View -->
          <app-chat *ngIf="currentView === 'chat'"></app-chat>
          
          <!-- Book Search View -->
          <div class="view-container" *ngIf="currentView === 'search'">
            <app-book-search (reservationMade)="onReservationMade($event)"></app-book-search>
          </div>
          
          <!-- Admin Dashboard View -->
          <div class="view-container" *ngIf="currentView === 'admin'">
            <app-admin-dashboard></app-admin-dashboard>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: linear-gradient(180deg, #f5f5f7 0%, #fafafa 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
    }

    /* Navigation */
    .top-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 100;
    }

    .nav-brand h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .nav-tabs {
      display: flex;
      gap: 5px;
    }

    .nav-tab {
      background: none;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      transition: all 0.3s;
    }

    .nav-tab:hover {
      background: #f0f0f0;
      color: #333;
    }

    .nav-tab.active {
      background: #007bff;
      color: white;
    }

    /* Content Container */
    .content-container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .main-content.full-width {
      width: 100%;
    }

    .view-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .nav-brand h1 {
        font-size: 16px;
      }
      
      .nav-tabs {
        gap: 2px;
      }
      
      .nav-tab {
        padding: 6px 12px;
        font-size: 13px;
      }
      
      .view-container {
        padding: 15px;
      }
      
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
      
      .top-navigation {
        background: #2c2c2e;
        border-bottom-color: #3c3c3e;
      }
      
      .nav-brand h1 {
        color: #f2f2f7;
      }
      
      .nav-tab {
        color: #98989d;
      }
      
      .nav-tab:hover {
        background: #3c3c3e;
        color: #f2f2f7;
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

  currentView: 'chat' | 'search' | 'admin' = 'chat';
  sidebarCollapsed: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(private chatStorage: ChatStorageService) { 
    // Cargar estado colapsado inicial
    this.sidebarCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    this.updateSidebarWidth();
  }

  ngOnInit() {
    // Subscribe to chat state changes
    this.chatStorage.chatState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.chatState = state;
      });

    // Escuchar cambios en el estado colapsado de la sidebar
    window.addEventListener('storage', this.onStorageChange.bind(this));

    // Inicializar tema
    this.initializeTheme();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('storage', this.onStorageChange.bind(this));
  }

  setCurrentView(view: 'chat' | 'search' | 'admin') {
    this.currentView = view;
    
    // Close sidebar when not in chat view
    if (view !== 'chat' && this.chatState.sidebarOpen) {
      this.chatStorage.toggleSidebar();
    }
  }

  onReservationMade(result: any) {
    // Handle reservation notification
    if (result.success) {
      // Could show a global notification or update some state
      console.log('Reservation made:', result);
    }
  }

  // Sidebar width management
  private onStorageChange(event: StorageEvent) {
    if (event.key === 'sidebar-collapsed') {
      this.sidebarCollapsed = event.newValue === 'true';
      this.updateSidebarWidth();
    }
  }

  private updateSidebarWidth() {
    const width = this.sidebarCollapsed ? '70px' : '280px';
    document.documentElement.style.setProperty('--sidebar-width', width);
  }

  // Theme management
  private initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }
}