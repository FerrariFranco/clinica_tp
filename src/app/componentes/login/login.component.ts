import { Component } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpinnerComponent } from '../spinner/spinner.component';
import { getAuth, sendEmailVerification } from '@angular/fire/auth';
import { AlertService } from '../../servicios/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  
  email = '';
  password = '';
  loading = false;
  showFavoriteButtons = false;
  
  constructor(private authService: AuthService, private router: Router, private alertService:AlertService) {}
  fillCredentials(role: string) {
    switch (role) {
      case 'admin':
        this.email = 'admin@example.com';
        this.password = 'admin123';
        break;
      case 'especialista':
        this.email = 'especialista@example.com';
        this.password = 'especialista123';
        break;
      case 'paciente':
        this.email = 'paciente@example.com';
        this.password = 'paciente123';
        break;
      default:
        break;
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
        this.alertService.showAlert('Usuario logueado exitosamente', 'success');

        this.router.navigate(['/home']);
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

}
