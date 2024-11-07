import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  user: User | null = null;
  userRole: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user$ = this.authService.getCurrentUser();
    const role$ = this.authService.getUserRole();

    combineLatest([user$, role$]).subscribe(async ([user, role]) => {
      this.user = user;
      this.userRole = role;

      if (this.userRole === 'especialista' && this.user) {
        const autorizado = await this.authService.isEspecialistaAutorizado(this.user.email!);
        if (!autorizado) {
          await this.authService.logout();
          alert('Tu cuenta aún no está autorizada. Por favor, revisa tu correo electrónico para verificar tu cuenta.');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  async onLogout() {
    try {
      await this.authService.logout();
      console.log('Sesión cerrada');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
