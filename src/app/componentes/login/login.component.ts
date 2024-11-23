import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { SpinnerComponent } from '../spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { sendEmailVerification } from 'firebase/auth';
import { AlertService } from '../../servicios/alert.service';
import { AuthService } from '../../servicios/auth.service';
import { ProfileDirective } from '../../directivas/profile.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent, ProfileDirective],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  showFavoriteButtons = false;

  favoriteUsers = [
    {
      role: 'Admin',
      image: 'assets/profiles/1.png',
      email: 'francoferrari12345@gmail.com',
      password: 'Prueba123',
    },
    {
      role: 'Especialista 1',
      image: 'assets/profiles/3.png',
      email: 'thorvaldo23@gmail.com',
      password: 'Prueba123',
    },
    {
      role: 'Especialista 2',
      image: 'assets/profiles/4.png',
      email: 'a.clas@sistemas-utnfra.com.ar',
      password: 'Prueba123',
    },
    {
      role: 'Paciente 1',
      image: 'assets/profiles/1.png',
      email: 'pokemonxd75@gmail.com',
      password: 'Prueba123',
    },
    {
      role: 'Paciente 2',
      image: 'assets/profiles/2.png',
      email: 'renanlovoboni@gmail.com',
      password: 'Prueba123',
    },
    {
      role: 'Paciente 3',
      image: 'assets/profiles/7.png',
      email: 'francoferrari226@gmail.com',
      password: 'Prueba123',
    },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService,
    private firestore: Firestore 
  ) {}

  fillCredentials(role: string) {
    const user = this.favoriteUsers.find((u) => u.role === role);
    if (user) {
      this.email = user.email;
      this.password = user.password;
    }
  }

  toggleFavoriteButtons() {
    this.showFavoriteButtons = !this.showFavoriteButtons;
  }
  async onLogin() {
    this.loading = true;
    try {
      const userCredential = await this.authService.login(this.email, this.password);
      const user = userCredential.user;
  
      if (user.emailVerified) {
        const userRole = await this.authService.getUserRoleLogin(user.email!); // Obtener el rol del usuario
  
        if (userRole === 'especialista') {
          const autorizado = await this.authService.isEspecialistaAutorizado(user.email!);
          if (!autorizado) {
            await this.authService.logout(); // Desloguear al usuario
            this.alertService.showAlert(
              'Tu cuenta aún no está autorizada. Por favor, contacta al administrador.',
              'error'
            );
            return; // Salir antes de redirigir
          }
        }
  
        // Registrar log de ingreso si está autorizado
        await this.registrarLogIngreso(user.email || 'Usuario desconocido');
        this.alertService.showAlert('Usuario logueado exitosamente', 'success');
        this.router.navigate(['/home']); // Redirigir al home
      } else {
        await sendEmailVerification(user);
        this.alertService.showAlert('Correo no verificado. Se ha enviado un correo de verificación.', 'error');
      }
    } catch (error) {
      this.alertService.showAlert('ERROR INESPERADO', 'error');
    } finally {
      this.loading = false;
    }
  }
  
  private async registrarLogIngreso(email: string) {
    try {
      const logsRef = collection(this.firestore, 'logs');
      const now = new Date();
      
      const fecha = now.toISOString().split('T')[0];
      
      const hora = now.toTimeString().split(' ')[0];  
  
      await addDoc(logsRef, {
        fecha: fecha,
        hora: hora,
        usuario: email,
      });
  
      console.log('Log de ingreso registrado:', { email, fecha, hora });
    } catch (error) {
      console.error('Error al registrar el log de ingreso:', error);
    }
  }
}
