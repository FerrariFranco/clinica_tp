import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, updateDoc, doc, getDoc } from '@angular/fire/firestore';
import { RegistroPacientesComponent } from '../registro-pacientes/registro-pacientes.component';
import { RegistroEspecialistasComponent } from '../registro-especialistas/registro-especialistas.component';
import { RegistroComponent } from '../registro/registro.component';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx'; // Importamos la librería XLSX
import { DniPipe } from '../../pipes/dni.pipe'; // Asegúrate de que la pipe está en la ruta correcta
import { CapitalizePipe } from '../../pipes/capitalize.pipe'; 
@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
  standalone:true,
  imports: [CommonModule, RegistroComponent, RegistroEspecialistasComponent, RegistroPacientesComponent, FormsModule, DniPipe, CapitalizePipe]
})
export class UsuariosComponent implements OnInit {
  especialistas: any[] = [];
  pacientes: any[] = [];
  historiasClinicas: any[] = [];
  loading = true;
  mostrarModal = false;
  componenteActivo: string | null = null; // Almacena el componente activo
  captchaActivado: boolean = false; // Estado del checkbox
  captchaDocId: string = 'captcha'; // ID del
  administradores: any[] = [];

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    this.loadUsers();
    this.getCaptchaState();

  }
// Obtener el estado de 'activado' del captcha desde Firestore
async getCaptchaState(): Promise<void> {
  try {
    const captchaRef = doc(this.firestore, 'captcha', this.captchaDocId); // Usa el documento específico
    const docSnapshot = await getDoc(captchaRef); // Usamos getDoc en lugar de getDocs
    if (docSnapshot.exists()) {
      const captchaData = docSnapshot.data() as any;
      this.captchaActivado = captchaData.activado; // Asigna el estado al checkbox
    } else {
      console.error('Documento no encontrado');
    }
  } catch (error) {
    console.error('Error al obtener estado del captcha:', error);
  }
}

// Actualizar el estado de 'activado' del captcha en Firestore
async toggleCaptchaState(): Promise<void> {
  const newState = this.captchaActivado;
  try {
    const captchaRef = doc(this.firestore, 'captcha', this.captchaDocId);
    await updateDoc(captchaRef, { activado: newState });
    console.log('Estado de captcha actualizado:', newState);
  } catch (error) {
    console.error('Error al actualizar el estado del captcha:', error);
  }
}
async loadUsers() {
  try {
    // Cargar especialistas
    const especialistasRef = collection(this.firestore, 'especialistas');
    const especialistasSnapshot = await getDocs(especialistasRef);
    this.especialistas = especialistasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Cargar pacientes
    const pacientesRef = collection(this.firestore, 'pacientes');
    const pacientesSnapshot = await getDocs(pacientesRef);
    this.pacientes = pacientesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Cargar administradores
    const usuariosRef = collection(this.firestore, 'usuarios');
    const usuariosSnapshot = await getDocs(usuariosRef);
    this.administradores = usuariosSnapshot.docs
      .map(doc => doc.data())
      .filter(user => user['rol'] === 'admin');
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
  } finally {
    this.loading = false;
  }
}
  mostrarComponente(componente: string) {
    // Activa el componente seleccionado y desactiva los otros
    this.componenteActivo = this.componenteActivo === componente ? null : componente;
  }
  async toggleEspecialistaHabilitado(especialista: any) {
    try {
      const especialistaDoc = doc(this.firestore, 'especialistas', especialista.id);
      await updateDoc(especialistaDoc, { autorizado: !especialista.autorizado });
      especialista.autorizado = !especialista.autorizado; // Actualizar localmente
    } catch (error) {
      console.error('Error al actualizar estado de especialista:', error);
    }
  }
  async verHistoriaClinica(emailPaciente: string) {
    try {
      const historiasRef = collection(this.firestore, 'historiasClinicas');
      const querySnapshot = await getDocs(historiasRef);

      this.historiasClinicas = querySnapshot.docs
        .map(doc => doc.data())
        .filter(historia => historia['mailPaciente'] === emailPaciente);

      if (this.historiasClinicas.length === 0) {
        alert(`No se encontraron historias clínicas para el paciente: ${emailPaciente}`);
      } else {
        this.mostrarModal = true; // Mostrar el modal
      }
    } catch (error) {
      console.error('Error al cargar historias clínicas:', error);
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.historiasClinicas = []; // Limpiar las historias cargadas
  }

  async descargarTurnosPaciente(emailPaciente: string) {
    try {
      // Referencia a la colección de turnos
      const turnosRef = collection(this.firestore, 'turnosPaciente');
      const turnosSnapshot = await getDocs(turnosRef);
  
      // Filtrar los turnos que correspondan al paciente seleccionado
      const turnosPaciente = turnosSnapshot.docs
        .map(doc => doc.data())
        .filter((turno: any) => turno.mailPaciente === emailPaciente);
  
      // Validar si se encontraron turnos
      if (turnosPaciente.length === 0) {
        alert(`No se encontraron turnos para el paciente: ${emailPaciente}`);
        return;
      }
  
      // Crear un array plano con los turnos
      const turnosExportar = turnosPaciente.flatMap(turno => turno['turnos'].map((t: any) => ({
        Especialidad: t.especialidad,
        Especialista: t.especialista,
        Estado: t.estado,
        Fecha: t.fecha,
        Hora: t.hora,
        ID: t.id,
        MailEspecialista: t.mailEspecialista,
      })));
  
      // Generar el archivo Excel
      const worksheet = XLSX.utils.json_to_sheet(turnosExportar);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Turnos');
  
      // Descargar el archivo
      const nombreArchivo = `Turnos_${emailPaciente}.xlsx`;
      XLSX.writeFile(workbook, nombreArchivo);
  
      console.log('Archivo descargado:', nombreArchivo);
    } catch (error) {
      console.error('Error al generar el archivo Excel:', error);
    }
}
}