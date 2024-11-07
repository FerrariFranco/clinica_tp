import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, query, where, getDocs, addDoc, updateDoc, doc } from '@angular/fire/firestore';
import { AuthService } from '../../servicios/auth.service'; // Asegúrate de tener un servicio de autenticación para obtener el usuario logueado

@Component({
  selector: 'app-mis-horarios',
  templateUrl: './mis-horarios.component.html',
  styleUrls: ['./mis-horarios.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class MisHorariosComponent implements OnInit {
  horariosForm: FormGroup;
  dias: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  diasSeleccionados: string[] = [];
  turnos: any[] = []; // Array para almacenar la lista de turnos generados
  especialidades: string[] = []; // Array para almacenar las especialidades del especialista
  especialidadSeleccionada: string = ''; // Variable para la especialidad seleccionada por el usuario

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private authService: AuthService
  ) {
    this.horariosForm = this.fb.group({
      dias: [[]],
      horaInicio: ['08:00'], 
      horaFin: ['19:00'] 
    });
  }

  ngOnInit(): void {
    this.obtenerEspecialidades();
    
  }

  async obtenerEspecialidades() {
    this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        const mailEspecialista = user.email;
  
        
        const especialistasRef = collection(this.firestore, 'especialistas');
        const q = query(especialistasRef, where('mail', '==', mailEspecialista));
        
        getDocs(q).then(querySnapshot => {
          if (querySnapshot.empty) {
            console.error('No se encontró el especialista');
            return;
          }
  
          querySnapshot.forEach(doc => {
            const data = doc.data();
            console.log('Especialista encontrado:', data); 
  
            this.especialidades = data['especialidades'] || [];
            console.log('Especialidades:', this.especialidades); 
          });
        }).catch(error => {
          console.error('Error al cargar las especialidades:', error);
        });
      }
    });
  }

  onDiaSeleccionado(dia: string): void {
    const index = this.diasSeleccionados.indexOf(dia);
    if (index === -1) {
      this.diasSeleccionados.push(dia);
    } else {
      this.diasSeleccionados.splice(index, 1);
    }
    this.horariosForm.patchValue({ dias: this.diasSeleccionados });
  }
  onEspecialidadSeleccionada(event: Event): void {
    const selectElement = event.target as HTMLSelectElement; // Cast al tipo correcto
    this.especialidadSeleccionada = selectElement.value;  // Obtener el valor seleccionado
  }
  generarTurnosDisponibles(): void {
    const horaInicio = this.horariosForm.value.horaInicio;
    const horaFin = this.horariosForm.value.horaFin;
    const minutosIntervalo = 30; // Intervalo de media hora
    const ahora = new Date(); // Fecha actual
    const diasAdelante = 30; // Generar turnos para los próximos 30 días

    this.turnos = []; // Limpiar la lista de turnos antes de generar nuevos

    this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        const mailEspecialista = user.email;

        for (let dia = 0; dia < diasAdelante; dia++) {
          const fecha = new Date(ahora);
          fecha.setDate(ahora.getDate() + dia);

          const diaSemana = this.dias[fecha.getDay() - 1];
          if (this.diasSeleccionados.includes(diaSemana)) {
            let horaActual = new Date(fecha);
            horaActual.setHours(Number(horaInicio.split(':')[0]));
            horaActual.setMinutes(Number(horaInicio.split(':')[1]));

            let horaLimite = new Date(fecha);
            horaLimite.setHours(Number(horaFin.split(':')[0]));
            horaLimite.setMinutes(Number(horaFin.split(':')[1]));

            while (horaActual < horaLimite) {
              this.turnos.push({
                fecha: new Date(horaActual),

              });

              horaActual.setMinutes(horaActual.getMinutes() + minutosIntervalo);
            }
          }
        }

        this.guardarTurnosEnFirestore(mailEspecialista, this.turnos, this.especialidadSeleccionada);
      }
    });
  }

  async guardarTurnosEnFirestore(
    mailEspecialista: string | null,
    turnos: any[],
    especialidad = this.especialidadSeleccionada
  ): Promise<void> {
    try {
      const agendasRef = collection(this.firestore, 'agendas');
      const q = query(agendasRef, where('mailEspecialista', '==', mailEspecialista), where('especialidad', '==', especialidad));
      
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (docSnapshot) => {
          const docRef = doc(this.firestore, 'agendas', docSnapshot.id); // Obtener la referencia del documento
          await updateDoc(docRef, {
            turnos: turnos // Actualizamos solo el campo de los turnos
          });
          console.log('Agenda actualizada exitosamente.');
        });
      } else {
        // Si no existe, creamos una nueva agenda
        const turnosRef = collection(this.firestore, 'agendas');
        await addDoc(turnosRef, {
          mailEspecialista: mailEspecialista,
          especialidad: especialidad,
          turnos: turnos
        });
        console.log('Nueva agenda guardada exitosamente.');
      }
    } catch (error) {
      console.error('Error al guardar o actualizar los turnos en Firestore:', error);
    }
  }
}
