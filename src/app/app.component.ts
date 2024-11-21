import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './componentes/navbar/navbar.component';
import { AlertComponent } from './componentes/alert/alert.component';
import { Alert, AlertService } from './servicios/alert.service';
import { CommonModule } from '@angular/common';
import { routeAnimations } from './animations';
import { ChildrenOutletContexts } from '@angular/router';  // Importar ChildrenOutletContexts

import { routeAnimationsDos } from './animationsdos'; 
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AlertComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations:[routeAnimations, routeAnimationsDos]
   
})
export class AppComponent implements OnInit {
  title(title: any) {
    throw new Error('Method not implemented.');
  }
  alerts: Alert[] = [];

  constructor(private alertService: AlertService,private contexts: ChildrenOutletContexts) {}
  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }
  ngOnInit(): void {
    this.alertService.alert$.subscribe(alert => {
      this.alerts.push(alert);
      // Ocultar la alerta después de 3 segundos
      setTimeout(() => {
        this.alerts = this.alerts.filter(a => a !== alert);
      }, 3000);
    });
  }
}
