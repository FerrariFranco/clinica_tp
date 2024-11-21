import { Directive, ElementRef, Renderer2, HostListener } from '@angular/core';

@Directive({
  selector: '[appSeleccionDia]',  
  standalone:true
})
export class SeleccionDiaDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('change') onChange() {
    const input: HTMLInputElement = this.el.nativeElement;

    // Si el checkbox está seleccionado, cambiamos el fondo y el color del texto
    if (input.checked) {
      this.renderer.setStyle(input.parentElement, 'background-color', '#cce5ff');
      this.renderer.setStyle(input.parentElement, 'color', '#004085');
    } else {
      // Si el checkbox no está seleccionado, revertimos el estilo
      this.renderer.removeStyle(input.parentElement, 'background-color');
      this.renderer.removeStyle(input.parentElement, 'color');
    }
  }
}
