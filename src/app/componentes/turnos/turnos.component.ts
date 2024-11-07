  import { Component, OnInit } from '@angular/core';
  import { Firestore, collection, query, getDocs, updateDoc, addDoc, where } from '@angular/fire/firestore';
  import { Router } from '@angular/router';
  import { Observable } from 'rxjs';
  import { AuthService } from '../../servicios/auth.service';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';

  @Component({
    selector: 'app-turnos',
    templateUrl: './turnos.component.html',
    styleUrls: ['./turnos.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule]
  })
  export class TurnosComponent implements OnInit {
    turnos: any[] = [];
    turnosFiltrados: any[] = [];
    especialidades: string[] = [];
    especialistas: string[] = [];
    especialidadSeleccionada: string = '';
    especialistaSeleccionado: string = '';
    comentarioCancelacion: string = '';
    
    // Propiedad para almacenar el turno seleccionado
    turnoSeleccionado: any = null;

    // Controlar la visibilidad del formulario de comentario
    mostrarComentarioForm: boolean = false;

    constructor(
      private firestore: Firestore,
      private authService: AuthService,
      private router: Router
    ) {}

    ngOnInit(): void {
      this.loadTurnos();
    }

    async loadTurnos() {
      const turnosRef = collection(this.firestore, 'turnosPaciente');
      const q = query(turnosRef);
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        let todosLosTurnos: any[] = [];

        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data['turnos'] && Array.isArray(data['turnos'])) {
            todosLosTurnos = todosLosTurnos.concat(data['turnos']);
          }
        });

        this.turnos = todosLosTurnos;
        this.turnosFiltrados = [...this.turnos];

        this.especialidades = Array.from(new Set(this.turnos.map(turno => turno.especialidad)));
        this.especialistas = Array.from(new Set(this.turnos.map(turno => turno.especialista)));
      }
    }

    // Filtro por especialidad y especialista
    aplicarFiltros() {
      this.turnosFiltrados = this.turnos.filter(turno => {
        const coincideEspecialidad = this.especialidadSeleccionada ? 
          turno.especialidad?.toLowerCase().includes(this.especialidadSeleccionada.toLowerCase()) : true;
          
        const coincideEspecialista = this.especialistaSeleccionado ? 
          turno.especialista?.toLowerCase().includes(this.especialistaSeleccionado.toLowerCase()) : true;

        return coincideEspecialidad && coincideEspecialista;
      });
    }

    // Seleccionar un turno
    seleccionarTurno(turno: any) {
      if (this.turnoSeleccionado === turno) {
        this.turnoSeleccionado = null;  // Desmarcar el turno si ya estaba seleccionado
      } else {
        this.turnoSeleccionado = turno;  // Marcar el turno como seleccionado
        this.mostrarComentarioForm = false; // Resetear el formulario de comentario
      }
    }

    // Verificar si un turno está seleccionado
    esSeleccionado(turno: any): boolean {
      return this.turnoSeleccionado === turno;
    }

    // Cancelar turno
    async cancelarTurno(turno: any) {
      if (!this.comentarioCancelacion) {
        alert('Por favor, ingrese un comentario para cancelar el turno.');
        return;
      }
    
      const comentariosRef = collection(this.firestore, 'comentariosTurnosCancelados');
      const comentario = {
        fechaTurno: turno.fecha,
        especialista: turno.especialista,
        comentario: this.comentarioCancelacion,
        fechaCancelacion: new Date()
      };
    
      try {
        await addDoc(comentariosRef, comentario);
    
        const turnosRef = collection(this.firestore, 'turnosPaciente');
        const querySnapshot = await getDocs(turnosRef);
    
        let turnoEncontrado = null;
    
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data['turnos'] && Array.isArray(data['turnos'])) {
            const turnoBuscado = data['turnos'].find(t => 
              t.especialista === turno.especialista &&
              t.especialidad === turno.especialidad &&
              t.fecha === turno.fecha
            );
    
            if (turnoBuscado) {
              turnoEncontrado = doc.ref;
            }
          }
        });
    
        if (turnoEncontrado) {
          await updateDoc(turnoEncontrado, {
            estado: 'Cancelado'
          });
    
          alert('Turno cancelado correctamente.');
          this.loadTurnos();  // Recargar los turnos
          this.mostrarComentarioForm = false;  // Ocultar el formulario después de cancelar
          this.turnoSeleccionado = null;  // Resetear el turno seleccionado
        } else {
          alert('No se encontró el turno para cancelar.');
        }
      } catch (error) {
        console.error('Error al cancelar el turno: ', error);
        alert('Hubo un problema al cancelar el turno. Intenta de nuevo.');
      }
    }
    
    
  }
