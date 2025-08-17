// src/app/models/layout-state.model.ts
export interface LayoutState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  currentView: ViewType;
  isMobile: boolean;
  navHeight: number;
}

export type ViewType = 'chat' | 'search' | 'login' | 'admin' | 'statistics';

export interface LayoutConfig {
  sidebarWidth: {
    expanded: number;
    collapsed: number;
  };
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  transitions: {
    duration: string;
    easing: string;
  };
  zIndex: {
    sidebar: number;
    overlay: number;
    navigation: number;
  };
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  sidebarWidth: {
    expanded: 280,
    collapsed: 70
  },
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  },
  transitions: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  zIndex: {
    sidebar: 200,
    overlay: 150,
    navigation: 100
  }
};