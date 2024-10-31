import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { RegistroPacientesComponent } from '../registro-pacientes/registro-pacientes.component';
import { RegistroEspecialistasComponent } from '../registro-especialistas/registro-especialistas.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, RegistroPacientesComponent, RegistroEspecialistasComponent], // Agrega los componentes de registro aquí
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
})
export class UsuariosComponent implements OnInit {
  especialistas: any[] = [];
  pacientes: any[] = [];
  loading = true;

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    try {
      const especialistasRef = collection(this.firestore, 'especialistas');
      const especialistasSnapshot = await getDocs(especialistasRef);
      this.especialistas = especialistasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const pacientesRef = collection(this.firestore, 'pacientes');
      const pacientesSnapshot = await getDocs(pacientesRef);
      this.pacientes = pacientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log('Especialistas:', this.especialistas);
      console.log('Pacientes:', this.pacientes);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      this.loading = false;
    }
  }
}
