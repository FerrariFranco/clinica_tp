import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { jsPDF } from 'jspdf'; 
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver'; 
import { Buffer } from 'buffer';
import { ConvertirHoraPipe } from '../../pipes/convertir-hora.pipe';
import 'jspdf-autotable';



@Component({
  selector: 'app-informes',
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule,ConvertirHoraPipe],
})
export class InformesComponent implements OnInit {
  logs: any[] = [];
  loading = true;
  turnosPorMedico: { [especialista: string]: number } = {};  // Contadores de turnos por médico
  medicoLabels: string[] = [];
  medicoData: number[] = [];
  medicoFinalizadosLabels: string[] = [];  // Nombres de los médicos
medicoFinalizadosData: number[] = [];  
  mostrarLogs = false;  // Variable para controlar la visibilidad de los logs
  turnosPorEspecialidad = {}; // Objeto para almacenar los contadores de turnos por especialidad
  turnosPorEspecialidadValues: number[] = []; // Arreglo de cantidades
  especialidadLabels: string[] = [];
  especialidadData: number[] = [];
  turnosPorFecha: { [fecha: string]: number } = {}; // Objeto para almacenar los contadores de turnos por fecha
  fechaLabels: string[] = [];
  fechaData: number[] = [];

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    Chart.register(...registerables);  

