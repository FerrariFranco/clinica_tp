import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../servicios/auth.service';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EspecialistaGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.getUserRole().pipe(
      take(1),
      map(role => role === 'especialista'),
      tap(isEspecialista => {
        if (!isEspecialista) {
          this.router.navigate(['/home']); 
        }
      })
    );
  }
}
