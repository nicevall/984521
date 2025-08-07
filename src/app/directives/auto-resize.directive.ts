// src/app/directives/auto-resize.directive.ts
import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appAutoResize]',
  standalone: true
})
export class AutoResizeDirective implements OnInit, OnDestroy {
  @Input() minHeight: number = 44;
  @Input() maxHeight: number = 120;

  private observer!: MutationObserver;

  constructor(private elementRef: ElementRef<HTMLTextAreaElement>) { }

  ngOnInit() {
    this.adjustHeight();
    this.setupEventListeners();
    this.setupMutationObserver();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupEventListeners() {
    const element = this.elementRef.nativeElement;

    element.addEventListener('input', () => this.adjustHeight());
    element.addEventListener('paste', () => {
      setTimeout(() => this.adjustHeight(), 0);
    });
  }

  private setupMutationObserver() {
    const element = this.elementRef.nativeElement;

    this.observer = new MutationObserver(() => {
      this.adjustHeight();
    });

    this.observer.observe(element, {
      attributes: true,
      attributeFilter: ['value']
    });
  }

  private adjustHeight() {
    const element = this.elementRef.nativeElement;

    // Reset height to auto to get the natural height
    element.style.height = 'auto';

    // Calculate the new height
    let newHeight = element.scrollHeight;

    // Apply min and max constraints
    if (newHeight < this.minHeight) {
      newHeight = this.minHeight;
    } else if (newHeight > this.maxHeight) {
      newHeight = this.maxHeight;
      element.style.overflowY = 'auto';
    } else {
      element.style.overflowY = 'hidden';
    }

    // Set the new height
    element.style.height = newHeight + 'px';
  }
}