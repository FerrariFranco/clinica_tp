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

  constructor(private authService: AuthService, private router: Router) {
    this.authService.user$.subscribe((user) => {
      this.user = user;

      // Verificar si el usuario tiene rol admin
      if (user) {
        this.authService.getUserRole().subscribe(role => {
          this.isAdmin = role === 'admin'; // Ajusta esto según el nombre exacto de tu rol
        });
      } else {
        this.isAdmin = false; // Si no hay usuario, no es admin
      }
    });
  }

  onLogout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/']);
    });
  }
}
