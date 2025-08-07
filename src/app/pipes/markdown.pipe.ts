// src/app/pipes/markdown.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) { }

  transform(value: string): SafeHtml {
    if (!value) return '';

    try {
      // Conversión básica de markdown sin librerías externas
      let html = value
        // Código en bloque ```
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Código inline `
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Negritas **texto**
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Cursivas *texto*
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Enlaces [texto](url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        // Saltos de línea
        .replace(/\n/g, '<br>');

      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return this.sanitizer.bypassSecurityTrustHtml(value);
    }
  }
}