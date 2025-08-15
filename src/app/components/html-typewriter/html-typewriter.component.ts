// src/app/components/html-typewriter/html-typewriter.component.ts
import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-html-typewriter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container class="html-typewriter-container" [innerHTML]="displayHtml"></div>
    <span *ngIf="isTyping" class="cursor">|</span>
  `,
  styles: [`
    .html-typewriter-container {
      display: inline;
    }
    
    .cursor {
      display: inline-block;
      opacity: 1;
      animation: blink 1s infinite;
      color: var(--apple-blue);
      font-weight: 500;
      margin-left: 2px;
    }
    
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `]
})
export class HtmlTypewriterComponent implements OnInit, OnDestroy, OnChanges {
  @Input() html: string = '';
  @Input() speed: number = 30;
  @Input() startDelay: number = 300;
  @Input() autoStart: boolean = true;

  @ViewChild('container', { static: true }) container!: ElementRef;

  displayHtml: string = '';
  isTyping: boolean = false;
  
  private textContent: string = '';
  private htmlStructure: any[] = [];
  private currentIndex: number = 0;
  private typewriterInterval: any;
  private startTimeout: any;

  ngOnInit() {
    if (this.autoStart && this.html) {
      this.startTypewriter();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['html'] && changes['html'].currentValue) {
      this.resetAndStart();
    }
  }

  ngOnDestroy() {
    this.clearIntervals();
  }

  private resetAndStart() {
    this.clearIntervals();
    this.displayHtml = '';
    this.currentIndex = 0;
    this.isTyping = false;

    if (this.html && this.autoStart) {
      this.parseHtmlStructure();
      this.startTypewriter();
    }
  }

  private parseHtmlStructure() {
    // Extraer texto plano del HTML para el efecto typewriter
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.html;
    this.textContent = tempDiv.textContent || tempDiv.innerText || '';
  }

  private startTypewriter() {
    this.parseHtmlStructure();
    
    this.startTimeout = setTimeout(() => {
      this.isTyping = true;
      this.typeNext();
    }, this.startDelay);
  }

  private typeNext() {
    if (this.currentIndex < this.textContent.length) {
      // Extraer el texto hasta el índice actual
      const currentText = this.textContent.substring(0, this.currentIndex + 1);
      
      // Recrear el HTML con el texto parcial
      this.displayHtml = this.applyFormattingToPartialText(currentText);
      
      this.currentIndex++;

      // Velocidad variable
      let nextSpeed = this.speed;
      const currentChar = this.textContent[this.currentIndex - 1];
      
      if (currentChar === ' ') {
        nextSpeed = this.speed * 0.3;
      } else if (currentChar === '.' || currentChar === ',' || currentChar === '!' || currentChar === '?') {
        nextSpeed = this.speed * 2;
      } else if (currentChar === '\n') {
        nextSpeed = this.speed * 3;
      }

      this.typewriterInterval = setTimeout(() => {
        this.typeNext();
      }, nextSpeed);
    } else {
      // Terminamos de escribir - mostrar HTML completo
      this.displayHtml = this.html;
      this.isTyping = false;
    }
  }

  private applyFormattingToPartialText(partialText: string): string {
    // Crear un fragmento temporal con el HTML original para extraer estructura
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.html;
    
    // Obtener todo el texto del HTML original
    const fullText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Si el texto parcial coincide con una porción del texto completo,
    // aplicar el mismo formato que el MessageComponent
    let result = partialText;
    
    // Aplicar el mismo formateo que usa MessageComponent
    // Convertir saltos de línea dobles en párrafos
    result = result.split('\n\n').map(paragraph => {
      if (paragraph.trim()) {
        return `<p>${paragraph.trim()}</p>`;
      }
      return '';
    }).join('');

    // Si no hay párrafos, convertir saltos simples en <br>
    if (!result.includes('<p>')) {
      result = partialText.replace(/\n/g, '<br>');
    }

    // Formatear elementos markdown básicos
    result = result
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')

      // Texto en negrita
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')

      // Texto en cursiva
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')

      // Código inline
      .replace(/`([^`]+)`/g, '<code>$1</code>')

      // Bloques de código
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code.trim())}</code></pre>`;
      })

      // Enlaces
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

      // URLs automáticas
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')

      // Listas no ordenadas
      .replace(/^[\*\-] (.+$)/gm, '<li>$1</li>')
      
      // Listas ordenadas
      .replace(/^\d+\. (.+$)/gm, '<li>$1</li>')

      // Citas
      .replace(/^> (.+$)/gm, '<blockquote>$1</blockquote>')

      // Líneas horizontales
      .replace(/^---$/gm, '<hr>')
      .replace(/^\*\*\*$/gm, '<hr>');

    // Envolver listas consecutivas
    result = result.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    return result;
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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

  // Métodos públicos para control
  start() {
    if (!this.isTyping && this.currentIndex < this.textContent.length) {
      this.startTypewriter();
    }
  }

  stop() {
    this.clearIntervals();
    this.isTyping = false;
  }

  complete() {
    this.clearIntervals();
    this.displayHtml = this.html;
    this.currentIndex = this.textContent.length;
    this.isTyping = false;
  }
}