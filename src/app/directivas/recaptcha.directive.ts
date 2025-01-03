import { Directive, ElementRef, EventEmitter, Output, Renderer2 } from '@angular/core';
import { AlertService } from '../servicios/alert.service';

@Directive({
  selector: '[appRecaptcha]',
  standalone: true
})
export class RecaptchaDirective {
  @Output() captchaResolved = new EventEmitter<boolean>();

  private captchaWord: string = '';
  private inputEl!: HTMLInputElement;

  constructor(private el: ElementRef, private renderer: Renderer2, private alertService: AlertService) {
    this.setupCaptchaUI();
  }

  private generateCaptchaWord(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 6 })
      .map(() => characters.charAt(Math.floor(Math.random() * characters.length)))
      .join('');
  }

  private setupCaptchaUI() {
    const container = this.renderer.createElement('div');
    this.renderer.setStyle(container, 'border', '1px solid #ccc');
    this.renderer.setStyle(container, 'padding', '10px');
    this.renderer.setStyle(container, 'display', 'flex');
    this.renderer.setStyle(container, 'flexDirection', 'column');
    this.renderer.setStyle(container, 'alignItems', 'center');
    this.renderer.setStyle(container, 'width', '200px');

    const captchaText = this.renderer.createElement('div');
    this.renderer.setStyle(captchaText, 'textDecoration', 'line-through');
    this.renderer.setStyle(captchaText, 'filter', 'blur(1px)'); // Menos borroso
    this.renderer.setStyle(captchaText, 'fontSize', '20px'); // Texto más grande
    this.renderer.setStyle(captchaText, 'marginBottom', '10px');
    this.captchaWord = this.generateCaptchaWord();
    this.renderer.setProperty(captchaText, 'innerText', this.captchaWord);
    this.renderer.appendChild(container, captchaText);
    
    // Input para que el usuario ingrese el CAPTCHA
    this.inputEl = this.renderer.createElement('input');
    this.renderer.setAttribute(this.inputEl, 'type', 'text');
    this.renderer.setStyle(this.inputEl, 'width', '100%');
    this.renderer.setStyle(this.inputEl, 'marginBottom', '10px');
    this.renderer.appendChild(container, this.inputEl);

    // Botón para refrescar la palabra CAPTCHA
    const refreshButton = this.renderer.createElement('button');
    this.renderer.setProperty(refreshButton, 'innerText', 'Nueva palabra');
    this.renderer.listen(refreshButton, 'click', () => this.refreshCaptcha(captchaText));
    this.renderer.appendChild(container, refreshButton);

    // Prevenir copiar y arrastrar texto del CAPTCHA
    this.renderer.listen(captchaText, 'copy', (event: ClipboardEvent) => {
      event.preventDefault();
      const clipboardData = event.clipboardData;
      if (clipboardData) {
        clipboardData.setData('text/plain', 'No puedes copiar esto');
      }
    });
    this.renderer.listen(captchaText, 'dragstart', (event: DragEvent) => {
      event.preventDefault();
    });

    // Llamar a la validación cuando el usuario presione "Enter"
    this.renderer.listen(this.inputEl, 'input', () => this.checkCaptcha());

    // Añadir todo al DOM
    this.renderer.appendChild(this.el.nativeElement, container);
  }

  private refreshCaptcha(captchaText: HTMLElement) {
    this.captchaWord = this.generateCaptchaWord();
    this.renderer.setProperty(captchaText, 'innerText', this.captchaWord);
    this.inputEl.value = ''; 
    this.captchaResolved.emit(false); // Emitir falso para resetear el estado
  }

  private checkCaptcha() {
    const isValid = this.inputEl.value === this.captchaWord;
    this.captchaResolved.emit(isValid); // Emitir el resultado de la validación
  }

  public validateCaptcha(): boolean {
    return this.inputEl.value === this.captchaWord;
  }
}
