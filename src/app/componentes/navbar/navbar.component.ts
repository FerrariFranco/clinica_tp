import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../servicios/auth.service'; // Importa tu servicio de autenticación
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  @Input() userRole: string | null = null;
  user: any = null;
  isAdmin: boolean = false; // Variable para verificar si el usuario es admin
  isEspecialista: boolean = false; // Variable para verificar si el usuario es especialista
  isPaciente: boolean = false; // Variable para verificar si el usuario es paciente

  constructor(private authService: AuthService, private router: Router) {
    this.authService.user$.subscribe((user) => {
      this.user = user;

      // Verificar si el usuario tiene rol asignado
      if (user) {
        this.authService.getUserRole().subscribe(role => {
          // Lógica para verificar el rol del usuario
          this.isAdmin = role === 'admin';
          this.isEspecialista = role === 'especialista';  // Ajusta esto según el nombre exacto de tu rol
          this.isPaciente = role === 'paciente';  // Ajusta esto según el nombre exacto de tu rol
        });
      } else {
        // Si no hay usuario, no es admin, especialista ni paciente
        this.isAdmin = false;
        this.isEspecialista = false;
        this.isPaciente = false;
      }
    });
  }

  onLogout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/']);
    });
  }
}
