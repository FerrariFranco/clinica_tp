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
    especialidades: string[] = [];
    especialistas: string[] = [];
    especialidadSeleccionada: string = '';
    especialistaSeleccionado: string = '';
    comentarioCancelacion: string = '';
    filtroTexto: string = '';  // Variable para el texto de filtrado

    // Propiedad para almacenar el turno seleccionado
    turnoSeleccionado: any = null;

    // Controlar la visibilidad del formulario de comentario
    mostrarComentarioForm: boolean = false;
  // Variables para el modal
  mostrarModalHistoria: boolean = false;
  historiaClinicaSeleccionada: any = null;
    constructor(
      private firestore: Firestore,
      private authService: AuthService,
      private router: Router
    ) {}

    ngOnInit(): void {
      this.cargarTurnos();
    }
  // Abrir el modal con la historia clínica
  abrirModalHistoria(turno: any): void {
    this.historiaClinicaSeleccionada = turno.historiaClinica;
    this.mostrarModalHistoria = true;
  }
  cerrarModalHistoriaClinica(): void {
    this.historiaClinicaSeleccionada = null;
    this.mostrarModalHistoria = false;
  }
  // Cerrar el modal
  cerrarModalHistoria(): void {
    this.historiaClinicaSeleccionada = null;
    this.mostrarModalHistoria = false;
  }
  async cargarTurnos(): Promise<void> {
    const turnosPacienteRef = collection(this.firestore, 'turnosPaciente');
    const historiasClinicasRef = collection(this.firestore, 'historiasClinicas');

    try {
      const querySnapshot = await getDocs(turnosPacienteRef);

      if (!querySnapshot.empty) {
        const turnosPromises = querySnapshot.docs.flatMap(async (doc) => {
          const data = doc.data();
          if (data['turnos']) {
            const turnos = Object.values(data['turnos']) as any[];

            return Promise.all(
              turnos.map(async (turno: any) => {
                const nuevoTurno = {
                  ...turno,
                  paciente: data['mailPaciente'],
                  seleccionado: false,
                };

                if (nuevoTurno.estado === 'Finalizado') {
                  const historiasQuery = query(
                    historiasClinicasRef,
                    where('id', '==', nuevoTurno.id)
                  );
                  const historiasSnapshot = await getDocs(historiasQuery);

                  if (!historiasSnapshot.empty) {
                    const historiaClinica = historiasSnapshot.docs[0].data();
                    nuevoTurno.historiaClinica = historiaClinica;
                  }
                }

                return nuevoTurno;
              })
            );
          }
          return [];
        });

        const turnosProcesados = (await Promise.all(turnosPromises)).flat();
        this.turnos = turnosProcesados;
      }
    } catch (error) {
      console.error('Error al cargar los turnos:', error);
    }
  }

  get turnosFiltrados(): any[] {
    return this.turnos.filter(turno => {
      if (this.filtroTexto) {
        const textoHistoria = this.filtrarHistoriaClinica(turno);
        return textoHistoria.includes(this.filtroTexto.toLowerCase());
      }
      return true; // Si no hay texto, devuelve todos los turnos
    });
  }

  filtrarHistoriaClinica(turno: any): string {
    const historiaClinica = turno.historiaClinica || {};

    // Texto de los datos fijos
    let historiaClinicaTexto = Object.values(historiaClinica).join(' ');

    // Verificar si existen datos dinámicos en el lugar correcto
    const datosDinamicos = historiaClinica.datosDinamicos || turno.datosDinamicos || [];

    // Concatenar datos dinámicos si están presentes
    if (Array.isArray(datosDinamicos)) {
      datosDinamicos.forEach((dato: any) => {
        const clave = dato.clave || '';
        const valor = dato.valor || '';
        historiaClinicaTexto += ` ${clave} ${valor}`;
      });
    }

    if (turno.especialista) {
      historiaClinicaTexto += ` ${turno.especialista}`;
    }
    if (turno.especialidad) {
      historiaClinicaTexto += ` ${turno.especialidad}`;
    }
    if (turno.paciente) {
      historiaClinicaTexto += ` ${turno.paciente}`;
    }
    if (turno.estado) {
      historiaClinicaTexto += ` ${turno.estado}`;
    }

    return historiaClinicaTexto.toLowerCase(); // Para facilitar la búsqueda sin importar mayúsculas/minúsculas
  }
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
    async cancelarTurno(turno: any) {
      if (!this.comentarioCancelacion) {
        console.warn('Debe ingresar un comentario para cancelar el turno.');
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
        // Agregar comentario al historial
        await addDoc(comentariosRef, comentario);
    
        // Referencia a la colección de turnos
        const turnosRef = collection(this.firestore, 'turnosPaciente');
        const querySnapshot = await getDocs(turnosRef);
    
        let turnoDocRef = null;
        let turnosActualizados: any[] = [];
    
        querySnapshot.forEach(doc => {
          const data = doc.data();
    
          if (data['turnos'] && Array.isArray(data['turnos'])) {
            // Buscar el turno dentro del arreglo
            const index = data['turnos'].findIndex(t =>
              t.especialista === turno.especialista &&
              t.especialidad === turno.especialidad &&
              t.fecha === turno.fecha &&
              t.hora === turno.hora
            );
    
            if (index !== -1) {
              turnoDocRef = doc.ref;
              // Crear una copia del arreglo actualizando el estado del turno encontrado
              turnosActualizados = [...data['turnos']];
              turnosActualizados[index] = {
                ...turnosActualizados[index],
                estado: 'Cancelado'
              };
            }
          }
        });
    
        if (turnoDocRef) {
          // Actualizar el documento con los turnos modificados
          await updateDoc(turnoDocRef, { turnos: turnosActualizados });
    
          // Recargar la lista de turnos para reflejar los cambios
          this.cargarTurnos();
    
          // Resetear variables del formulario/modal
          this.mostrarComentarioForm = false;
          this.turnoSeleccionado = null;
          this.comentarioCancelacion = ''; // Limpiar el comentario
          console.log('Turno cancelado exitosamente.');
        } else {
          console.error('No se encontró el turno para cancelar.');
        }
      } catch (error) {
        console.error('Error al cancelar el turno:', error);
      }
    }
    
    
    abrirModalComentario(turno: any): void {
      this.turnoSeleccionado = turno;
      this.mostrarComentarioForm = true;
    }
    
    cerrarModalComentario(): void {
      this.mostrarComentarioForm = false;
      this.comentarioCancelacion = ''; // Limpiar el campo
    }
    
  }
