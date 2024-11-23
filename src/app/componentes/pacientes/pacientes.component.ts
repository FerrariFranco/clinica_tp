import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, limit, orderBy } from '@angular/fire/firestore';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule, DatePipe } from '@angular/common';
import jsPDF from 'jspdf';
interface Turno {
  fecha: string; // Es una cadena que representa la fecha
  estado?: string;
  hora?: string;
  especialidad?: string;
  especialista?: string;
  review?: string;
  id?: string;
  mailEspecialista?: string;
}

@Component({
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.scss'],
  providers: [DatePipe],
  standalone: true,
  imports: [CommonModule]
})
export class PacientesComponent implements OnInit {
  userEmail: string | null = null; // Email del especialista
  pacientes: any[] = []; // Información completa de los pacientes
  historiasClinicas: any[] = []; // Historias clínicas del paciente actual
  mostrarModal: boolean = false;
  constructor(private authService: AuthService, private firestore: Firestore, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe((user) => {
      if (user) {
        this.userEmail = user.email;
        this.loadRecentPacientes(this.userEmail);
      }
    });
  }
async loadRecentTurnos(pacientes: any[]) {
  try {
    for (let paciente of pacientes) {
      const pacienteEmail = paciente.mail;

      // Consultar los turnos del paciente en la colección 'turnosPacientes'
      const turnosRef = collection(this.firestore, 'turnosPaciente');
      const turnosQuery = query(
        turnosRef,
        where('mailPaciente', '==', pacienteEmail)
      );

      const turnosSnapshot = await getDocs(turnosQuery);

      if (turnosSnapshot.empty) {
        console.warn(`No se encontraron turnos para el paciente ${pacienteEmail}.`);
        continue;
      }

      // Inicializamos un arreglo para almacenar los turnos
      let turnos: any[] = [];

      // Recorrer los turnos encontrados y acceder a las fechas
      for (const doc of turnosSnapshot.docs) {
        const data = doc.data();
        const turnosData = data['turnos'] || [];

        // Limitar a los 3 últimos turnos de este documento
        turnos = turnos.concat(turnosData.slice(0, 3)); // Tomamos solo los primeros 3 turnos de este documento
      }

      // Asignar los turnos al paciente
      paciente.turnos = turnos.map((turno: any) => ({
        fecha: turno.fecha || 'Fecha no disponible', 
        estado: turno.estado || 'Estado no disponible',
        hora: turno.hora || 'Hora no disponible',
        especialidad: turno.especialidad || 'Especialidad no disponible',
      }));

    }

    // Actualizar los pacientes con sus turnos
    this.pacientes = pacientes;
  } catch (error) {
    console.error('Error al cargar los turnos de los pacientes:', error);
  }
}

  

