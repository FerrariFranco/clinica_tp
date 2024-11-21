import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { RegistroComponent } from './componentes/registro/registro.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegistroPacientesComponent } from './componentes/registro-pacientes/registro-pacientes.component';
import { RegistroEspecialistasComponent } from './componentes/registro-especialistas/registro-especialistas.component';
import { UsuariosComponent } from './componentes/usuarios/usuarios.component';
import { AdminGuard } from './guards/admin.guard'; 
import { AuthGuard } from './guards/auth.guard';
import { SeleccionTurnoComponent } from './componentes/seleccion-turno/seleccion-turno.component';
import { MisHorariosComponent } from './componentes/mis-horarios/mis-horarios.component';
import { MiPerfilComponent } from './componentes/mi-perfil/mi-perfil.component';
import { TurnosComponent } from './componentes/turnos/turnos.component';
import { TurnosEspecialistaComponent } from './componentes/turnos-especialista/turnos-especialista.component';
import { MiPerfilPacienteComponent } from './componentes/mi-perfil-paciente/mi-perfil-paciente.component';
import { TurnosPacienteComponent } from './componentes/turnos-paciente/turnos-paciente.component';
import { PacientesComponent } from './componentes/pacientes/pacientes.component';
import { RegistroSeleccionComponent } from './componentes/registro-seleccion/registro-seleccion.component';
import { InformesComponent } from './componentes/informes/informes.component';
import { EspecialistaGuard } from './guards/especialista.guard';
import { PacienteGuard } from './guards/paciente.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, data: { animation: 'Home' } },
  { path: 'login', component: LoginComponent, data: { animation: 'Default' } },
  { path: 'registro', component: RegistroComponent, data: { animation: 'Default' } },
  { path: 'registro-seleccion', component: RegistroSeleccionComponent , data: { animation: 'Default' }},
  { path: 'registro-pacientes', component: RegistroPacientesComponent },
  { path: 'registro-especialistas', component: RegistroEspecialistasComponent },
  { path: 'turno', component: SeleccionTurnoComponent, canActivate: [PacienteGuard, AuthGuard], data: { animation: 'Default' } },
  { path: 'horarios', component: MisHorariosComponent, canActivate: [EspecialistaGuard, AuthGuard], data: { animation: 'Default' } },
  { path: 'mi-perfil', component: MiPerfilComponent, canActivate: [EspecialistaGuard, AuthGuard] , data: { animation: 'MiPerfilPaciente' }},
  { path: 'mi-perfil-paciente', component: MiPerfilPacienteComponent, canActivate: [PacienteGuard, AuthGuard], data: { animation: 'MiPerfilPaciente' } },
  { path: 'turnos-paciente', component: TurnosPacienteComponent, canActivate: [PacienteGuard, AuthGuard], data: { animation: 'Default' } },
  { path: 'turnos', component: TurnosComponent, canActivate: [AdminGuard, AuthGuard] },
  { path: 'informes', component: InformesComponent, canActivate: [AdminGuard, AuthGuard], data: { animation: 'Default' } },
  { path: 'pacientes', component: PacientesComponent, canActivate: [EspecialistaGuard, AuthGuard], data: { animation: 'Default' } },
  { path: 'turnos-especialista', component: TurnosEspecialistaComponent, canActivate: [EspecialistaGuard, AuthGuard] },
  { path: 'usuarios', component: UsuariosComponent, canActivate: [AdminGuard, AuthGuard] }, 
  { path: '**', redirectTo: '' },
];
