import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, query, where, getDocs, addDoc, updateDoc, doc } from '@angular/fire/firestore';
import { AuthService } from '../../servicios/auth.service'; 
import { firstValueFrom } from 'rxjs';
import { SeleccionDiaDirective } from '../../directivas/seleccion-dia.directive';

@Component({
  selector: 'app-mis-horarios',
  templateUrl: './mis-horarios.component.html',
  styleUrls: ['./mis-horarios.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SeleccionDiaDirective]
})

export class MisHorariosComponent implements OnInit {

  horariosForm: FormGroup;
  dias: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  diasSeleccionados: string[] = [];
  turnos: any[] = []; 
  especialidades: string[] = [];
  especialidadSeleccionada: string = '';

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
    const selectElement = event.target as HTMLSelectElement; 
    this.especialidadSeleccionada = selectElement.value;  
  }

  async generarTurnosDisponibles(): Promise<void> {
    const horaInicio = this.horariosForm.value.horaInicio;
    const horaFin = this.horariosForm.value.horaFin;
    const minutosIntervalo = 30; // Intervalo de 30 minutos entre turnos
    const ahora = new Date();
    const diasAdelante = 30;

    this.turnos = []; // Reseteamos el array de turnos
  
    const usuario = await firstValueFrom(this.authService.getCurrentUser());
    if (!usuario) return;
    console.log("xd", usuario);
    

    
    const mailEspecialista = usuario.email;
  
    // Obtener turnos ya existentes
    const agendasRef = collection(this.firestore, 'agendas');
    const q = query(agendasRef, where('mailEspecialista', '==', mailEspecialista));
    const querySnapshot = await getDocs(q);
  
    const turnosExistentes: { fecha: string; horarios: string[] }[] = [];
    querySnapshot.forEach(docSnapshot => {
      const data = docSnapshot.data();
      if (data['especialidad'] !== this.especialidadSeleccionada) {
        turnosExistentes.push(...data['turnos']);
      }
    });
  
    let nuevosTurnos: { fecha: string; horarios: string[] }[] = [];
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
  
        const fechaKey = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        let horarios: string[] = [];

  
        while (horaActual < horaLimite) {
          const horario = `${horaActual.getHours()}:${horaActual.getMinutes() < 10 ? '0' : ''}${horaActual.getMinutes()}`;
  
          // Validar si el horario no se solapa
          const yaOcupado = turnosExistentes.some(t => 
            t.fecha === fechaKey && t.horarios.includes(horario)
          );
          if (!yaOcupado) {
    
            horarios.push(horario);
          }
  
          horaActual.setMinutes(horaActual.getMinutes() + minutosIntervalo);
        }

        if (horarios.length > 0) {
          nuevosTurnos.push({ fecha: fechaKey, horarios });
        }
      }
    }
  
    if (nuevosTurnos.length === 0) {
      console.error('Todos los horarios seleccionados se solapan con los existentes.');
      return;
    }
  
    this.turnos = nuevosTurnos;
    await this.guardarTurnosEnFirestore(mailEspecialista, nuevosTurnos, this.especialidadSeleccionada);
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
          const docRef = doc(this.firestore, 'agendas', docSnapshot.id); 
          await updateDoc(docRef, {
            turnos: turnos 
          });
          console.log('Agenda actualizada exitosamente.');
        });
      } else {
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