  async loadRecentPacientes(especialistaEmail: string | null) {
    if (!especialistaEmail) {
      console.error('El email del especialista es null');
      return;
    }
  
    try {
      // Consulta inicial para obtener los 3 emails más recientes
      const historiasRef = collection(this.firestore, 'historiasClinicas');
      const historiasQuery = query(
        historiasRef,
        where('mailEspecialista', '==', especialistaEmail),
        orderBy('fecha', 'desc'),
        limit(3)
      );
      const historiasSnapshot = await getDocs(historiasQuery);
  
      if (historiasSnapshot.empty) {
        console.warn('No se encontraron historias clínicas para este especialista.');
        return;
      }
  
      const emailsSet = new Set<string>();
      historiasSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data['mailPaciente']) {
          emailsSet.add(data['mailPaciente']);
        }
      });
  
      const emails = Array.from(emailsSet); // Convertimos el Set en Array
  
      if (emails.length === 0) {
        console.warn('No hay emails de pacientes para buscar.');
        return;
      }
  
      const pacientesRef = collection(this.firestore, 'pacientes');
      const pacientesQuery = query(pacientesRef, where('mail', 'in', emails));
      const pacientesSnapshot = await getDocs(pacientesQuery);
  
      this.pacientes = pacientesSnapshot.docs.map((doc) => doc.data());
  
      // Ahora cargamos los últimos turnos de los pacientes
      await this.loadRecentTurnos(this.pacientes);
    } catch (error) {
      console.error('Error al cargar los pacientes:', error);
    }
  }
  
  async mostrarHistoriasClinicas(emailPaciente: string) {
    if (!emailPaciente) {
      console.error('No se proporcionó el email del paciente');
      return;
    }
  
    try {
      // Consulta de Firestore para obtener las historias clínicas del paciente
      const historiasRef = collection(this.firestore, 'historiasClinicas');
      const q = query(historiasRef, where('mailPaciente', '==', emailPaciente));
      const historiasSnapshot = await getDocs(q);
  
      if (historiasSnapshot.empty) {
        console.warn(`No se encontraron historias clínicas para el paciente ${emailPaciente}`);
        this.historiasClinicas = [];
      } else {
        this.historiasClinicas = historiasSnapshot.docs.map((doc) => doc.data());
      }
    } catch (error) {
      console.error('Error al cargar historias clínicas:', error);
    }
  
    this.mostrarModal = true; // Mostrar el modal
  }
  
  cerrarModal() {
    this.mostrarModal = false; // Ocultar el modal
    this.historiasClinicas = []; // Limpiar las historias clínicas cargadas
  }
  async descargarHistoriasClinicas(emailPaciente: string) {
    if (!emailPaciente) {
      console.error('No se proporcionó el email del paciente');
      return;
    }
  
    try {
      const historiasRef = collection(this.firestore, 'historiasClinicas');
      const q = query(historiasRef, where('mailPaciente', '==', emailPaciente));
      const historiasSnapshot = await getDocs(q);
  
      if (historiasSnapshot.empty) {
        console.error(`No se encontraron historias clínicas para el paciente ${emailPaciente}`);
        return;
      }
  
      // Crear un nuevo PDF
      const doc = new jsPDF();
      doc.addImage('../../assets/logo.png', 'PNG', 10, 10, 50, 50); // Agregar imagen (logo)
  
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('HISTORIA CLÍNICA', 70, 20); // Título
  
      doc.setFontSize(12);
      doc.text(`Paciente: ${emailPaciente}`, 10, 70); // Email del paciente
  
      // Usar un bucle for para procesar los documentos
      let currentY = 80;
      historiasSnapshot.docs.forEach((docSnapshot, index) => {
        const historia = docSnapshot.data();
  
        // Usar DatePipe para formatear la fecha
        const fechaFormateada = this.datePipe.transform(
          historia['fecha'].toDate(),
          'dd/MM/yyyy'
        );
  
        doc.text(`Fecha: ${fechaFormateada}`, 10, currentY);
        currentY += 10; // Espacio después de la fecha
        doc.text(`Altura: ${historia['altura']}`, 10, currentY);
        currentY += 10; // Espacio después de la altura
        doc.text(`Peso: ${historia['peso']}`, 10, currentY);
        currentY += 10; // Espacio después del peso
        doc.text(`Temperatura: ${historia['temperatura']}`, 10, currentY);
        currentY += 10; // Espacio después de la temperatura
        doc.text(`Presión: ${historia['presion']}`, 10, currentY);
        currentY += 10; // Espacio después de la presión
  
        historia['datosDinamicos']?.forEach((dato: any) => {
          currentY += 10; // Incrementa para cada dato dinámico
          doc.text(`${dato.clave}: ${dato.valor}`, 10, currentY);
          currentY += 10; // Espacio después de cada dato dinámico
        });
  
        currentY += 20; // Añadir espacio entre historias clínicas
  
        // Si la página se llena, se agrega una nueva página
        if (currentY > 270) { // Asegúrate de no sobrepasar el límite de la página
          doc.addPage();
          currentY = 20; // Reseteamos la posición de Y al inicio de la nueva página
        }
      });
  
      // Guardar el PDF
      doc.save(`historia_clinica_${emailPaciente}.pdf`);
    } catch (error) {
      console.error('Error al descargar historias clínicas:', error);
    }
  }
  
}
