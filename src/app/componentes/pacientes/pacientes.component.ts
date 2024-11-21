import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, limit, orderBy } from '@angular/fire/firestore';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule, DatePipe } from '@angular/common';
import jsPDF from 'jspdf';

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

  constructor(private authService: AuthService, private firestore: Firestore, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe((user) => {
      if (user) {
        this.userEmail = user.email;
        this.loadRecentPacientes(this.userEmail);
      }
    });
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
    } catch (error) {
      console.error('Error al cargar los pacientes:', error);
    }
  }

  async descargarHistoriasClinicas(emailPaciente: string) {
    if (!emailPaciente) {
      console.error('No se proporcionó el email del paciente');
      return;
    }

    try {
      // Realizar la consulta de las historias clínicas del paciente
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
        doc.text(`Altura: ${historia['altura']}`, 10, currentY + 10);
        doc.text(`Peso: ${historia['peso']}`, 10, currentY + 20);
        doc.text(`Temperatura: ${historia['temperatura']}`, 10, currentY + 30);
        doc.text(`Presión: ${historia['presion']}`, 10, currentY + 40);

        historia['datosDinamicos']?.forEach((dato: any) => {
          currentY += 10;
          doc.text(`${dato.clave}: ${dato.valor}`, 10, currentY + 45);
        });

        currentY += 50; // Añadir espacio entre historias clínicas
      });

      doc.save(`historia_clinica_${emailPaciente}.pdf`);
    } catch (error) {
      console.error('Error al descargar historias clínicas:', error);
    }
  }
}
