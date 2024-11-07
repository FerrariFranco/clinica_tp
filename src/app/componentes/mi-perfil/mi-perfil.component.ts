import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';  // Importa Router
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mi-perfil',
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.scss'],
  standalone:true,
  imports:[CommonModule]
})
export class MiPerfilComponent implements OnInit {
  especialista: any = null;
  paciente: any = null;
  userEmail: string | null = null;
  userRole: string | null = null;
  user$: Observable<User | null>;

  constructor(
    private authService: AuthService,
    private firestore: Firestore,
    private router: Router  // Inyecta Router
  ) {
    this.user$ = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.authService.getUserRole().subscribe(role => {
      this.userRole = role;
      if (role) {
        this.user$.subscribe(user => {
          if (user) {
            this.userEmail = user.email;
            if (role === 'especialista') {
              this.loadEspecialista(this.userEmail);
            } else if (role === 'paciente') {
              this.loadPaciente(this.userEmail);
            }
          }
        });
      } else {
        console.error("Rol no encontrado para el usuario.");
      }
    });
  }

  async loadEspecialista(email: string | null) {
    if (!email) {
      console.error("El email del usuario es null");
      return;
    }

    const especialistasRef = collection(this.firestore, 'especialistas');
    const q = query(especialistasRef, where('mail', '==', email));
    const especialistasSnapshot = await getDocs(q);

    if (!especialistasSnapshot.empty) {
      this.especialista = especialistasSnapshot.docs[0].data();
    } else {
      console.error("No se encontró el especialista con el email proporcionado");
    }
  }

  async loadPaciente(email: string | null) {
    if (!email) {
      console.error("El email del usuario es null");
      return;
    }

    const pacientesRef = collection(this.firestore, 'pacientes');
    const q = query(pacientesRef, where('mail', '==', email));
    const pacientesSnapshot = await getDocs(q);

    if (!pacientesSnapshot.empty) {
      this.paciente = pacientesSnapshot.docs[0].data();
    } else {
      console.error("No se encontró el paciente con el email proporcionado");
    }
  }

  verMisHorarios() {
    this.router.navigate(['/horarios']);  // Navega a la ruta /horarios
  }
}
