import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';
import { SpinnerComponent } from '../spinner/spinner.component';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-registro-especialistas',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './registro-especialistas.component.html',
  styleUrls: ['./registro-especialistas.component.scss'],
})
export class RegistroEspecialistasComponent {
  nombre = '';
  apellido = '';
  edad: number | null = null;
  dni = '';
  especialidad = '';
  nuevaEspecialidad = '';
  mail = '';
  password = '';
  loading = false;
  selectedFile: File | null = null;

  especialidadesList = ['Cardiología', 'Dermatología', 'Pediatría', 'Neurología'];

  constructor(private firestore: Firestore, private authService: AuthService, private router: Router) {}

  // Manejar selección de archivo
  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];
    }
  }

  async onRegister() {
    this.loading = true;
    try {
      // Registrar el usuario en Firebase Authentication
      const userCredential = await this.authService.register(this.mail, this.password);
      const user = userCredential.user;

      // Subir la imagen seleccionada a Firebase Storage y obtener la URL
      let imageUrl: string | null = null;
      if (this.selectedFile) {
        const storage = getStorage();
        const imageRef = ref(storage, `fotosEspecialistas/${this.mail}1.jpg`);
        await uploadBytes(imageRef, this.selectedFile);
        // Obtener la URL de descarga
        imageUrl = await getDownloadURL(imageRef);
      }

      // Crear un nuevo especialista
      const especialistaData = {
        nombre: this.nombre,
        apellido: this.apellido,
        edad: this.edad,
        dni: this.dni,
        especialidad: this.nuevaEspecialidad || this.especialidad,
        mail: this.mail,
        uid: user.uid,
        imagenUrl: imageUrl // Agregar URL de la imagen
      };

      // Guardar datos en la colección 'especialistas'
      const especialistasRef = collection(this.firestore, 'especialistas');
      await addDoc(especialistasRef, especialistaData);

      // Guardar datos en la colección 'usuarios'
      const usuarioData = {
        email: this.mail,
        rol: 'especialista',
        uid: user.uid
      };
      const usuariosRef = collection(this.firestore, 'usuarios');
      await addDoc(usuariosRef, usuarioData);

      console.log('Especialista registrado y autenticado exitosamente');
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error al registrar especialista:', error);
    } finally {
      this.loading = false;
    }
  }
}
