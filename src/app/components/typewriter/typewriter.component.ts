// src/app/components/typewriter/typewriter.component.ts
import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-typewriter',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span [innerHTML]="displayText" class="typewriter-text"></span>
    <span *ngIf="isTyping" class="cursor">|</span>
  `,
    styles: [`
    .typewriter-text {
      display: inline;
    }
    
    .cursor {
      display: inline-block;
      opacity: 1;
      animation: blink 1s infinite;
      color: var(--apple-blue);
      font-weight: 500;
    }
    
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `]
})
export class TypewriterComponent implements OnInit, OnDestroy, OnChanges {
    @Input() text: string = '';
    @Input() speed: number = 30; // velocidad en ms por carácter
    @Input() startDelay: number = 300; // delay antes de empezar
    @Input() autoStart: boolean = true;

    displayText: string = '';
    isTyping: boolean = false;
    private currentIndex: number = 0;
    private typewriterInterval: any;
    private startTimeout: any;

    ngOnInit() {
        if (this.autoStart && this.text) {
            this.startTypewriter();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['text'] && changes['text'].currentValue) {
            this.resetAndStart();
        }
    }

    ngOnDestroy() {
        this.clearIntervals();
    }

    private resetAndStart() {
        this.clearIntervals();
        this.displayText = '';
        this.currentIndex = 0;
        this.isTyping = false;

        if (this.text && this.autoStart) {
            this.startTypewriter();
        }
    }

    private startTypewriter() {
        this.startTimeout = setTimeout(() => {
            this.isTyping = true;
            this.typeNext();
        }, this.startDelay);
    }

    private typeNext() {
        if (this.currentIndex < this.text.length) {
            // Añadir el siguiente carácter
            this.displayText += this.text[this.currentIndex];
            this.currentIndex++;

            // Velocidad variable: más rápido en espacios y puntuación
            let nextSpeed = this.speed;
            const currentChar = this.text[this.currentIndex - 1];
            
            if (currentChar === ' ') {
                nextSpeed = this.speed * 0.3; // Espacios más rápidos
            } else if (currentChar === '.' || currentChar === ',' || currentChar === '!' || currentChar === '?') {
                nextSpeed = this.speed * 2; // Pausa en puntuación
            } else if (currentChar === '\n') {
                nextSpeed = this.speed * 3; // Pausa en saltos de línea
            }

            // Programar el siguiente carácter
            this.typewriterInterval = setTimeout(() => {
                this.typeNext();
            }, nextSpeed);
        } else {
            // Terminamos de escribir
            this.isTyping = false;
        }
    }

    private clearIntervals() {
        if (this.typewriterInterval) {
            clearTimeout(this.typewriterInterval);
            this.typewriterInterval = null;
        }
        if (this.startTimeout) {
            clearTimeout(this.startTimeout);
            this.startTimeout = null;
        }
    }

    // Métodos públicos para control manual
    start() {
        if (!this.isTyping && this.currentIndex < this.text.length) {
            this.startTypewriter();
        }
    }

    stop() {
        this.clearIntervals();
        this.isTyping = false;
    }

    reset() {
        this.clearIntervals();
        this.displayText = '';
        this.currentIndex = 0;
        this.isTyping = false;
    }

    complete() {
        this.clearIntervals();
        this.displayText = this.text;
        this.currentIndex = this.text.length;
        this.isTyping = false;
    }
}