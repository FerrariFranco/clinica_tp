import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common'; // Importar DatePipe
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-mi-perfil-paciente',
  templateUrl: './mi-perfil-paciente.component.html',
  styleUrls: ['./mi-perfil-paciente.component.scss'],
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
})
export class MiPerfilPacienteComponent implements OnInit {
  paciente: any = null;
  userEmail: string | null = null;
  historiasClinicas: any[] = []; // Aquí almacenaremos todas las historias clínicas
  historiasClinicasPaciente: any[] = []; // Aquí almacenaremos las historias clínicas del paciente específico
  mostrarModalHistoriasClinicas = false;

  constructor(
    private authService: AuthService,
    private firestore: Firestore,
    private router: Router,
    private datePipe: DatePipe // Inyectar  
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe((user) => {
      if (user) {
        this.userEmail = user.email;
        this.loadPaciente(this.userEmail);
        this.loadHistoriasClinicas(); // Llamamos a cargar las historias clínicas al iniciar
      }
    });
  }

  async loadPaciente(email: string | null) {
    if (!email) {
      console.error('El email del usuario es null');
      return;
    }

    const pacientesRef = collection(this.firestore, 'pacientes');
    const q = query(pacientesRef, where('mail', '==', email));
    const pacientesSnapshot = await getDocs(q);

    if (!pacientesSnapshot.empty) {
      this.paciente = pacientesSnapshot.docs[0].data();
    } else {
      console.error('No se encontró el paciente con el email proporcionado');
    }
  }

  // Método para cargar las historias clínicas
  async loadHistoriasClinicas() {
    if (!this.userEmail) {
      console.error('No se encontró el email del usuario');
      return;
    }
  
    const historiasRef = collection(this.firestore, 'historiasClinicas');
    const q = query(historiasRef, where('mailPaciente', '==', this.userEmail));
    const historiasSnapshot = await getDocs(q);
  
    if (!historiasSnapshot.empty) {
      // Procesamos las historias clínicas, transformando los Timestamps en fechas
      this.historiasClinicasPaciente = historiasSnapshot.docs.map(doc => {
        const historia = doc.data();
        // Asegúrate de convertir el Timestamp de fecha a un objeto Date
        if (historia['fecha'] && historia['fecha'].toDate) {
          historia['fecha'] = historia['fecha'].toDate(); // Convertimos el Timestamp a Date
        }
        return historia;
      });
    } else {
      console.error('No se encontraron historias clínicas para este paciente');
    }
  }
  

  misTurnos() {
    this.router.navigate(['/turnos-paciente']);
  }

  // Método para descargar el PDF con las historias clínicas
  async descargarHistoriasClinicas() {
    if (!this.historiasClinicasPaciente.length) {
      console.error('No hay historias clínicas disponibles para este paciente');
      return;
    }

    // Crear un nuevo PDF
    const doc = new jsPDF();
    doc.addImage('../../assets/logo.png', 'PNG', 10, 10, 50, 50); // Agregar imagen (logo)

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('HISTORIA CLÍNICA', 70, 20); // Título

    doc.setFontSize(12);
    doc.text(`Paciente: ${this.userEmail}`, 10, 70); // Email del paciente

    let yPosition = 80; // Empezar la posición Y después del título y email

    // Usar un bucle for para acceder a los documentos y al índice
    for (let index = 0; index < this.historiasClinicasPaciente.length; index++) {
      const historia = this.historiasClinicasPaciente[index];

      // Usar DatePipe para formatear la fecha
      const fechaFormateada = this.datePipe.transform(historia['fecha'].toDate(), 'dd/MM/yyyy');

      // Ajustar la posición Y para la siguiente línea de texto
      doc.text(`Fecha: ${fechaFormateada}`, 10, yPosition);
      yPosition += 10; // Incrementar para la siguiente línea

      doc.text(`Altura: ${historia['altura']}`, 10, yPosition);
      yPosition += 10;

      doc.text(`Peso: ${historia['peso']}`, 10, yPosition);
      yPosition += 10;

      doc.text(`Temperatura: ${historia['temperatura']}`, 10, yPosition);
      yPosition += 10;

      doc.text(`Presión: ${historia['presion']}`, 10, yPosition);
      yPosition += 10;

      // Simplificar los datos dinámicos
      historia['datosDinamicos']?.forEach((dato: any, i: number) => {
        doc.text(`${dato.clave}: ${dato.valor}`, 10, yPosition);
        yPosition += 10; // Ajuste de posición para cada dato dinámico
      });

      // Ajustar el espaciado entre las historias
      yPosition += 20; // Dejar un espacio entre cada historia clínica
    }

    // Guardar el PDF generado
    doc.save(`historia_clinica_${this.userEmail}.pdf`);
  }
}
