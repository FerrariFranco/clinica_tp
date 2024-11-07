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

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'registro-pacientes', component: RegistroPacientesComponent },
  { path: 'registro-especialistas', component: RegistroEspecialistasComponent },
  { path: 'turno', component: SeleccionTurnoComponent },
  { path: 'horarios', component: MisHorariosComponent },
  { path: 'mi-perfil', component: MiPerfilComponent },
  { path: 'turnos', component: TurnosComponent },
  { path: 'usuarios', component: UsuariosComponent, canActivate: [AdminGuard] }, 
  { path: '**', redirectTo: '' },
];
