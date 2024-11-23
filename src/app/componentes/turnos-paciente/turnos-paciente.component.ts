import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, updateDoc, doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-turnos-paciente',
  templateUrl: './turnos-paciente.component.html',
  styleUrls: ['./turnos-paciente.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})

export class TurnosPacienteComponent implements OnInit {
  turnos: any[] = [];
  turnoSeleccionado: any = null;
  mostrarCalificar = false; // Controla si el modal de calificación se muestra
  mostrarModalCancelar = false;
  historiasClinicas: any[] = [];  // Para almacenar todas las historias clínicas del paciente
  historiaClinicaSeleccionada: any = null;
  mostrarHistoriaClinica = false;

  turnoACalificar: any = null;
  turnoACancelar: any = null;
  filtroTexto: string = ''; // Filtro de texto único para todo

  comentario: string = '';
  calificacion: number | null = null;

  constructor(private firestore: Firestore, private authService: AuthService) {}

  ngOnInit(): void {
    this.cargarTurnos();
    this.cargarHistoriasClinicas();
  }

  get turnosFiltrados(): any[] {
    return this.turnos.filter(turno => {
      if (this.filtroTexto) {
        const textoHistoria = this.filtrarHistoriaClinica(turno);
        return textoHistoria.includes(this.filtroTexto.toLowerCase());
      }
      return true; // Si no hay filtro, incluye todos los turnos
    });
  }
 // Mostrar modal para calificar la atención
 async cargarHistoriasClinicas(): Promise<void> {
  this.authService.getCurrentUser().subscribe(async (user) => {
    if (user) {
      const mailPaciente = user.email;  // Obtenemos el email del paciente
      const historiasClinicasRef = collection(this.firestore, 'historiasClinicas');
      const historiasQuery = query(
        historiasClinicasRef,
        where('mailPaciente', '==', mailPaciente)  // Filtrar por mailPaciente
      );

      try {
        const querySnapshot = await getDocs(historiasQuery);
        if (!querySnapshot.empty) {
          this.historiasClinicas = querySnapshot.docs.map(doc => doc.data());
          console.log('Historias clínicas cargadas:', this.historiasClinicas);
        } else {
          console.log('No se encontraron historias clínicas para este paciente.');
        }
      } catch (error) {
        console.error('Error al cargar las historias clínicas:', error);
      }
    }
  });
}
cerrarModalHistoriaClinica(): void {
  this.mostrarHistoriaClinica = false;
}
// Método para abrir el modal con la historia clínica del turno seleccionado
// Método para abrir el modal con la historia clínica del turno seleccionado
mostrarHistoria(turno: any): void {
  console.log('Turno seleccionado:', turno); // Verifica si el turno está correcto
  if (turno.estado === 'Finalizado') {
    const historia = this.historiasClinicas.find(hc => hc.id === turno.id);
    console.log('Historia clínica encontrada:', historia); // Verifica si la historia es encontrada
    if (historia) {
      this.historiaClinicaSeleccionada = historia;
      this.mostrarHistoriaClinica = true; // Activa el modal
    } else {
      console.log('No se encontró historia clínica para el turno seleccionado.');
    }
  } else {
    console.log('El turno no está finalizado.');
  }
}


 
 abrirModalCancelarTurno(turno: any): void {
  this.turnoACancelar = turno;
  this.mostrarModalCancelar = true;
}

// Cerrar el modal de cancelación
cerrarModalCancelar(): void {
  this.mostrarModalCancelar = false;
}
// Cerrar el modal de calificación
cerrarModalCalificar(): void {
  this.mostrarCalificar = false;
}
  async cargarTurnos(): Promise<void> {
    this.authService.getCurrentUser().subscribe(async (user) => {
      if (user) {
        const mailPaciente = user.email; // Obtenemos el mail del paciente
        const turnosPacienteRef = collection(this.firestore, 'turnosPaciente');
        const historiasClinicasRef = collection(this.firestore, 'historiasClinicas');

        try {
          const querySnapshot = await getDocs(turnosPacienteRef); // Obtenemos todos los documentos de turnosPaciente

          if (!querySnapshot.empty) {
            for (const doc of querySnapshot.docs) {
              const data = doc.data();
              const mailPacienteDoc = data['mailPaciente']; // Obtenemos el mailPaciente del documento

              // Verificar si el mailPaciente coincide con el usuario actual
              if (mailPacienteDoc === mailPaciente && data['turnos']) {
                // Si el mailPaciente coincide, procesamos los turnos
                for (const turno of Object.values(data['turnos']) as any[]) {
                  const nuevoTurno = {
                    ...(turno as any),
                    paciente: mailPacienteDoc,
                    seleccionado: false,
                  };

                  // Consultamos la historia clínica solo si el turno tiene un id
                  if (nuevoTurno.id) {
                    const historiasQuery = query(
                      historiasClinicasRef,
                      where('id', '==', nuevoTurno.id) // Buscar por el id del turno
                    );
                    const historiasSnapshot = await getDocs(historiasQuery);

                    // Si la historia clínica existe, la agregamos al turno
                    if (!historiasSnapshot.empty) {
                      const historiaClinica = historiasSnapshot.docs[0].data();
                      nuevoTurno.historiaClinica = historiaClinica; // Asignar historia clínica
                    }

                    // Agregar el turno a la lista de turnos
                    this.turnos.push(nuevoTurno);
                  }
                }
              }
            }

            // Filtrar los turnos que tienen historias clínicas
          }
        } catch (error) {
          console.error('Error al cargar los turnos:', error);
        }
      }
    });
  }


  filtrarHistoriaClinica(turno: any): string {
    const historiaClinica = turno.historiaClinica || {};
  
    // Concatenar campos fijos de la historia clínica
    let historiaClinicaTexto = Object.values(historiaClinica).join(' ');
  
    // Agregar datos dinámicos si existen
    const datosDinamicos = historiaClinica.datosDinamicos || turno.datosDinamicos || [];
    if (Array.isArray(datosDinamicos)) {
      datosDinamicos.forEach((dato: any) => {
        const clave = dato.clave || '';
        const valor = dato.valor || '';
        historiaClinicaTexto += ` ${clave} ${valor}`;
      });
    }
  
    // Agregar datos del turno
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
    if (turno.fecha) {
      historiaClinicaTexto += ` ${turno.fecha}`;
    }
  
    // Devuelve todo el texto concatenado en minúsculas para evitar problemas de mayúsculas/minúsculas
    return historiaClinicaTexto.toLowerCase();
  }
  

  // Seleccionar un turno
  seleccionarTurno(turno: any): void {
    this.turnos.forEach((turno) => (turno.seleccionado = false));
    turno.seleccionado = true;
    this.turnoSeleccionado = turno;
  }

  // Mostrar formulario para calificar la atención
  mostrarCalificarAtencion(turno: any): void {
    this.turnoACalificar = turno;
    this.mostrarCalificar = true;
  }
  // Guardar la calificación y comentario del paciente
  guardarCalificacion(): void {
    if (!this.turnoSeleccionado || this.calificacion === null || !this.comentario.trim()) {
      console.warn('Faltan datos para guardar la calificación.');
      return;
    }

    const turnoId = this.turnoSeleccionado.id;

    this.authService.getCurrentUser().subscribe((user) => {
      if (user) {
        const mailPaciente = user.email;
        const turnosPacienteQuery = query(
          collection(this.firestore, 'turnosPaciente'),
          where('mailPaciente', '==', mailPaciente)
        );

        getDocs(turnosPacienteQuery).then((querySnapshot) => {
          if (!querySnapshot.empty) {
            const pacienteDoc = querySnapshot.docs[0];
            const pacienteDocRef = doc(this.firestore, 'turnosPaciente', pacienteDoc.id);
            const turnos = pacienteDoc.data()['turnos'] || [];

            const turnoIndex = turnos.findIndex((t: any) => t.id === turnoId);
            if (turnoIndex !== -1) {
              turnos[turnoIndex].comentario = this.comentario;
              turnos[turnoIndex].calificacion = this.calificacion;

              updateDoc(pacienteDocRef, { turnos }).then(() => {
                this.turnoSeleccionado.comentario = this.comentario;
                this.turnoSeleccionado.calificacion = this.calificacion;
                console.log(`Comentario y calificación guardados: ${this.comentario}, ${this.calificacion}`);
                this.mostrarCalificar = false;
              }).catch((error) => {
                console.error('Error al actualizar los turnos en Firestore:', error);
              });
            } else {
              console.warn('No se encontró el turno seleccionado.');
            }
          } else {
            console.warn('No se encontraron turnos para el paciente.');
          }
        }).catch((error) => {
          console.error('Error al obtener los turnos del paciente:', error);
        });
      } else {
        console.error('No se pudo obtener el usuario autenticado.');
      }
    });
  }
  
  // Función para cancelar el turno seleccionado
  async cancelarTurnoSeleccionado(): Promise<void> {
    if (!this.turnoSeleccionado) {
      console.warn('No hay un turno seleccionado para cancelar.');
      return;
    }

    const turno = this.turnoSeleccionado;

    try {
      const mailEspecialista = turno.mailEspecialista;
      const fecha = turno.fecha;
      const especialidad = turno.especialidad;
      const hora = turno.hora;

      // Cambiar el estado del turno a "Cancelado" en la colección `turnosPaciente`
      const turnosPacienteQuery = query(
        collection(this.firestore, 'turnosPaciente'),
        where('mailPaciente', '==', turno.paciente)
      );

      const querySnapshot = await getDocs(turnosPacienteQuery);
      if (!querySnapshot.empty) {
        const pacienteDoc = querySnapshot.docs[0];
        const pacienteDocRef = doc(this.firestore, 'turnosPaciente', pacienteDoc.id);
        const turnos = pacienteDoc.data()['turnos'] || [];

        const turnoIndex = turnos.findIndex((t: any) => t.id === turno.id);
        if (turnoIndex !== -1) {
          turnos[turnoIndex].estado = 'Cancelado';
          await updateDoc(pacienteDocRef, { turnos });

          // Actualizar el estado en la vista
          this.turnoSeleccionado.estado = 'Cancelado';

          console.log(`Turno con ID ${turno.id} cancelado.`);

          // Devolver el turno a la agenda del especialista
          await this.agregarTurnoAAgenda(mailEspecialista, especialidad, fecha, hora);
        } else {
          console.warn('No se encontró el turno en la lista de turnos.');
        }
      } else {
        console.warn('No se encontró el turno en los turnos del paciente.');
      }
    } catch (error) {
      console.error('Error al cancelar el turno:', error);
    }
  }

  // Función para agregar el turno cancelado nuevamente a la agenda del especialista
  async agregarTurnoAAgenda(mailEspecialista: string, especialidad: string, fecha: string, hora: string): Promise<void> {
    const especialistaDocRef = doc(this.firestore, 'agendaEspecialista', mailEspecialista);
    const agendaDoc = await getDoc(especialistaDocRef);
    const turnosAgenda = agendaDoc.exists() ? agendaDoc.data()['turnos'] : [];

    turnosAgenda.push({
      especialidad,
      fecha,
      hora,
      estado: 'Disponible',
    });

    await updateDoc(especialistaDocRef, { turnos: turnosAgenda });
  }
}
