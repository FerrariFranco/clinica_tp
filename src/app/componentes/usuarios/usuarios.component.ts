import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, updateDoc, doc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { RegistroPacientesComponent } from '../registro-pacientes/registro-pacientes.component';
import { RegistroEspecialistasComponent } from '../registro-especialistas/registro-especialistas.component';
import { RegistroComponent } from '../registro/registro.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, RegistroPacientesComponent, RegistroEspecialistasComponent, RegistroComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
})
export class UsuariosComponent implements OnInit {
  especialistasAutorizados: any[] = [];
  especialistasNoAutorizados: any[] = [];
  pacientes: any[] = [];
  loading = true;
  usuarioSeleccionado: any = null; 
  componenteActivo: string | null = null; // Estado para el componente activo

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    this.loadUsers();
  }
  mostrarComponente(componente: string) {
    this.componenteActivo = this.componenteActivo === componente ? null : componente;
  }
  async loadUsers() {
    try {
      const especialistasRef = collection(this.firestore, 'especialistas');
      const especialistasSnapshot = await getDocs(especialistasRef);
      
      this.especialistasAutorizados = especialistasSnapshot.docs
        .filter(doc => doc.data()['autorizado'])
        .map(doc => ({ id: doc.id, ...doc.data() }));
      
      this.especialistasNoAutorizados = especialistasSnapshot.docs
        .filter(doc => !doc.data()['autorizado'])
        .map(doc => ({ id: doc.id, ...doc.data() }));
      
      const pacientesRef = collection(this.firestore, 'pacientes');
      const pacientesSnapshot = await getDocs(pacientesRef);
      this.pacientes = pacientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      this.loading = false;
    }
  }

  async authorizeEspecialista(especialistaId: string) {
    try {
      const especialistaDoc = doc(this.firestore, 'especialistas', especialistaId);
      await updateDoc(especialistaDoc, { autorizado: true });
      
      this.loadUsers();
    } catch (error) {
      console.error('Error al autorizar especialista:', error);
    }
  }

  seleccionarUsuario(usuario: any) {
    this.usuarioSeleccionado = usuario;
  }

  cerrarCard() {
    this.usuarioSeleccionado = null;
  }
}
