import { Component, AfterViewInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { BarChart } from 'chartist';
import 'chartist/dist/index.css';
import { jsPDF } from 'jspdf';
import * as ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { Buffer } from 'buffer';
import domtoimage from 'dom-to-image';

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
// Funciones para cargar los turnos por fecha, semana y turnos finalizados
async cargarTurnosPorFecha(): Promise<void> {
  const turnosPacienteRef = collection(this.firestore, 'turnosPaciente');
  const querySnapshot = await getDocs(turnosPacienteRef);

  let conteosPorFecha: { [key: string]: number } = {};

  if (!querySnapshot.empty) {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data['turnos']) {
        for (const turno of Object.values(data['turnos']) as any[]) {
          const fecha = turno.fecha;
          conteosPorFecha[fecha] = (conteosPorFecha[fecha] || 0) + 1;
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

  let conteosSemanaActualPorEspecialista: { [key: string]: number } = {};
  const hoy = new Date();
  const inicioSemana = this.getInicioSemana(hoy);
  const finSemana = this.getFinSemana(hoy);

  if (!querySnapshot.empty) {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data['turnos']) {
        for (const turno of Object.values(data['turnos']) as any[]) {
          const fecha = new Date(turno.fecha);
          const especialista = turno.especialista; // Obtenemos el especialista

          // Solo contar los turnos dentro de la semana actual
          if (fecha >= inicioSemana && fecha <= finSemana && especialista) {
            conteosSemanaActualPorEspecialista[especialista] = (conteosSemanaActualPorEspecialista[especialista] || 0) + 1;
          }
        }
      }
    });

    const labels = Object.keys(conteosSemanaActualPorEspecialista);
    const series = Object.values(conteosSemanaActualPorEspecialista);

    this.renderizarGrafico(labels, series, '#chartSemanaActual');
  }
}

async cargarTurnosFinalizadosDeSemanaActual(): Promise<void> {
  const turnosPacienteRef = collection(this.firestore, 'turnosPaciente');
  const querySnapshot = await getDocs(turnosPacienteRef);

  let conteosFinalizadosSemanaActualPorEspecialista: { [key: string]: number } = {};
  const hoy = new Date();
  const inicioSemana = this.getInicioSemana(hoy);
  const finSemana = this.getFinSemana(hoy);

  if (!querySnapshot.empty) {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data['turnos']) {
        for (const turno of Object.values(data['turnos']) as any[]) {
          const fecha = new Date(turno.fecha);
          const especialista = turno.especialista; // Obtenemos el especialista

          // Solo contar los turnos dentro de la semana actual y con estado "Finalizado"
          if (fecha >= inicioSemana && fecha <= finSemana && turno.estado === 'Finalizado' && especialista) {
            conteosFinalizadosSemanaActualPorEspecialista[especialista] = (conteosFinalizadosSemanaActualPorEspecialista[especialista] || 0) + 1;
          }
        }
      }
    });

    const labels = Object.keys(conteosFinalizadosSemanaActualPorEspecialista);
    const series = Object.values(conteosFinalizadosSemanaActualPorEspecialista);

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
    const chart = new BarChart(
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
}
  



