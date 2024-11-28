import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, updateDoc, doc, Timestamp, addDoc, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecaptchaDirective } from '../../directivas/recaptcha.directive';
interface Turno {
  id: string;
  mailEspecialista: string;
  paciente: string;
  estado: string;
  fecha: string;
  hora: string;
  datosDinamicos?: { clave: string; valor: string }[];
  historiaClinica?: any; // Cambia "any" si sabes la estructura exacta
}
@Component({
  selector: 'app-turnos-especialista',
  templateUrl: './turnos-especialista.component.html',
  styleUrls: ['./turnos-especialista.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RecaptchaDirective]
})
export class TurnosEspecialistaComponent implements OnInit {
  turnos: any[] = [];
  turnoSeleccionado: any = null;
  mostrarResena: boolean = false;
  resena: string = '';
  historiaClinicaSeleccionada: any = null;
  filtroTexto: string = ''; // Filtro por texto en historia clínica
  modalVisible = false;
  mostrarModalHistoriaClinica: boolean = false;
  claveRango: string = '';
  rango: number = 0;
  claveValor: string = '';
  valor: number | null = null;
  claveSwitch: string = '';
  switch: boolean = false;
  captchaActivado: boolean = false; 
  captchaResuelto: boolean = false; // Si el CAPTCHA ha sido resuelto

  constructor(private firestore: Firestore, private authService: AuthService) {}

  ngOnInit(): void {
    this.cargarTurnos();
    this.verificarEstadoCaptcha(); 


  }

  async verificarEstadoCaptcha() {
    try {
      const captchaRef = doc(this.firestore, 'captcha', 'captcha');
      const docSnap = await getDoc(captchaRef);

      if (docSnap.exists()) {
        this.captchaActivado = !!docSnap.data()['activado'];
        console.log(`Captcha activado: ${this.captchaActivado}`);
      } else {
        console.log('No se encontró el documento del captcha.');
      }
    } catch (error) {
      console.log('Error al verificar el estado del captcha:', error);
    }
  }

  resolverCaptcha(resuelto: boolean) {
    this.captchaResuelto = resuelto;
    console.log(`Captcha resuelto: ${this.captchaResuelto}`);
  }


  
  get turnosFiltrados() {
    return this.turnos.filter(turno => {
      if (this.filtroTexto) {
        const textoHistoria = this.filtrarHistoriaClinica(turno);
        return textoHistoria.includes(this.filtroTexto.toLowerCase());
      }
      return true;
    });
  }
  
  mostrarHistoriaClinicaModal() {
    this.mostrarModalHistoriaClinica = true;
  }
  
  // Método para cerrar el modal
  cerrarModalHistoriaClinica() {
    this.mostrarModalHistoriaClinica = false;
  }
  abrirModal(turno: any) {
    this.turnoSeleccionado = turno;
    if (!this.turnoSeleccionado.datosDinamicos) {
      this.turnoSeleccionado.datosDinamicos = [];
    }
    this.modalVisible = true;
  }
  
  cerrarModal() {
    this.modalVisible = false;
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
  
    // También concatenar información adicional del turno, como especialista, especialidad, etc.
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
  
    // Puedes seguir agregando más campos si lo necesitas:
    // if (turno.otraPropiedad) {
    //   historiaClinicaTexto += ` ${turno.otraPropiedad}`;
    // }
  
    return historiaClinicaTexto.toLowerCase(); // Para facilitar la búsqueda sin importar mayúsculas/minúsculas
  }
  
  
  seleccionarTurno(index: number): void {
    // Encuentra el turno seleccionado basado en la lista filtrada
    const turnoFiltrado = this.turnosFiltrados[index];
  
    // Reinicia la selección de todos los turnos
    this.turnos.forEach(turno => turno.seleccionado = false);
  
    // Encuentra el turno original en `this.turnos`
    const turnoOriginal = this.turnos.find(turno => turno === turnoFiltrado);
    if (!turnoOriginal) {
      return; // Si no se encuentra el turno original, no hace nada
    }
  
    // Marca el turno como seleccionado
    turnoOriginal.seleccionado = true;
    this.turnoSeleccionado = turnoOriginal;
  
    // Asegúrate de inicializar `datosDinamicos` si no existe
    if (!this.turnoSeleccionado.datosDinamicos) {
      this.turnoSeleccionado.datosDinamicos = [];
    }
  
    // Configura la historia clínica seleccionada
    if (this.turnoSeleccionado.historiaClinica) {
      this.historiaClinicaSeleccionada = this.turnoSeleccionado.historiaClinica;
      console.log(this.historiaClinicaSeleccionada)
    } else {
      this.historiaClinicaSeleccionada = null;
    }
  
    // Reinicia el estado de la reseña
    this.mostrarResena = false;
    this.resena = '';
  }
  
  agregarDatoDinamico(): void {
    if (this.turnoSeleccionado.datosDinamicos.length < 3) {
      this.turnoSeleccionado.datosDinamicos.push({ clave: '', valor: '' });
    }
  }

  async cargarTurnos(): Promise<void> {
    this.authService.getCurrentUser().subscribe(async (user) => {
      if (user) {
        const mailEspecialista = user.email;
        const turnosPacienteRef = collection(this.firestore, 'turnosPaciente');
        
        try {
          const querySnapshot = await getDocs(turnosPacienteRef);
          const historiasClinicasRef = collection(this.firestore, 'historiasClinicas');

          if (!querySnapshot.empty) {
            querySnapshot.forEach(async (doc) => {
              const data = doc.data();
              if (data['turnos']) {
                for (const turno of Object.values(data['turnos']) as any[]) {
                  if ((turno as any)['mailEspecialista'] === mailEspecialista) {
                    const nuevoTurno = {
                      ...(turno as any),
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

                    this.turnos.push(nuevoTurno);
                  }
                }
              }
            });
          }
        } catch (error) {
          console.error('Error al cargar los turnos:', error);
        }
      }
    });
  }

  finalizarTurno(): void {
    this.mostrarResena = true;
  }

  async guardarResenaYFinalizar(): Promise<void> {
    if (!this.turnoSeleccionado || !this.resena) {
      console.warn('No hay turno seleccionado o la reseña está vacía.');
      return;
    }

    const mailPaciente = this.turnoSeleccionado.paciente;
    if (!mailPaciente) {
      console.error('El mail del paciente es indefinido.');
      return;
    }

    const turnoId = this.turnoSeleccionado.id;
    const turnosPacienteQuery = query(
      collection(this.firestore, 'turnosPaciente'),
      where('mailPaciente', '==', mailPaciente)
    );

    try {
      const querySnapshot = await getDocs(turnosPacienteQuery);

      if (!querySnapshot.empty) {
        const pacienteDoc = querySnapshot.docs[0];
        const pacienteDocRef = doc(this.firestore, 'turnosPaciente', pacienteDoc.id);
        const turnos = pacienteDoc.data()['turnos'] || [];

        const turnoIndex = turnos.findIndex((t: any) => t.id === turnoId);
        if (turnoIndex !== -1) {
          turnos[turnoIndex].review = this.resena; 
          turnos[turnoIndex].estado = 'Finalizado'; 
          await updateDoc(pacienteDocRef, { turnos });

          this.turnoSeleccionado.review = this.resena;
          this.turnoSeleccionado.estado = 'Finalizado';
          this.turnos[turnoIndex].estado = 'Finalizado';
          this.mostrarResena = false;
          await this.guardarHistoriaClinica();
          console.log('Reseña guardada y turno finalizado.');
        } else {
          console.warn('No se encontró el turno en la lista.');
        }
      } else {
        console.warn('No se encontró un documento para este paciente.');
      }
    } catch (error) {
      console.error('Error al guardar la reseña y finalizar el turno:', error);
    }
  }

  async cambiarEstado(nuevoEstado: string): Promise<void> {
    if (!this.turnoSeleccionado) {
      console.warn('No hay un turno seleccionado.');
      return;
    }
  
    const mailPaciente = this.turnoSeleccionado.paciente;
    const mailEspecialista = this.turnoSeleccionado.mailEspecialista;
    const fecha = this.turnoSeleccionado.fecha;
    const hora = this.turnoSeleccionado.hora;
  
    if (!mailPaciente || !mailEspecialista || !fecha || !hora) {
      console.error('Faltan datos necesarios para cambiar el estado del turno.');
      return;
    }
  
    const turnoId = this.turnoSeleccionado.id;
    const turnosPacienteQuery = query(
      collection(this.firestore, 'turnosPaciente'),
      where('mailPaciente', '==', mailPaciente)
    );
  
    try {
      const querySnapshot = await getDocs(turnosPacienteQuery);
  
      if (!querySnapshot.empty) {
        const pacienteDoc = querySnapshot.docs[0];
        const pacienteDocRef = doc(this.firestore, 'turnosPaciente', pacienteDoc.id);
        const turnos = pacienteDoc.data()['turnos'] || [];
  
        const turnoIndex = turnos.findIndex((t: any) => t.id === turnoId);
        if (turnoIndex !== -1) {
          turnos[turnoIndex].estado = nuevoEstado;
          await updateDoc(pacienteDocRef, { turnos });
  
          this.turnoSeleccionado.estado = nuevoEstado;
          this.turnos[turnoIndex].estado = nuevoEstado;
  
          console.log(`Estado del turno con ID ${turnoId} actualizado a ${nuevoEstado}`);
  
          if (nuevoEstado !== 'Aceptado') {
            const especialidad = this.turnoSeleccionado.especialidad; // Asegúrate de que la especialidad esté definida en el turno
            await this.agregarTurnoAAgenda(mailEspecialista, especialidad, fecha, hora);
          }
        } else {
          console.warn('No se encontró el turno en la lista.');
        }
      } else {
        console.warn('No se encontró un documento para este paciente.');
      }
    } catch (error) {
      console.error('Error al actualizar el estado del turno:', error);
    }
  }
  
  async guardarHistoriaClinica(): Promise<void> {
    if (!this.turnoSeleccionado) {
      console.warn('No hay turno seleccionado.');
      return;
    }
  
    const mailPaciente = this.turnoSeleccionado.paciente;
    if (!mailPaciente) {
      console.error('No se ha asignado un paciente.');
      return;
    }
  
    // Validar y agregar los datos dinámicos solo si no están vacíos
    const datosDinamicosValidos = [];
  
    if (this.claveRango.trim() && this.rango >= 0 && this.rango <= 100 && this.claveRango != "" && this.claveRango != null) {
      datosDinamicosValidos.push({
        clave: this.claveRango,
        valor: this.rango
      });
      console.log("1")
    }
  
    if (this.claveValor.trim() && this.valor !== null && this.claveValor != null && this.claveValor != "") {
      datosDinamicosValidos.push({
        clave: this.claveValor,
        valor: this.valor
      });console.log("2")
    }
  
    if (this.claveSwitch.trim() && this.claveSwitch != "" && this.claveSwitch != null) {
      datosDinamicosValidos.push({
        clave: this.claveSwitch,
        valor: this.switch ? 'Sí' : 'No'
      });console.log("3")
    }
  
    const historiaClinica = {
      id: this.turnoSeleccionado.id,
      mailPaciente: mailPaciente,
      mailEspecialista: this.turnoSeleccionado.mailEspecialista,
      fecha: Timestamp.fromDate(new Date()),
      altura: this.turnoSeleccionado.altura || '',
      peso: this.turnoSeleccionado.peso || '',
      temperatura: this.turnoSeleccionado.temperatura || '',
      presion: this.turnoSeleccionado.presion || '',
      datosDinamicos: [...this.turnoSeleccionado.datosDinamicos, ...datosDinamicosValidos]
    };
    console.log("4")
    console.log(historiaClinica.datosDinamicos)
  
    try {
      const docRef = await addDoc(collection(this.firestore, 'historiasClinicas'), historiaClinica);
      console.log('Historia clínica guardada con ID: ', docRef.id);
    } catch (error) {
      console.error('Error al guardar la historia clínica: ', error);
    }
  }

  async agregarTurnoAAgenda(
    mailEspecialista: string,
    especialidad: string,
    fecha: string,
    hora: string
  ): Promise<void> {
    try {
      const agendasRef = collection(this.firestore, 'agendas');
  
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
