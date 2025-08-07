// src/app/components/typing-indicator/typing-indicator.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="typing-indicator" [class.visible]="isVisible">
      <div class="typing-dots">
        <div class="dot" [style.animation-delay]="'0ms'"></div>
        <div class="dot" [style.animation-delay]="'160ms'"></div>
        <div class="dot" [style.animation-delay]="'320ms'"></div>
      </div>
      <span class="typing-text">{{ message }}</span>
    </div>
  `,
  styles: [`
    .typing-indicator {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background: var(--system-secondary-background);
      border-radius: var(--border-radius-lg);
      margin: var(--spacing-sm) 0;
      opacity: 0;
      transform: translateY(10px);
      transition: all var(--transition-medium);
      max-width: 200px;
      
      &.visible {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .typing-dots {
      display: flex;
      gap: 4px;
    }

    .dot {
      width: 8px;
      height: 8px;
      background: var(--label-secondary);
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
      }
      30% {
        transform: translateY(-8px);
        opacity: 1;
      }
    }

    .typing-text {
      font-size: 14px;
      color: var(--label-secondary);
      font-style: italic;
    }
  `]
})
export class TypingIndicatorComponent {
  @Input() isVisible: boolean = false;
  @Input() message: string = 'Escribiendo...';
}
