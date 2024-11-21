import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, updateDoc, doc } from '@angular/fire/firestore';
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
  turnosFiltrados: any[] = [];
  turnoSeleccionado: any = null;

  filtroEspecialidad: string = ''; // Filtro por especialidad
  filtroEspecialista: string = ''; // Filtro por especialista
  filtroHistoriaClinica: string = ''; 

  mostrarCalificar: boolean = false;
  comentario: string = '';
  calificacion: number | null = null;

  constructor(private firestore: Firestore, private authService: AuthService) {}

  ngOnInit(): void {
    this.cargarTurnos();
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
            this.turnosFiltrados = this.turnos
          }
        } catch (error) {
          console.error('Error al cargar los turnos:', error);
        }
      }
    });
  }
  
  
  

  seleccionarTurno(index: number): void {
    this.turnos.forEach((turno) => (turno.seleccionado = false));
    this.turnosFiltrados[index].seleccionado = true;
    this.turnoSeleccionado = this.turnosFiltrados[index];
  }

  filtrarHistoriaClinica(turno: any): string {
    const historiaClinica = turno.historiaClinica || {};
    const historiaClinicaTexto = Object.values(historiaClinica).join(' ');
    return historiaClinicaTexto;
  }

  aplicarFiltros(): void {
    const especialidad = this.filtroEspecialidad.toLowerCase().trim();
    const especialista = this.filtroEspecialista.toLowerCase().trim();
    const historiaClinica = this.filtroHistoriaClinica.toLowerCase().trim();

    this.turnosFiltrados = this.turnos.filter((turno) => {
      const historiaClinicaTexto = this.filtrarHistoriaClinica(turno).toLowerCase();
      return (
        turno.especialidad.toLowerCase().includes(especialidad) &&
        turno.especialista.toLowerCase().includes(especialista) &&
        historiaClinicaTexto.includes(historiaClinica) // Filtro por historia clínica
      );
    });
  }

  mostrarCalificarAtencion(): void {
    this.mostrarCalificar = true;
  }

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
          await this.agregarTurnoAAgenda(mailEspecialista,especialidad ,fecha, hora);
        } else {
          console.warn('No se encontró el turno en la base de datos.');
        }
      } else {
        console.warn('No se encontró el documento del paciente.');
      }
    } catch (error) {
      console.error('Error al cancelar el turno:', error);
    }
  }
  
  
  async agregarTurnoAAgenda(
    mailEspecialista: string,
    especialidad: string,
    fecha: string,
    hora: string
  ): Promise<void> {
    try {
      // Referencia a la colección `agendas`
      const agendasRef = collection(this.firestore, 'agendas');
  
      // Consulta para encontrar el documento de la agenda según el especialista y la especialidad
      const q = query(
        agendasRef,
        where('mailEspecialista', '==', mailEspecialista),
        where('especialidad', '==', especialidad)
      );
  
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const agendaDoc = querySnapshot.docs[0];
        const agendaData = agendaDoc.data();
  
        // Encontrar el índice del mapa con la fecha específica
        const turnos = agendaData['turnos'] || [];
        const fechaIndex = turnos.findIndex((t: any) => t.fecha === fecha);
  
        if (fechaIndex !== -1) {
          // Verificar si el horario ya existe para evitar duplicados
          const horarios = turnos[fechaIndex].horarios;
          if (!horarios.includes(hora)) {
            horarios.push(hora); // Agregar el horario
            horarios.sort(); // Ordenar horarios (opcional)
  
            // Actualizar el documento en Firestore
            const agendaDocRef = doc(this.firestore, 'agendas', agendaDoc.id);
            await updateDoc(agendaDocRef, { turnos });
            console.log(`Horario ${hora} agregado a la fecha ${fecha} en la agenda de ${mailEspecialista} (${especialidad})`);
          } else {
            console.log(`El horario ${hora} ya existe en la fecha ${fecha}`);
          }
        } else {
          console.warn(`No se encontró la fecha ${fecha} en la agenda`);
        }
      } else {
        console.warn(`No se encontró la agenda para el especialista con email ${mailEspecialista} y especialidad ${especialidad}`);
      }
    } catch (error) {
      console.error('Error al agregar el turno a la agenda:', error);
    }
  }
  
}
