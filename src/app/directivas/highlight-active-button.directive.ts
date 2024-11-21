import { Directive, ElementRef, Renderer2, HostListener } from '@angular/core';

@Directive({
  selector: '[appHighlightActiveButton]',
  standalone: true
})
export class HighlightActiveButtonDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  // Aumentar el tamaño del botón cuando el mouse entra
  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1.2)');  // Aumenta el tamaño
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.3s ease');  // Suaviza la transición
  }

  // Volver al tamaño original cuando el mouse sale
  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1)');  // Vuelve al tamaño original
  }
}
