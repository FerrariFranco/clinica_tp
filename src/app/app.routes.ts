import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { RegistroComponent } from './componentes/registro/registro.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegistroPacientesComponent } from './componentes/registro-pacientes/registro-pacientes.component';
import { RegistroEspecialistasComponent } from './componentes/registro-especialistas/registro-especialistas.component';
import { UsuariosComponent } from './componentes/usuarios/usuarios.component';
import { AdminGuard } from './guards/admin.guard'; 
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'registro-pacientes', component: RegistroPacientesComponent },
  { path: 'registro-especialistas', component: RegistroEspecialistasComponent },
  { path: 'usuarios', component: UsuariosComponent, canActivate: [AdminGuard] }, 
  { path: '**', redirectTo: '' },
];
