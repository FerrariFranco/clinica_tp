import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, Timestamp, addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';
import { AlertService } from '../../servicios/alert.service';
import { RecaptchaDirective } from '../../directivas/recaptcha.directive';  // Importa la directiva

interface Especialista {
  especialidades: never[];
  nombre: string;
  imagenUrl: string;
  apellido: string;
  mail: string;
}
interface Especialidad {
  nombre: string;
  imagen: string;
}

@Component({
  selector: 'app-seleccion-turno',
  standalone: true,
  imports: [CommonModule, FormsModule, RecaptchaDirective],
  templateUrl: './seleccion-turno.component.html',
  styleUrls: ['./seleccion-turno.component.scss']
})
export class SeleccionTurnoComponent implements OnInit {
  especialistasList: Especialista[] = []; 
  especialidadesList: string[] = []; 
  especialidades : Especialidad[] = [];
  especialidadesFiltrada : Especialidad[] = [];
  selectedEspecialista: Especialista | null = null;
  selectedEspecialidad: string | null = null;
  turnosDisponibles: { fecha: string; horarios: string[] }[] = [];
  selectedTurno: any;
  captchaActivo: boolean = false; // Estado del captcha
  captchaValid: boolean = false;
  userEmail: string | null = null;
  user$: Observable<User | null>;
  captchaVisible = true;
  constructor(private firestore: Firestore, private authService: AuthService,
    private alertService: AlertService) {
    this.user$ = this.authService.getCurrentUser();
  }

  async ngOnInit() {
    await this.cargarEspecialistas();
    this.user$.subscribe(user => {
      if (user) {
        this.userEmail = user.email;
      }
    });
    await this.checkCaptchaStatus();

  }
  
