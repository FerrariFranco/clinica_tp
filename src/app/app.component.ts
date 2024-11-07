import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './componentes/navbar/navbar.component';
import { RecaptchaDirective } from './directivas/recaptcha.directive'; // Ajusta la ruta si es necesario
import { AlertComponent } from './componentes/alert/alert.component';
import { Alert, AlertService } from './servicios/alert.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AlertComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
   
})
export class AppComponent implements OnInit {
  alerts: Alert[] = [];

  constructor(private alertService: AlertService) {}

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
