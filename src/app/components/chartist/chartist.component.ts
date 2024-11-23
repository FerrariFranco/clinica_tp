import { Component, AfterViewInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { BarChart } from 'chartist';
import 'chartist/dist/index.css';
import { jsPDF } from 'jspdf'; 
import * as ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver'; 

@Component({
  selector: 'app-chartist',
  standalone: true,
  templateUrl: './chartist.component.html',
  styleUrls: ['./chartist.component.scss']
})
export class ChartistComponent implements AfterViewInit {

  constructor(private firestore: Firestore) { }

  ngAfterViewInit(): void {
    this.cargarEspecialidadesParaGrafico();
    this.cargarTurnosPorFecha();
    this.cargarTurnosDeSemanaActual();
    this.cargarTurnosFinalizadosDeSemanaActual();
  }

  // Método para cargar los turnos por especialidad y renderizar el gráfico
  async cargarEspecialidadesParaGrafico(): Promise<void> {
    const turnosPacienteRef = collection(this.firestore, 'turnosPaciente');
    
    try {
      const querySnapshot = await getDocs(turnosPacienteRef);

      if (!querySnapshot.empty) {
        const especialidadesContadas: { [key: string]: number } = {};
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          if (data['turnos']) {
            for (const turno of Object.values(data['turnos']) as any[]) {
              const especialidad = turno.especialidad;
              if (especialidad) {
                especialidadesContadas[especialidad] = (especialidadesContadas[especialidad] || 0) + 1;
              }
            }
          }
        }

        const labels: string[] = [];
        const series: number[] = [];
        for (const especialidad in especialidadesContadas) {
          labels.push(especialidad);
          series.push(especialidadesContadas[especialidad]);
        }

        this.renderizarGrafico(labels, series, '#chartEspecialidades');
      }
    } catch (error) {
      console.error('Error al cargar los turnos:', error);
    }
  }

  renderizarGrafico(labels: string[], series: number[], chartId: string): void {
    new BarChart(
      chartId,
      {
        labels: labels,
        series: series
      },
      {
        distributeSeries: true
      }
    );
  }

  // Métodos para descargar gráficos como Excel y PDF
  downloadExcel(graphId: string): void {
    const canvasElement = document.getElementById(graphId) as HTMLCanvasElement;

    html2canvas(canvasElement).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Gráfico Turnos');

      const imageId = workbook.addImage({
        base64: imgData,
        extension: 'png',
      });

      worksheet.addImage(imageId, {
        tl: { col: 0.5, row: 0.5 },
        ext: { width: 400, height: 300 }
      });

      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer]), 'grafico_turnos.xlsx');
      });
    });
  }

  downloadPdf(graphId: string): void {
    const canvas = document.getElementById(graphId) as HTMLCanvasElement;
    const data = canvas.toDataURL('image/png');

    const doc = new jsPDF();
    doc.addImage(data, 'PNG', 10, 10, 180, 150);
    doc.save(`${graphId}.pdf`);
  }

  // Botones para descargar el gráfico en Excel y PDF
  downloadButtons() {
    return `
      <button (click)="downloadExcel('chartEspecialidades')">Descargar Excel</button>
      <button (click)="downloadPdf('chartEspecialidades')">Descargar PDF</button>
    `;
  }

  // Funciones para cargar los turnos por fecha, semana y turnos finalizados
  async cargarTurnosPorFecha(): Promise<void> {
    const turnosPacienteRef = collection(this.firestore, 'turnosPaciente');
    const querySnapshot = await getDocs(turnosPacienteRef);

    let fechas: string[] = [];
    let conteosPorFecha: { [key: string]: number } = {};

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data['turnos']) {
          for (const turno of Object.values(data['turnos']) as any[]) {
            const fecha = turno.fecha;
            if (conteosPorFecha[fecha]) {
              conteosPorFecha[fecha] += 1;
            } else {
              conteosPorFecha[fecha] = 1;
            }
          }
        }
      });

      const labels = Object.keys(conteosPorFecha);
      const series = Object.values(conteosPorFecha);

      this.renderizarGrafico(labels, series, '#chartFechas');
    }
  }

  async cargarTurnosDeSemanaActual(): Promise<void> {
    const turnosPacienteRef = collection(this.firestore, 'turnosPaciente');
    const querySnapshot = await getDocs(turnosPacienteRef);

    let conteosSemanaActual: { [key: string]: number } = {};
    const hoy = new Date();
    const inicioSemana = this.getInicioSemana(hoy);
    const finSemana = this.getFinSemana(hoy);

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data['turnos']) {
          for (const turno of Object.values(data['turnos']) as any[]) {
            const fecha = new Date(turno.fecha);
            if (fecha >= inicioSemana && fecha <= finSemana) {
              const fechaStr = fecha.toISOString().split('T')[0];
              conteosSemanaActual[fechaStr] = (conteosSemanaActual[fechaStr] || 0) + 1;
            }
          }
        }
      });

      const labels = Object.keys(conteosSemanaActual);
      const series = Object.values(conteosSemanaActual);

      this.renderizarGrafico(labels, series, '#chartSemanaActual');
    }
  }

  async cargarTurnosFinalizadosDeSemanaActual(): Promise<void> {
    const turnosPacienteRef = collection(this.firestore, 'turnosPaciente');
    const querySnapshot = await getDocs(turnosPacienteRef);

    let conteosFinalizadosSemanaActual: { [key: string]: number } = {};
    const hoy = new Date();
    const inicioSemana = this.getInicioSemana(hoy);
    const finSemana = this.getFinSemana(hoy);

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data['turnos']) {
          for (const turno of Object.values(data['turnos']) as any[]) {
            const fecha = new Date(turno.fecha);
            if (fecha >= inicioSemana && fecha <= finSemana && turno.estado === 'Finalizado') {
              const fechaStr = fecha.toISOString().split('T')[0];
              conteosFinalizadosSemanaActual[fechaStr] = (conteosFinalizadosSemanaActual[fechaStr] || 0) + 1;
            }
          }
        }
      });

      const labels = Object.keys(conteosFinalizadosSemanaActual);
      const series = Object.values(conteosFinalizadosSemanaActual);

      this.renderizarGrafico(labels, series, '#chartFinalizadosSemana');
    }
  }

  getInicioSemana(fecha: Date): Date {
    const dia = fecha.getDay(),
          diferencia = (dia === 0 ? 6 : dia - 1);
    const inicio = new Date(fecha);
    inicio.setDate(fecha.getDate() - diferencia);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
  }

  getFinSemana(fecha: Date): Date {
    const dia = fecha.getDay(),
          diferencia = (dia === 0 ? 0 : 7 - dia);
    const fin = new Date(fecha);
    fin.setDate(fecha.getDate() + diferencia);
    fin.setHours(23, 59, 59, 999);
    return fin;
  }
}
