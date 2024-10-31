import { Component } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpinnerComponent } from '../spinner/spinner.component';

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

  constructor(private authService: AuthService, private router: Router) {}

  async onLogin() {
    this.loading = true;
    try {
      await this.authService.login(this.email, this.password);
      console.log('Usuario logueado exitosamente');
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    } finally {
      this.loading = false;
    }
  }

  fillCredentials(role: string) {
    if (role === 'admin') {
      this.email = 'admin@gmail.com';
      this.password = 'Prueba123';
    } else if (role === 'especialista') {
      this.email = 'especialista@gmail.com';
      this.password = 'Prueba123';
    } else if (role === 'paciente') {
      this.email = 'paciente@gmail.com';
      this.password = 'Prueba123';
    }
  }
}