  onCaptchaResolved(isResolved: boolean) {
    this.captchaValid = isResolved;
  }
  isEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
  }
  async checkCaptchaStatus() {
    try {
      const captchaRef = doc(this.firestore, 'captcha', 'captcha'); // ID único "captcha"
      const captchaSnapshot = await getDoc(captchaRef);
      if (captchaSnapshot.exists()) {
        const data = captchaSnapshot.data();
        this.captchaActivo = data['activado'] === true; // Verifica si está activado
      }
    } catch (error) {
      console.error('Error al verificar el estado del captcha:', error);
    }
  }
  toggleCaptchaVisibility() {
    this.captchaVisible = !this.captchaVisible;
  }
  async cargarEspecialistas() {
    const especialistasRef = collection(this.firestore, 'especialistas');
    const snapshot = await getDocs(especialistasRef);
    this.especialistasList = snapshot.docs.map(doc => doc.data() as Especialista);
  }

  async onEspecialistaSelect(especialista: Especialista) {
    this.selectedEspecialista = especialista;
  
    if (!especialista.especialidades || !Array.isArray(especialista.especialidades)) {
      console.error('El especialista no tiene un atributo "especialidades" válido.');
      this.especialidadesFiltrada = [];
      return;
    }
  
    const especialidadesRef = collection(this.firestore, 'especialidades');
    const snapshot = await getDocs(especialidadesRef);
  
    const especialidadesDisponibles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as { id: string; nombre: string; imagen: string }[];
  
    this.especialidadesFiltrada = especialidadesDisponibles.filter(especialidad => 
      especialista.especialidades.some(especialidadNombre => especialidadNombre === especialidad.nombre)
    );
  }
  async onEspecialidadSelect(especialidad: string) {
    this.selectedEspecialidad = especialidad;
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
  
    const hoy = new Date();
    const fechaMaxima = new Date();
    fechaMaxima.setDate(hoy.getDate() + 15);
  
    snapshot.docs.forEach(doc => {
      const agendaData = doc.data();
      if (agendaData['turnos'] && Array.isArray(agendaData['turnos'])) {
        agendaData['turnos'].forEach((turno: any) => {
          const fechaTurno = new Date(turno.fecha);
          
          if (fechaTurno >= hoy && fechaTurno <= fechaMaxima) {
            this.turnosDisponibles.push({
              fecha: turno.fecha, 
              horarios: turno.horarios || [] 
            });
          }
        });
      }
    });
  }
  
  
  selectTurno(turno: { fecha: string; horarios: string[] }) {
    this.selectedTurno = turno;
    console.log('Turno seleccionado: ', turno);
  }
  
  selectTurnoHora(hora: string) {
    if (this.selectedTurno) {
      this.selectedTurno.hora = hora;
      console.log('Horario seleccionado: ', hora);
    }
  }
  generateId(): string {
    const timestamp = Date.now().toString(36); 
    const randomString = Math.random().toString(36).substring(2, 15); 
    return `${timestamp}-${randomString}`;
  }
  
  async onSolicitarTurno() {
    if (!this.selectedTurno || !this.selectedEspecialista || !this.selectedEspecialidad) {
      this.alertService.showAlert("Por favor, seleccione un turno antes de solicitar." ,"error");
      return;
    }
  
    try {
      const agendaRef = collection(this.firestore, 'agendas');
      console.log("1")
      const q = query(
        agendaRef,
        where('mailEspecialista', '==', this.selectedEspecialista.mail),
        where('especialidad', '==', this.selectedEspecialidad)
        
      );
      console.log("2")
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        console.log("No se encontró la agenda del especialista.");
        return;
      }
      console.log("3")
      const agendaDoc = snapshot.docs[0];
      const agendaData = agendaDoc.data();
      console.log("4")
      const turnosActualizados = agendaData['turnos'].map((turno: any) => {
        if (turno.fecha === this.selectedTurno?.fecha) {
          turno.horarios = turno.horarios.filter((hora: string) => hora !== this.selectedTurno?.hora);
        }
        return turno;
      });
      console.log("5")
      const turnosRestantes = turnosActualizados.filter((turno: { horarios: string | any[]; }) => turno.horarios.length > 0);
      console.log("6")
      if (turnosRestantes.length > 0) {
        const agendaDocRef = doc(this.firestore, 'agendas', agendaDoc.id);
        await updateDoc(agendaDocRef, { turnos: turnosRestantes });
      } else {
        console.log("No hay más horarios disponibles para esta fecha.");
      }
      console.log("7")
      const turnoId = this.generateId();
  
      const nuevoTurno = {
        id: turnoId, 
        especialista: `${this.selectedEspecialista.nombre} ${this.selectedEspecialista.apellido}`,
        especialidad: this.selectedEspecialidad,
        mailEspecialista: this.selectedEspecialista.mail,
        estado: 'Solicitado',
        fecha: this.selectedTurno.fecha,
        hora: this.selectedTurno.hora,
      };
  
      const turnosPacienteRef = collection(this.firestore, 'turnosPaciente');
      const pacienteQuery = query(turnosPacienteRef, where('mailPaciente', '==', this.userEmail));
      const pacienteSnapshot = await getDocs(pacienteQuery);
  
      if (pacienteSnapshot.empty) {
        await addDoc(turnosPacienteRef, {
          mailPaciente: this.userEmail,
          turnos: [nuevoTurno]
        });
        this.alertService.showAlert("Turno Solicitado","success" );
      } else {
        const pacienteDoc = pacienteSnapshot.docs[0];
        const turnosExistentes = pacienteDoc.data()['turnos'] || [];
        turnosExistentes.push(nuevoTurno);
  
        const pacienteDocRef = doc(this.firestore, 'turnosPaciente', pacienteDoc.id);
        await updateDoc(pacienteDocRef, { turnos: turnosExistentes });
        this.alertService.showAlert("Turno Solicitado","success" );

      }
  
      await this.obtenerTurnosDisponibles();
  
    } catch (error) {
      console.error("Error al solicitar el turno:", error);
    }
  }
  
  }
  