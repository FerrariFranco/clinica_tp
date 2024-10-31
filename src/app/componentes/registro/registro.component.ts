import { Component } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpinnerComponent } from '../spinner/spinner.component';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

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
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore
  ) {}

  async onRegister() {
    this.loading = true;
    try {
      const userCredential = await this.authService.register(this.email, this.password);
      const user = userCredential.user;

      const usuarioData = {
        email: this.email,
        rol: 'admin',  
        uid: user.uid,
      };
      const usuariosRef = collection(this.firestore, 'usuarios');
      await addDoc(usuariosRef, usuarioData);

      console.log('Usuario admin registrado exitosamente');
      this.router.navigate(['/home']); 
    } catch (error) {
      console.error('Error al registrar:', error);
    } finally {
      this.loading = false;
    }
  }
}
