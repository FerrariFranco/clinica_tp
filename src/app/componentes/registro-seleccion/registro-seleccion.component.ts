import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroPacientesComponent } from '../registro-pacientes/registro-pacientes.component';
import { RegistroEspecialistasComponent } from '../registro-especialistas/registro-especialistas.component';

@Component({
  selector: 'app-registro-seleccion',
  standalone: true,
  imports: [CommonModule, RegistroPacientesComponent, RegistroEspecialistasComponent],
  templateUrl: './registro-seleccion.component.html',
  styleUrls: ['./registro-seleccion.component.scss'],
})
export class RegistroSeleccionComponent {
  componenteActivo: string | null = null;

  mostrarComponente(componente: string) {
    this.componenteActivo = componente; // Asignamos el componente seleccionado
  }
}
