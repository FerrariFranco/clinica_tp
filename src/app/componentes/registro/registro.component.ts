import { Component } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpinnerComponent } from '../spinner/spinner.component';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
})
export class RegistroComponent {
  email = '';
  password = '';
  selectedFile: File | null = null;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore,
    private storage: Storage
  ) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  async onRegister() {
    if (!this.selectedFile) {
      console.error('Debe seleccionar un archivo.');
      return;
    }

    this.loading = true;
    try {
      // Registrar el usuario en Firebase Authentication
      const userCredential = await this.authService.register(this.email, this.password);
      const user = userCredential.user;

      // Subir la imagen a Firebase Storage
      const imageRef = ref(this.storage, `usuarios/${user.uid}/profile-image`);
      await uploadBytes(imageRef, this.selectedFile);
      const imageUrl = await getDownloadURL(imageRef);

      // Guardar datos del usuario en Firestore
      const usuarioData = {
        email: this.email,
        rol: 'admin',
        uid: user.uid,
        imageUrl, // URL de la imagen
      };
      const usuariosRef = collection(this.firestore, 'usuarios');
      await addDoc(usuariosRef, usuarioData);

      console.log('Usuario admin registrado exitosamente con imagen.');
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error al registrar:', error);
    } finally {
      this.loading = false;
    }
  }
}
