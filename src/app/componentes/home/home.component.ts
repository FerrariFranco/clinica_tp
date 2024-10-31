import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  user: User | null = null;
  userRole: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Obtener el usuario autenticado y su rol simultáneamente
    const user$ = this.authService.getCurrentUser();
    const role$ = this.authService.getUserRole();

    combineLatest([user$, role$]).subscribe(([user, role]) => {
      this.user = user;
      this.userRole = role;
    });
  }

  async onLogout() {
    try {
      await this.authService.logout();
      console.log('Sesión cerrada');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
