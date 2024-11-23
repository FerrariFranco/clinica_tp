import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';
import { SpinnerComponent } from '../spinner/spinner.component';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { RecaptchaDirective } from '../../directivas/recaptcha.directive';
import { AlertService } from '../../servicios/alert.service';

@Component({
  selector: 'app-registro-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent, RecaptchaDirective],
  templateUrl: './registro-pacientes.component.html',
  styleUrls: ['./registro-pacientes.component.scss'],
})
export class RegistroPacientesComponent {
  nombre = null;
  apellido = null;
  edad: number | null = null;
  dni = null;
  obraSocial = null;
  mail = null;
  password = null;
  rol = 'paciente';
  loading = false;
  imagen1: File | null = null;
  imagen2: File | null = null;
  captchaValid = false;
  captchaActivo: boolean = false;


  @ViewChild(RecaptchaDirective) recaptchaDirective!: RecaptchaDirective;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private router: Router,
    private storage: Storage,
    private alertService: AlertService
  ) {    this.checkCaptchaStatus(); // Verificar estado del captcha al inicializar
  }
  
  onCaptchaResolved(isResolved: boolean) {
    this.captchaValid = isResolved;
  }
  
  onImage1Selected(event: any) {
    this.imagen1 = event.target.files[0];
  }
  
  onImage2Selected(event: any) {
    this.imagen2 = event.target.files[0];
  }
  async checkCaptchaStatus() {
    try {
      const captchaRef = doc(this.firestore, 'captcha', 'captcha'); // ID único: "captcha"
      const captchaSnapshot = await getDoc(captchaRef);
      if (captchaSnapshot.exists()) {
        const data = captchaSnapshot.data();
        this.captchaActivo = data['activado'] === true; // Verifica si está activado
      }
    } catch (error) {
      console.error('Error al verificar el estado del captcha:', error);
    }
  }
  async onRegister() {
    if (!this.nombre || !this.apellido || this.edad === null || !this.dni || !this.obraSocial || !this.mail || !this.password || !this.imagen1 || !this.imagen2) {
      this.alertService.showAlert('Por favor, complete todos los campos obligatorios.', 'error');
      return;
    }


    if (!this.isValidName(this.nombre)) {
      this.alertService.showAlert('El nombre no puede contener números.', 'error');
      return;
    }

    if (!this.isValidName(this.apellido)) {
      this.alertService.showAlert('El apellido no puede contener números.', 'error');
      return;
    }

    if (!this.isValidDni(this.dni)) {
      this.alertService.showAlert('El DNI debe contener solo números.', 'error');
      return;
    }

    if (!this.isValidAge(this.edad)) {
      this.alertService.showAlert('La edad debe ser un número positivo.', 'error');
      return;
    }

    if(this.captchaActivo){
      
      this.captchaValid = this.recaptchaDirective.validateCaptcha();
      if (!this.captchaValid) {
        this.alertService.showAlert('Por favor, resuelva el captcha antes de registrarse.', 'error');
        return;
    }
    }

    this.loading = true;
    try {
      const userCredential = await this.authService.register(this.mail, this.password);
      const user = userCredential.user;

      const imageUrls = await this.uploadImages(user.uid);

      const pacienteData = {
        nombre: this.nombre,
        apellido: this.apellido,
        edad: this.edad,
        dni: this.dni,
        obraSocial: this.obraSocial,
        mail: this.mail,
        uid: user.uid,
        imagen1Url: imageUrls[0],
        imagen2Url: imageUrls[1],
      };

      const pacientesRef = collection(this.firestore, 'pacientes');
      await addDoc(pacientesRef, pacienteData);

      const usuarioData = {
        email: this.mail,
        rol: this.rol,
      };
      const usuariosRef = collection(this.firestore, 'usuarios');
      await addDoc(usuariosRef, usuarioData);

      this.alertService.showAlert('Registrado Correctamente!! Revise su casilla de correo electronico para verificar su Cuenta', 'success');

      await this.authService.logout();
      this.router.navigate(['/home']);
    } catch (error) {
      this.alertService.showAlert('ERROR INESPERADO', 'error');
    } finally {
      this.loading = false;
    }
  }

  private async uploadImages(uid: string): Promise<string[]> {
    const urls: string[] = [];
    const images = [this.imagen1, this.imagen2];
    for (let i = 0; i < images.length; i++) {
      if (images[i]) {
        const imageRef = ref(this.storage, `fotosPacientes/${uid}_${i + 1}.jpg`);
        await uploadBytes(imageRef, images[i]!);
        const downloadURL = await getDownloadURL(imageRef);
        urls.push(downloadURL);
      }
    }
    return urls;
  }

  private isValidName(name: string): boolean {
    return /^[A-Za-zÀ-ÿ\s]+$/.test(name);
  }

  private isValidDni(dni: string): boolean {
    return /^\d+$/.test(dni);
  }

  private isValidAge(age: number): boolean {
    return Number.isInteger(age) && age > 0; 
  }
}
