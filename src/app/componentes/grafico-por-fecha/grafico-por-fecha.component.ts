import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { BarChart } from 'chartist';
import 'chartist/dist/index.css';

@Component({
  selector: 'app-grafico-por-fecha',
  standalone: true,
  templateUrl: './grafico-por-fecha.component.html',
  styleUrls: ['./grafico-por-fecha.component.scss']
})
export class GraficoPorFechaComponent implements OnInit {

  constructor(private firestore: Firestore) { }

  ngOnInit(): void {
    this.cargarTurnosPorFecha();
  }

  async cargarTurnosPorFecha(): Promise<void> {
    const turnosPacienteRef = collection(this.firestore, 'turnosPaciente');
    const querySnapshot = await getDocs(turnosPacienteRef);

    let conteosPorFecha: { [key: string]: number } = {};

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data['turnos']) {
          for (const turno of Object.values(data['turnos']) as any[]) {
            const fecha = turno.fecha; // Tomamos la fecha del turno
            if (conteosPorFecha[fecha]) {
              conteosPorFecha[fecha] += 1; // Si ya existe, sumamos 1
            } else {
              conteosPorFecha[fecha] = 1; // Si no existe, iniciamos el contador en 1
            }
          }
        }
      });

      // Preparar las etiquetas (fechas) y las series (contadores)
      const labels = Object.keys(conteosPorFecha);
      const series = Object.values(conteosPorFecha);

      // Crear el gráfico de barras
      this.renderizarGrafico(labels, series);
    }
  }

  renderizarGrafico(labels: string[], series: number[]): void {
    new BarChart(
      '#chartFechas', // Usamos el ID del div donde se dibuja el gráfico
      {
        labels: labels, // Las fechas como etiquetas
        series: series // Los contadores de turnos por fecha
      },
      {
        distributeSeries: true // Distribuir las series
      }
    );
  }
}
