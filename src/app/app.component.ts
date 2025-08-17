// src/app/app.component.ts - SIMPLIFICADO CON NUEVO LAYOUT SYSTEM
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainLayoutComponent } from './components/layout/main-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MainLayoutComponent
  ],
  template: `
    <app-main-layout></app-main-layout>
  `,
  styles: [`
    /* App component simplificado - toda la lógica está en MainLayoutComponent */
  `]
})
export class AppComponent {
  // Toda la lógica de layout se ha movido a MainLayoutComponent y LayoutService
  // Este componente ahora es únicamente un container
}