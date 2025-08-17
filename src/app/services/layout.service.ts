// src/app/services/layout.service.ts
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { LayoutState, ViewType, LayoutConfig, DEFAULT_LAYOUT_CONFIG } from '../models/layout-state.model';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private readonly STORAGE_KEY = 'layout-preferences';
  private readonly config: LayoutConfig = DEFAULT_LAYOUT_CONFIG;

  private layoutState$ = new BehaviorSubject<LayoutState>(this.getInitialState());

  // Public observables
  readonly state$: Observable<LayoutState> = this.layoutState$.asObservable();
  readonly isMobile$: Observable<boolean> = this.state$.pipe(
    map(state => state.isMobile),
    distinctUntilChanged()
  );
  readonly currentView$: Observable<ViewType> = this.state$.pipe(
    map(state => state.currentView),
    distinctUntilChanged()
  );
  readonly sidebarCollapsed$: Observable<boolean> = this.state$.pipe(
    map(state => state.sidebarCollapsed),
    distinctUntilChanged()
  );

  constructor() {
    console.log('[LayoutService] Constructor - initializing layout service');
    this.initializeLayoutSystem();
    this.setupResizeListener();
    this.updateCSSVariables();
    console.log('[LayoutService] Constructor complete - current state:', this.currentState);
  }

  // Getters
  get currentState(): LayoutState {
    return this.layoutState$.value;
  }

  get isMobile(): boolean {
    return this.currentState.isMobile;
  }

  get sidebarWidth(): number {
    const state = this.currentState;
    return state.sidebarCollapsed 
      ? this.config.sidebarWidth.collapsed 
      : this.config.sidebarWidth.expanded;
  }

  // State management methods
  setCurrentView(view: ViewType): void {
    console.log('[LayoutService] setCurrentView called with:', view);
    console.log('[LayoutService] Current state before update:', this.currentState);
    this.updateState({ currentView: view });
    console.log('[LayoutService] Current state after update:', this.currentState);
    
    // Auto-close sidebar on mobile when switching to non-chat views
    if (this.isMobile && view !== 'chat' && this.currentState.sidebarOpen) {
      console.log('[LayoutService] Auto-closing sidebar on mobile');
      this.setSidebarOpen(false);
    }
    console.log('[LayoutService] setCurrentView completed');
  }

  setSidebarOpen(open: boolean): void {
    this.updateState({ sidebarOpen: open });
  }

  setSidebarCollapsed(collapsed: boolean): void {
    // Only allow collapse on desktop
    if (!this.isMobile) {
      this.updateState({ sidebarCollapsed: collapsed });
      this.savePreferences();
      this.updateCSSVariables();
    }
  }

  toggleSidebar(): void {
    console.log('[LayoutService] toggleSidebar called, current state:', this.currentState.sidebarOpen);
    this.setSidebarOpen(!this.currentState.sidebarOpen);
    console.log('[LayoutService] toggleSidebar completed, new state:', this.currentState.sidebarOpen);
  }

  toggleSidebarCollapse(): void {
    this.setSidebarCollapsed(!this.currentState.sidebarCollapsed);
  }

  // Responsive methods
  setNavHeight(height: number): void {
    this.updateState({ navHeight: height });
    this.updateCSSVariables();
  }

  // Private methods
  private getInitialState(): LayoutState {
    const preferences = this.loadPreferences();
    const isMobile = this.checkIsMobile();

    return {
      sidebarOpen: false, // Start closed by default
      sidebarCollapsed: isMobile ? false : preferences.sidebarCollapsed,
      currentView: 'chat',
      isMobile,
      navHeight: 60 // Default nav height
    };
  }

  private initializeLayoutSystem(): void {
    // Apply initial CSS classes
    this.updateBodyClasses();
    
    // Set initial CSS variables
    this.updateCSSVariables();
  }

  private setupResizeListener(): void {
    fromEvent(window, 'resize')
      .pipe(debounceTime(150))
      .subscribe(() => {
        const wasMobile = this.currentState.isMobile;
        const isMobile = this.checkIsMobile();
        
        if (wasMobile !== isMobile) {
          this.updateState({ 
            isMobile,
            sidebarOpen: false, // Close sidebar on breakpoint change
            sidebarCollapsed: isMobile ? false : this.currentState.sidebarCollapsed
          });
          this.updateBodyClasses();
          this.updateCSSVariables();
        }
      });
  }

  private checkIsMobile(): boolean {
    return window.innerWidth < this.config.breakpoints.mobile;
  }

  private updateState(partial: Partial<LayoutState>): void {
    const newState = { ...this.currentState, ...partial };
    this.layoutState$.next(newState);
    this.updateBodyClasses();
  }

  private updateBodyClasses(): void {
    const state = this.currentState;
    const body = document.body;
    
    console.log('[LayoutService] Updating body classes with state:', state);
    
    // Clear existing layout classes
    body.classList.remove('mobile', 'desktop', 'sidebar-open', 'sidebar-collapsed', 'chat-view', 'search-view', 'admin-view');
    
    // Add current state classes
    body.classList.add(state.isMobile ? 'mobile' : 'desktop');
    
    if (state.sidebarOpen) {
      body.classList.add('sidebar-open');
      console.log('[LayoutService] Added sidebar-open class to body');
    }
    
    if (state.sidebarCollapsed && !state.isMobile) {
      body.classList.add('sidebar-collapsed');
    }
    
    body.classList.add(`${state.currentView}-view`);
    
    console.log('[LayoutService] Body classes after update:', Array.from(body.classList));
  }

  private updateCSSVariables(): void {
    const state = this.currentState;
    const root = document.documentElement;
    
    // Sidebar width
    const sidebarWidth = state.currentView === 'chat' ? this.sidebarWidth : 0;
    root.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    root.style.setProperty('--sidebar-width-expanded', `${this.config.sidebarWidth.expanded}px`);
    root.style.setProperty('--sidebar-width-collapsed', `${this.config.sidebarWidth.collapsed}px`);
    
    // Navigation
    root.style.setProperty('--nav-height', `${state.navHeight}px`);
    
    // Breakpoints
    root.style.setProperty('--mobile-breakpoint', `${this.config.breakpoints.mobile}px`);
    
    // Transitions
    root.style.setProperty('--layout-transition-duration', this.config.transitions.duration);
    root.style.setProperty('--layout-transition-easing', this.config.transitions.easing);
    
    // Z-indexes
    root.style.setProperty('--z-sidebar', this.config.zIndex.sidebar.toString());
    root.style.setProperty('--z-overlay', this.config.zIndex.overlay.toString());
    root.style.setProperty('--z-navigation', this.config.zIndex.navigation.toString());
    
    // Main content margin
    const mainMargin = state.isMobile || state.currentView !== 'chat' ? 0 : sidebarWidth;
    root.style.setProperty('--main-content-margin', `${mainMargin}px`);
  }

  private loadPreferences(): { sidebarCollapsed: boolean } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : { sidebarCollapsed: false };
    } catch {
      return { sidebarCollapsed: false };
    }
  }

  private savePreferences(): void {
    try {
      const preferences = {
        sidebarCollapsed: this.currentState.sidebarCollapsed
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save layout preferences:', error);
    }
  }
}