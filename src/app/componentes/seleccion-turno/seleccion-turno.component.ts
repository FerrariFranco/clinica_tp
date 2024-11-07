import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, addDoc, collection, doc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';

interface Especialista {
  nombre: string;
  apellido: string;
  mail: string;
}

@Component({
  selector: 'app-seleccion-turno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seleccion-turno.component.html',
  styleUrls: ['./seleccion-turno.component.scss']
})
export class SeleccionTurnoComponent implements OnInit {
  especialidadesList: string[] = [];
  especialistasAutorizados: Especialista[] = [];
  selectedEspecialidad: string | null = null;
  selectedEspecialista: Especialista | null = null;
  turnosDisponibles: { fecha: string; hora: string }[] = [];
  selectedTurno: { fecha: string; hora: string } | null = null;
  
  userEmail: string | null = null;  // Cambiado a string | null
  user$: Observable<User | null>;
  constructor(private firestore: Firestore, private authService:AuthService) {this.user$ = this.authService.getCurrentUser();}


async ngOnInit() {
  await this.cargarEspecialidades();
  this.user$.subscribe(user => {
    if (user) {
        this.userEmail = user.email; // Guardamos el email del usuario logueado
    }
});
}

  isEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
  }
  
  async cargarEspecialidades() {
    const especialidadesRef = collection(this.firestore, 'especialidades');
    const snapshot = await getDocs(especialidadesRef);
    this.especialidadesList = snapshot.docs.map(doc => doc.data()['nombre']);
  }

  async onEspecialidadSelect(especialidad: string) {
    this.selectedEspecialidad = especialidad;
    const especialistasRef = collection(this.firestore, 'especialistas');
    const q = query(especialistasRef, where('especialidades', 'array-contains', especialidad), where('autorizado', '==', true));
    const snapshot = await getDocs(q);
    this.especialistasAutorizados = snapshot.docs.map(doc => doc.data() as Especialista);
  }

  async onEspecialistaSelect(especialista: Especialista) {
    this.selectedEspecialista = especialista;
    await this.obtenerTurnosDisponibles();
  }

  async obtenerTurnosDisponibles() {
    if (!this.selectedEspecialista || !this.selectedEspecialidad) return;
    const agendaRef = collection(this.firestore, 'agendas');
    const q = query(
      agendaRef,
      where('mailEspecialista', '==', this.selectedEspecialista.mail),
      where('especialidad', '==', this.selectedEspecialidad)
    );
    
    const snapshot = await getDocs(q);
    this.turnosDisponibles = [];
    
    // Obtenemos la fecha actual y calculamos la fecha máxima permitida
    const hoy = new Date();
    const fechaMaxima = new Date();
    fechaMaxima.setDate(hoy.getDate() + 15);

    snapshot.docs.forEach(doc => {
      const agendaData = doc.data();
      if (agendaData['turnos'] && Array.isArray(agendaData['turnos'])) {
        const turnosDisponibles = agendaData['turnos']
          .filter((turno: any) => {
            const fechaTurno = turno.fecha.toDate();
            return turno.estado === "disponible" &&
                   fechaTurno >= hoy &&
                   fechaTurno <= fechaMaxima;
          })
          .map((turno: any) => ({
            fecha: turno.fecha.toDate().toLocaleString('es-ES'), 
            hora: turno.hora
          }));
          
        this.turnosDisponibles.push(...turnosDisponibles);
      }
    });
}


  selectTurno(turno: { fecha: string; hora: string }) {
    this.selectedTurno = turno;
  }

  async onSolicitarTurno() {
    if (!this.selectedTurno || !this.selectedEspecialista || !this.selectedEspecialidad) {
      console.log("Por favor, seleccione un turno antes de solicitar.");
      return;
    }
  
    try {
      // Buscar la agenda del especialista en la colección 'agendas'
      const agendaRef = collection(this.firestore, 'agendas');
      const q = query(
        agendaRef,
        where('mailEspecialista', '==', this.selectedEspecialista.mail),
        where('especialidad', '==', this.selectedEspecialidad)
      );
  
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        console.log("No se encontró la agenda del especialista.");
        return;
      }
  
      const agendaDoc = snapshot.docs[0]; // Se asume un solo documento de agenda por especialista y especialidad
      const agendaData = agendaDoc.data();
  
      // Eliminar el turno seleccionado de la lista de turnos en 'agendas'
      const turnosActualizados = agendaData['turnos'].filter((turno: any) => {
        return !(turno.fecha.toDate().toLocaleString('es-ES') === this.selectedTurno?.fecha && turno.hora === this.selectedTurno?.hora);
      });
  
      // Actualizar el documento de agenda eliminando el turno solicitado
      const agendaDocRef = doc(this.firestore, 'agendas', agendaDoc.id);
      await updateDoc(agendaDocRef, { turnos: turnosActualizados });
      console.log("Turno eliminado de 'agendas':", this.selectedTurno);
  
      // Crear el nuevo turno en la colección 'turnosPaciente'
      const turnosPacienteRef = collection(this.firestore, 'turnosPaciente');
      const pacienteQuery = query(turnosPacienteRef, where('mailPaciente', '==', this.userEmail));
      const pacienteSnapshot = await getDocs(pacienteQuery);
  
      const nuevoTurno = {
        especialista: `${this.selectedEspecialista.nombre} ${this.selectedEspecialista.apellido}`,
        especialidad: this.selectedEspecialidad,
        estado: 'Solicitado',
        fecha: this.selectedTurno.fecha,
      };
  
      if (pacienteSnapshot.empty) {
        // Si no existe un documento para el paciente, crear uno nuevo
        await addDoc(turnosPacienteRef, {
          mailPaciente: this.userEmail,
          turnos: [nuevoTurno]
        });
        console.log("Nuevo documento creado en 'turnosPaciente' con el turno solicitado.");
      } else {
        // Si ya existe un documento para el paciente, agregar el turno al array
        const pacienteDoc = pacienteSnapshot.docs[0];
        const turnosExistentes = pacienteDoc.data()['turnos'] || [];
        turnosExistentes.push(nuevoTurno);
  
        const pacienteDocRef = doc(this.firestore, 'turnosPaciente', pacienteDoc.id);
        await updateDoc(pacienteDocRef, { turnos: turnosExistentes });
        console.log("Turno agregado al documento existente en 'turnosPaciente'.");
      }
  
      await this.obtenerTurnosDisponibles();  // Recargar los turnos disponibles
  
    } catch (error) {
      console.error("Error al solicitar el turno:", error);
    }
  }
  
  }
  