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

interface LogEntry {
  hora: Date;
  cantidad: number;
}

interface LogsPorDia {
  [fecha: string]: { 
    [usuario: string]: LogEntry[];
  };
}

@Component({
  selector: 'app-informes',
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class InformesComponent implements OnInit {
  // Datos obtenidos
  logsPorDia: LogsPorDia = {};
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
    this.cargarTurnosUltimaSemana();
    this.cargarTurnosFinalizadosUltimaSemana(); // Cargar los turnos por especialidad
  }

  toggleLogs() {
    this.mostrarLogs = !this.mostrarLogs;  // Cambia el valor de la variable
  }
  async cargarLogs() {
    try {
      const logsRef = collection(this.firestore, 'logs');
      const querySnapshot = await getDocs(logsRef);
  
      querySnapshot.docs.forEach((doc) => {
        const logData = doc.data();  // Obtener los datos de los logs
        const fecha = logData['fecha'];  // Fecha
        const hora = logData['hora'];  // Hora
        const usuario = logData['usuario'];  // Usuario
  
        if (fecha && usuario && hora) {
          if (!this.logsPorDia[fecha]) {
            this.logsPorDia[fecha] = {};
          }
  
          // Si no existe el usuario, creamos un array vacío
          if (!this.logsPorDia[fecha][usuario]) {
            this.logsPorDia[fecha][usuario] = [];
          }
  
          // Convertir la hora en un objeto Date para ordenarla y compararla
          const horaCompleta = new Date(`${fecha}T${hora}`);  // Combina fecha + hora
  
          // Verifica que horaCompleta sea un objeto Date válido
          if (!isNaN(horaCompleta.getTime())) {
            // Añadir la hora y cantidad de accesos para ese usuario
            this.logsPorDia[fecha][usuario].push({ hora: horaCompleta, cantidad: 1 });
          } else {
            console.error('Fecha y hora inválida:', fecha, hora);
          }
        }
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
  async cargarTurnosUltimaSemana() {
    try {
      const turnosRef = collection(this.firestore, 'turnosPaciente');
      const querySnapshot = await getDocs(turnosRef);
      const fechaHoy = new Date();
      const fechaLimite = new Date(fechaHoy);
      fechaLimite.setDate(fechaHoy.getDate() - 7);  // Calcula la fecha de hace 7 días
  
      // Objeto para contar turnos por especialista
      const turnosPorMedicoContadores: { [key: string]: number } = {};
  
      querySnapshot.docs.forEach((doc) => {
        const turnoData = doc.data();
        const turnos = turnoData['turnos'];
        
        if (turnos && Array.isArray(turnos)) {
          turnos.forEach((turno) => {
            const especialista = turno['especialista']; // Obtener el especialista del turno
            const fechaTurno = turno['fecha']; // Obtener la fecha del turno
            const estadoTurno = turno['estado']; // Obtener el estado del turno
  
            if (especialista && fechaTurno && estadoTurno === 'Solicitado') {
              const fechaTurnoDate = new Date(fechaTurno); // Convertir la fecha de turno en un objeto Date
              if (fechaTurnoDate >= fechaLimite && fechaTurnoDate <= fechaHoy) {
                // Si la fecha del turno está dentro de la última semana y el estado es "Solicitado"
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
      this.dibujarGraficoTurnosPorMedico();  // Llamar la función para dibujar el gráfico
    } catch (error) {
      console.error('Error al cargar los turnos:', error);
    } finally {
      this.loading = false;
    }
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

  async cargarTurnosFinalizadosUltimaSemana() {
    try {
      const turnosRef = collection(this.firestore, 'turnosPaciente');
      const querySnapshot = await getDocs(turnosRef);
      const fechaHoy = new Date();
      const fechaLimite = new Date(fechaHoy);
      fechaLimite.setDate(fechaHoy.getDate() - 7);  // Calcula la fecha de hace 7 días
  
      // Objeto para contar turnos finalizados por especialista
      const turnosPorMedicoFinalizados: { [key: string]: number } = {};
  
      querySnapshot.docs.forEach((doc) => {
        const turnoData = doc.data();
        const turnos = turnoData['turnos'];
  
        if (turnos && Array.isArray(turnos)) {
          turnos.forEach((turno) => {
            const especialista = turno['especialista']; // Obtener el especialista del turno
            const fechaTurno = turno['fecha']; // Obtener la fecha del turno
            const estadoTurno = turno['estado']; // Obtener el estado del turno
  
            if (especialista && fechaTurno && estadoTurno === 'Finalizado') {
              const fechaTurnoDate = new Date(fechaTurno); // Convertir la fecha del turno en un objeto Date
              if (fechaTurnoDate >= fechaLimite && fechaTurnoDate <= fechaHoy) {
                // Si la fecha del turno está dentro de la última semana y el estado es "Finalizado"
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
      this.dibujarGraficoTurnosFinalizadosPorMedico();  // Llamar la función para dibujar el gráfico
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
}