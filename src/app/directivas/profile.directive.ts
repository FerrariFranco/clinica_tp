import { Directive, ElementRef, Renderer2, HostListener } from '@angular/core';

@Directive({
  selector: '[appProfileDirective]',
  standalone: true
})
export class ProfileDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  // Cuando se hace clic en el perfil
  @HostListener('click') onClick() {
    const buttons = this.el.nativeElement.closest('.fav-buttons-container').querySelectorAll('button');
    buttons.forEach((button: HTMLElement) => {
      // Eliminar la clase 'profile-selected' de todos los botones
      this.renderer.removeClass(button, 'profile-selected');
    });

    // Agregar la clase 'profile-selected' al perfil clickeado
    this.renderer.addClass(this.el.nativeElement, 'profile-selected');
  }
}