    await this.cargarLogs(); // Cargar los logs
    await this.cargarTurnosPorEspecialidad();
    this.cargarTurnosSemanaActual();
    this.cargarTurnosFinalizadosSemanaActual(); // Cargar los turnos por especialidad
  }

  toggleLogs() {
    this.mostrarLogs = !this.mostrarLogs;  // Cambia el valor de la variable
  }
  async cargarLogs() {
    try {
      const logsRef = collection(this.firestore, 'logs');
      const querySnapshot = await getDocs(logsRef);
  
      this.logs = querySnapshot.docs.map(doc => doc.data());
      
      // Ordenar los logs por fecha y hora (de más reciente a más antiguo)
      this.logs.sort((a, b) => {
        const fechaHoraA = new Date(`${a.fecha}T${a.hora}`);
        const fechaHoraB = new Date(`${b.fecha}T${b.hora}`);
        return fechaHoraB.getTime() - fechaHoraA.getTime();  // Ordenar descendente
      });
    } catch (error) {
      console.error('Error al cargar los logs:', error);
    } finally {
      this.loading = false;
    }
  }
  async cargarTurnosPorEspecialidad() {
    try {
      const turnosRef = collection(this.firestore, 'turnosPaciente');
      const querySnapshot = await getDocs(turnosRef);
  
      const especialidadContadores: { [key: string]: number } = {};
      const fechaContadores: { [key: string]: number } = {}; // Contador de turnos por fecha
  
      querySnapshot.docs.forEach((doc) => {
        const turnoData = doc.data();
        const turnos = turnoData['turnos'];
        
        if (turnos && Array.isArray(turnos)) {
          turnos.forEach((turno) => {
            const especialidad = turno['especialidad'];
            const fecha = turno['fecha']; // Obtener la fecha del turno
  
            if (especialidad) {
              if (!especialidadContadores[especialidad]) {
                especialidadContadores[especialidad] = 0;
              }
              especialidadContadores[especialidad]++;
            }
  
            if (fecha) {
              if (!fechaContadores[fecha]) {
                fechaContadores[fecha] = 0;
              }
              fechaContadores[fecha]++;
            }
          });
        }
      });
  
      // Asignar los datos de especialidades al gráfico
      this.especialidadLabels = Object.keys(especialidadContadores);
      this.especialidadData = this.especialidadLabels.map((especialidad) => especialidadContadores[especialidad]);
  
      // Asignar los datos de fechas al gráfico
      this.fechaLabels = Object.keys(fechaContadores);
      this.fechaData = this.fechaLabels.map((fecha) => fechaContadores[fecha]);
  
      this.dibujarGraficoPorFecha(); // Llamar la función para dibujar el gráfico de turnos por fecha
      this.dibujarGrafico()
    } catch (error) {
      console.error('Error al cargar los turnos por especialidad:', error);
    }
  }
  dibujarGraficoPorFecha() {
    const canvas = document.getElementById('graficoTurnosFecha') as HTMLCanvasElement;
  
    if (canvas && this.fechaLabels.length > 0 && this.fechaData.length > 0) {
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: this.fechaLabels,
          datasets: [{
            label: 'Cantidad de Turnos por Fecha',
            data: this.fechaData,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }
  dibujarGrafico() {
    
    const canvas = document.getElementById('graficoTurnos') as HTMLCanvasElement;
    if (canvas && this.especialidadLabels.length > 0 && this.especialidadData.length > 0) {
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: this.especialidadLabels,
          datasets: [{
            label: 'Cantidad de Turnos',
            data: this.especialidadData,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }
  async cargarTurnosSemanaActual() {
    try {
      const turnosRef = collection(this.firestore, 'turnosPaciente');
      const querySnapshot = await getDocs(turnosRef);
  
      const hoy = new Date();
      const inicioSemana = this.getInicioSemana(hoy);  // Obtener el inicio de la semana actual (lunes)
      const finSemana = this.getFinSemana(hoy);        // Obtener el fin de la semana actual (domingo)
  
      // Objeto para contar turnos por especialista
      const turnosPorMedicoContadores: { [key: string]: number } = {};
  
      querySnapshot.docs.forEach((doc) => {
        const turnoData = doc.data();
        const turnos = turnoData['turnos'];
        
        if (turnos && Array.isArray(turnos)) {
          turnos.forEach((turno) => {
            const especialista = turno['especialista']; // Obtener el especialista del turno
            const fechaTurno = turno['fecha'];           // Obtener la fecha del turno
  
            if (especialista && fechaTurno) {
              const fechaTurnoDate = new Date(fechaTurno); // Convertir la fecha de turno en un objeto Date
  
              // Filtrar los turnos que estén dentro de la semana actual
              if (fechaTurnoDate >= inicioSemana && fechaTurnoDate <= finSemana) {
                // Si el turno está dentro de la semana actual
                if (!turnosPorMedicoContadores[especialista]) {
                  turnosPorMedicoContadores[especialista] = 0;
                }
                turnosPorMedicoContadores[especialista]++;
              }
            }
          });
        }
      });
  
      // Asignar los datos de los especialistas al gráfico
      this.medicoLabels = Object.keys(turnosPorMedicoContadores);
      this.medicoData = this.medicoLabels.map((especialista) => turnosPorMedicoContadores[especialista]);
  
      // Llamar la función para dibujar el gráfico de turnos por médico
      this.dibujarGraficoTurnosPorMedico();
  
    } catch (error) {
      console.error('Error al cargar los turnos:', error);
    } finally {
      this.loading = false;
    }
  }
  
  // Función para obtener el inicio de la semana (lunes)
  getInicioSemana(fecha: Date): Date {
    const dia = fecha.getDay(),
          diferencia = (dia === 0 ? 6 : dia - 1); // El lunes es el inicio de la semana
    const inicio = new Date(fecha);
    inicio.setDate(fecha.getDate() - diferencia);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
  }
  
  // Función para obtener el fin de la semana (domingo)
  getFinSemana(fecha: Date): Date {
    const dia = fecha.getDay(),
          diferencia = (dia === 0 ? 0 : 7 - dia); // El domingo es el fin de la semana
    const fin = new Date(fecha);
    fin.setDate(fecha.getDate() + diferencia);
    fin.setHours(23, 59, 59, 999);
    return fin;
  }
  

  dibujarGraficoTurnosPorMedico() {
    const canvas = document.getElementById('graficoTurnosMedico') as HTMLCanvasElement;

    if (canvas && this.medicoLabels.length > 0 && this.medicoData.length > 0) {
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: this.medicoLabels,
          datasets: [{
            label: 'Cantidad de Turnos por Médico',
            data: this.medicoData,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  async cargarTurnosFinalizadosSemanaActual() {
  try {
    const turnosRef = collection(this.firestore, 'turnosPaciente');
    const querySnapshot = await getDocs(turnosRef);

    const hoy = new Date();
    const inicioSemana = this.getInicioSemana(hoy);  // Obtener el inicio de la semana actual (lunes)
    const finSemana = this.getFinSemana(hoy);        // Obtener el fin de la semana actual (domingo)

    // Objeto para contar turnos finalizados por especialista
    const turnosPorMedicoFinalizados: { [key: string]: number } = {};

    querySnapshot.docs.forEach((doc) => {
      const turnoData = doc.data();
      const turnos = turnoData['turnos'];

      if (turnos && Array.isArray(turnos)) {
        turnos.forEach((turno) => {
          const especialista = turno['especialista']; // Obtener el especialista del turno
          const fechaTurno = turno['fecha'];           // Obtener la fecha del turno
          const estadoTurno = turno['estado'];         // Obtener el estado del turno

          if (especialista && fechaTurno && estadoTurno === 'Finalizado') {
            const fechaTurnoDate = new Date(fechaTurno); // Convertir la fecha del turno en un objeto Date

            // Filtrar los turnos que estén dentro de la semana actual
            if (fechaTurnoDate >= inicioSemana && fechaTurnoDate <= finSemana) {
              // Si el turno está dentro de la semana actual y el estado es "Finalizado"
              if (!turnosPorMedicoFinalizados[especialista]) {
                turnosPorMedicoFinalizados[especialista] = 0;
              }
              turnosPorMedicoFinalizados[especialista]++;
            }
          }
        });
      }
    });

    // Asignar los datos de los especialistas al gráfico
    this.medicoFinalizadosLabels = Object.keys(turnosPorMedicoFinalizados);
    this.medicoFinalizadosData = this.medicoFinalizadosLabels.map((especialista) => turnosPorMedicoFinalizados[especialista]);

    // Llamar la función para dibujar el gráfico de turnos finalizados por médico
    this.dibujarGraficoTurnosFinalizadosPorMedico();

  } catch (error) {
    console.error('Error al cargar los turnos finalizados:', error);
  } finally {
    this.loading = false;
  }
}


  
  dibujarGraficoTurnosFinalizadosPorMedico() {
    const canvas = document.getElementById('graficoTurnosFinalizadosMedico') as HTMLCanvasElement;
  
    if (canvas && this.medicoFinalizadosLabels.length > 0 && this.medicoFinalizadosData.length > 0) {
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: this.medicoFinalizadosLabels,
          datasets: [{
            label: 'Cantidad de Turnos Finalizados por Médico',
            data: this.medicoFinalizadosData,
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }
  downloadExcel(graphId: string) {
    const canvasElement = document.getElementById(graphId) as HTMLCanvasElement;

    // Usamos html2canvas para capturar el gráfico como imagen
    html2canvas(canvasElement).then((canvas) => {
      // Convertimos el canvas a formato base64
      const imgData = canvas.toDataURL('image/png');

      // Creamos un nuevo libro de trabajo
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Gráfico Turnos');

      // Convertimos la imagen base64 a un buffer
      const imageBuffer = this.base64ToBuffer(imgData);

      // Añadimos la imagen al workbook
      const imageId = workbook.addImage({
        base64: imgData,
        extension: 'png',
      });

      // Insertamos la imagen en la celda A1
      worksheet.addImage(imageId, {
        tl: { col: 0.5, row: 0.5 },  // Ajustamos la posición de la imagen
        ext: { width: 400, height: 300 }  // Ajustamos el tamaño
      });

      // Guardamos el archivo Excel
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer]), 'grafico_turnos.xlsx');
      });
    });
  }



  base64ToBuffer(base64: string) {
    const base64Data = base64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    return buffer;
  }


  downloadPdf(graphId: string) {
    const canvas = document.getElementById(graphId) as HTMLCanvasElement;
    const data = canvas.toDataURL('image/png'); 

    const doc = new jsPDF();
    doc.addImage(data, 'PNG', 10, 10, 180, 150); 
    doc.save(`${graphId}.pdf`);
  }

  descargarPDF() {
    const doc = new jsPDF();
    doc.text('Logs de Ingreso', 14, 10);

    // Cabecera de la tabla
    (doc as any).autoTable({
      head: [['Usuario', 'Fecha y Hora']],
      body: this.logs.map(log => [log.usuario, `${log.fecha} ${log.hora}`]),
      startY: 20, // Ajusta la posición Y para que la tabla comience después del título
    });

    // Descargar el PDF
    doc.save('logs_de_ingreso.pdf');
  }

  // Método para generar el archivo Excel
  descargarExcel() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.logs.map(log => ({
      Usuario: log.usuario,
      'Fecha y Hora': `${log.fecha} ${log.hora}`
    })));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Logs de Ingreso');

    // Descargar el archivo Excel
    XLSX.writeFile(wb, 'logs_de_ingreso.xlsx');
  }
}