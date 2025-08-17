// src/app/components/layout/main-layout.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { LayoutService } from '../../services/layout.service';
import { LayoutState, ViewType } from '../../models/layout-state.model';

// Components
import { ChatComponent } from '../chat/chat.component';
import { ConversationListComponent } from '../conversation-list/conversation-list.component';
import { BookSearchComponent } from '../book-search/book-search.component';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    ChatComponent,
    ConversationListComponent,
    BookSearchComponent,
    AdminDashboardComponent
  ],
  template: `
    <div class="layout-container">
      <!-- Navigation Header -->
      <nav class="top-navigation" #navigationRef>
        <div class="nav-content">
          <div class="nav-left">
            <!-- Mobile sidebar toggle -->
            <button 
              class="mobile-toggle apple-button icon-only secondary"
              (click)="layoutService.toggleSidebar()"
              *ngIf="layoutState?.isMobile && layoutState?.currentView === 'chat'"
              [class.active]="layoutState?.sidebarOpen"
              title="Toggle sidebar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            
            <div class="nav-brand">
              <h1>Biblioteca UIDE - Asistente IA</h1>
            </div>
          </div>
          
          <div class="nav-tabs">
            <button 
              class="nav-tab" 
              [class.active]="layoutState?.currentView === 'chat'"
              (click)="setCurrentView('chat')"
            >
              Chat IA
            </button>
            <button 
              class="nav-tab" 
              [class.active]="layoutState?.currentView === 'search'"
              (click)="setCurrentView('search')"
            >
              Buscar Libros
            </button>
            <button 
              class="nav-tab" 
              [class.active]="layoutState?.currentView === 'admin'"
              (click)="setCurrentView('admin')"
            >
              Admin Panel
            </button>
          </div>
        </div>
      </nav>

      <!-- Mobile Overlay -->
      <div 
        class="mobile-overlay" 
        [class.visible]="layoutState?.isMobile && layoutState?.sidebarOpen && layoutState?.currentView === 'chat'"
        (click)="layoutService.setSidebarOpen(false)">
      </div>

      <!-- DEBUG: Fallback when layoutState is undefined -->
      <div *ngIf="!layoutState" class="debug-fallback">
        <h2>Loading layout...</h2>
        <p>LayoutState is undefined</p>
      </div>

      <!-- Sidebar (only in chat view) -->
      <app-conversation-list 
        *ngIf="layoutState?.currentView === 'chat'"
        class="layout-sidebar"
        [class.sidebar-visible]="layoutState?.sidebarOpen">
      </app-conversation-list>

      <!-- Main Content Area -->
      <main class="main-content">
        <!-- Chat View -->
        <app-chat *ngIf="layoutState.currentView === 'chat'"></app-chat>
        
        <!-- Book Search View -->
        <div class="view-container" *ngIf="layoutState.currentView === 'search'">
          <app-book-search (reservationMade)="onReservationMade($event)"></app-book-search>
        </div>
        
        <!-- Admin Dashboard View -->
        <div class="view-container" *ngIf="layoutState.currentView === 'admin'">
          <app-admin-dashboard></app-admin-dashboard>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: linear-gradient(180deg, #f5f5f7 0%, #fafafa 100%);
      overflow: hidden;
    }

    /* Navigation */
    .top-navigation {
      display: flex;
      align-items: center;
      height: var(--nav-height);
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
      position: relative;
      z-index: var(--z-navigation);
      flex-shrink: 0;
    }

    .nav-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0 20px;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .mobile-toggle {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.05);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--layout-transition-duration) var(--layout-transition-easing);
      
      &:hover {
        background: rgba(0, 0, 0, 0.1);
        transform: scale(1.05);
      }
      
      &.active {
        background: #007aff;
        color: white;
      }
      
      svg {
        width: 18px;
        height: 18px;
        transition: transform var(--layout-transition-duration) var(--layout-transition-easing);
      }
    }

    .nav-brand h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: -0.01em;
    }

    .nav-tabs {
      display: flex;
      gap: 6px;
    }

    .nav-tab {
      background: none;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #6e6e73;
      transition: all var(--layout-transition-duration) var(--layout-transition-easing);
      white-space: nowrap;
    }

    .nav-tab:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #1d1d1f;
    }

    .nav-tab.active {
      background: #007aff;
      color: white;
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
    }

    /* Mobile Overlay */
    .mobile-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: var(--z-overlay);
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--layout-transition-duration) var(--layout-transition-easing);
      
      &.visible {
        opacity: 1;
        pointer-events: auto;
      }
      
      @media (min-width: 769px) {
        display: none;
      }
    }

    /* Sidebar - COMPLETAMENTE OCULTA/VISIBLE */
    .layout-sidebar {
      position: fixed;
      top: var(--nav-height);
      left: 0;
      height: calc(100vh - var(--nav-height));
      z-index: var(--z-sidebar);
      transition: transform var(--layout-transition-duration) var(--layout-transition-easing);
      
      /* Por defecto: OCULTA */
      transform: translateX(-100%);
      
      /* Mostrar cuando sidebar-open usando clases del body */
      :global(body.sidebar-open) & {
        transform: translateX(0);
      }
      
      /* Alternativa: mostrar cuando tiene clase directa */
      &.sidebar-visible {
        transform: translateX(0);
      }
    }

    /* Main Content - MARGEN DINÁMICO */
    .main-content {
      flex: 1;
      height: calc(100vh - var(--nav-height));
      margin-left: var(--main-content-margin);
      transition: margin-left var(--layout-transition-duration) var(--layout-transition-easing);
      overflow: hidden;
      
      @media (max-width: 768px) {
        margin-left: 0;
      }
    }

    .view-container {
      height: 100%;
      overflow-y: auto;
      padding: 20px;
      
      /* Apple-style scrollbar */
      &::-webkit-scrollbar {
        width: 8px;
      }
      
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      
      &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        
        &:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .layout-container {
        background: linear-gradient(180deg, #1c1c1e 0%, #000000 100%);
      }
      
      .top-navigation {
        background: rgba(28, 28, 30, 0.8);
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }
      
      .nav-brand h1 {
        color: #f2f2f7;
      }
      
      .nav-tab {
        color: #98989d;
      }
      
      .nav-tab:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #f2f2f7;
      }
      
      .mobile-toggle {
        background: rgba(255, 255, 255, 0.1);
        
        &:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        &.active {
          background: #007aff;
        }
      }
      
      .mobile-overlay {
        background: rgba(0, 0, 0, 0.6);
      }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .nav-content {
        padding: 0 16px;
      }
      
      .nav-brand h1 {
        font-size: 16px;
      }
      
      .nav-tabs {
        gap: 4px;
      }
      
      .nav-tab {
        padding: 6px 12px;
        font-size: 13px;
      }
      
      .view-container {
        padding: 16px;
      }
    }

    @media (max-width: 480px) {
      .nav-brand h1 {
        font-size: 14px;
      }
      
      .nav-tab {
        padding: 6px 8px;
        font-size: 12px;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('navigationRef') navigationRef!: ElementRef;

  layoutState: LayoutState;
  private destroy$ = new Subject<void>();

  constructor(public layoutService: LayoutService) {
    // Inicializar con valores por defecto para evitar undefined
    this.layoutState = this.getDefaultState();
    console.log('[MainLayoutComponent] Constructor - default state:', this.layoutState);
  }

  private getDefaultState(): LayoutState {
    return {
      sidebarOpen: false,
      sidebarCollapsed: false,
      currentView: 'chat',
      isMobile: window.innerWidth <= 768,
      navHeight: 60
    };
  }

  ngOnInit() {
    console.log('[MainLayoutComponent] ngOnInit - starting layout service subscription');
    
    // Subscribe to layout state changes
    this.layoutService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        console.log('[MainLayoutComponent] Layout state updated:', state);
        this.layoutState = state || this.getDefaultState();
      });
  }

  ngAfterViewInit() {
    // Measure and set navigation height
    if (this.navigationRef) {
      const navHeight = this.navigationRef.nativeElement.offsetHeight;
      this.layoutService.setNavHeight(navHeight);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setCurrentView(view: ViewType) {
    console.log('[MainLayoutComponent] setCurrentView called with:', view);
    console.log('[MainLayoutComponent] Current layoutState before:', this.layoutState);
    this.layoutService.setCurrentView(view);
    console.log('[MainLayoutComponent] setCurrentView completed');
  }

  onReservationMade(result: any) {
    // Handle reservation notification
    if (result.success) {
      console.log('Reservation made:', result);
    }
  }
}