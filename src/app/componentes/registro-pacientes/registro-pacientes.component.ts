import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';
import { SpinnerComponent } from '../spinner/spinner.component';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-registro-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './registro-pacientes.component.html',
  styleUrls: ['./registro-pacientes.component.scss'],
})
export class RegistroPacientesComponent {
  nombre = '';
  apellido = '';
  edad: number | null = null;
  dni = '';
  obraSocial = '';
  mail = '';
  password = '';
  rol = 'paciente'; // Asigna el rol predeterminado
  loading = false;
  imagen1: File | null = null;
  imagen2: File | null = null;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private router: Router,
    private storage: Storage
  ) {}

  onImage1Selected(event: any) {
    this.imagen1 = event.target.files[0];
  }

  onImage2Selected(event: any) {
    this.imagen2 = event.target.files[0];
  }

  async onRegister() {
    // Validación de campos
    if (!this.nombre || !this.apellido || this.edad === null || !this.dni || !this.obraSocial || !this.mail || !this.password || !this.imagen1 || !this.imagen2) {
      alert('Por favor, complete todos los campos obligatorios.');
      return; // Detiene la ejecución si algún campo está vacío
    }

    this.loading = true;
    try {
      // Registrar el usuario en Firebase Authentication
      const userCredential = await this.authService.register(this.mail, this.password);
      const user = userCredential.user;

      // Cargar las imágenes en Firebase Storage y obtener las URLs
      const imageUrls = await this.uploadImages(user.uid);

      // Datos del paciente
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

      console.log('Paciente y usuario registrados exitosamente');
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error al registrar paciente:', error);
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
}
