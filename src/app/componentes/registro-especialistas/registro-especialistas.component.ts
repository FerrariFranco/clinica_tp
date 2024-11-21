import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, getDocs } from '@angular/fire/firestore';
import { AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';
import { SpinnerComponent } from '../spinner/spinner.component';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { sendEmailVerification } from '@angular/fire/auth';
import { RecaptchaDirective } from '../../directivas/recaptcha.directive';
import { AlertService } from '../../servicios/alert.service';

@Component({
  selector: 'app-registro-especialistas',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent, RecaptchaDirective],
  templateUrl: './registro-especialistas.component.html',
  styleUrls: ['./registro-especialistas.component.scss'],
})
export class RegistroEspecialistasComponent implements OnInit {
  nombre = '';
  apellido = '';
  edad: number | null = null;
  dni = '';
  especialidad = '';
  autorizado = false;
  nuevaEspecialidad = '';
  mail = '';
  password = '';
  loading = false;
  selectedFile: File | null = null;
  captchaValid = false;
  especialidadesSeleccionadas: string[] = []; 
  especialidadesList: string[] = [];

  constructor(
    private firestore: Firestore, 
    private authService: AuthService, 
    private router: Router, 
    private alertService: AlertService
  ) {}

  async ngOnInit() {
    await this.cargarEspecialidades();
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];
    }
  }

  onCaptchaResolved(isResolved: boolean) {
    this.captchaValid = isResolved;
  }

  async cargarEspecialidades() {
    const especialidadesRef = collection(this.firestore, 'especialidades');
    const snapshot = await getDocs(especialidadesRef);
    this.especialidadesList = snapshot.docs.map(doc => doc.data()['nombre']);
  }

  validateFields(): boolean {
    if (!this.nombre || !this.apellido || !this.dni || !this.mail || !this.password || !this.edad) {
      this.alertService.showAlert('Todos los campos deben ser completados.', 'error');
      return false;
    }
    if (/\d/.test(this.nombre) || /\d/.test(this.apellido)) {
      this.alertService.showAlert('El nombre y el apellido no pueden contener números.', 'error');
      return false;
    }
    if (isNaN(Number(this.dni))) {
      this.alertService.showAlert('El DNI debe contener solo números.', 'error');
      return false;
    }
    if (isNaN(Number(this.edad))) {
      this.alertService.showAlert('La edad debe ser un número.', 'error');
      return false;
    }
    return true;
  }

  async agregarEspecialidad() {
    if (this.nuevaEspecialidad && !this.especialidadesList.includes(this.nuevaEspecialidad.trim())) {
      try {
        const especialidadesRef = collection(this.firestore, 'especialidades');
        await addDoc(especialidadesRef, { nombre: this.nuevaEspecialidad.trim(), imagen: "gs://clinica-tp-930ba.appspot.com/iconosEspecialidades/generico.png" });
        
        this.especialidadesList.push(this.nuevaEspecialidad.trim());
        this.nuevaEspecialidad = '';
      } catch (error) {
        console.error("Error al agregar la especialidad:", error);
      }
    } else {
      this.alertService.showAlert('La especialidad ya existe o el campo está vacío.', 'error');
    }
  }

  toggleEspecialidad(especialidad: string) {
    if (this.especialidadesSeleccionadas.includes(especialidad)) {
      this.especialidadesSeleccionadas = this.especialidadesSeleccionadas.filter(e => e !== especialidad);
    } else {
      this.especialidadesSeleccionadas.push(especialidad);
    }
  }

  isEspecialidadSeleccionada(especialidad: string): boolean {
    return this.especialidadesSeleccionadas.includes(especialidad);
  }

  async onRegister() {
    this.loading = true;
    try {
      if (!this.validateFields()) {
        this.loading = false;
        return; 
      }

      const userCredential = await this.authService.register(this.mail, this.password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      this.alertService.showAlert('Registrado Correctamente!! Revise su casilla de correo electrónico para verificar su cuenta.', 'success');

      let imageUrl: string | null = null;
      if (this.selectedFile) {
        const storage = getStorage();
        const imageRef = ref(storage, `fotosEspecialistas/${this.mail}1.jpg`);
        await uploadBytes(imageRef, this.selectedFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const especialistaData = {
        nombre: this.nombre,
        apellido: this.apellido,
        edad: this.edad,
        dni: this.dni,
        especialidades: this.especialidadesSeleccionadas,  
        mail: this.mail,
        uid: user.uid,
        autorizado: this.autorizado,
        imagenUrl: imageUrl
      };

      const especialistasRef = collection(this.firestore, 'especialistas');
      await addDoc(especialistasRef, especialistaData);

      const usuarioData = {
        email: this.mail,
        rol: 'especialista',
        uid: user.uid
      };
      const usuariosRef = collection(this.firestore, 'usuarios');
      await addDoc(usuariosRef, usuarioData);

      await this.authService.logout();

      this.router.navigate(['/login']);
    } catch (error) {
      this.alertService.showAlert('ERROR INESPERADO', 'error');
    } finally {
      this.loading = false;
    }
  }
}
