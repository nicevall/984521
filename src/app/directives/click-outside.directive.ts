// src/app/directives/click-outside.directive.ts
import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<Event>();

  constructor(private elementRef: ElementRef) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const element = this.elementRef.nativeElement;

    if (element && !element.contains(target)) {
      this.clickOutside.emit(event);
    }
  }

  @HostListener('document:touchstart', ['$event'])
  onDocumentTouchStart(event: Event) {
    const target = event.target as HTMLElement;
    const element = this.elementRef.nativeElement;

    if (element && !element.contains(target)) {
      this.clickOutside.emit(event);
    }
  }
}