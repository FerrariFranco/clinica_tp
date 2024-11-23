import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dni',
  standalone:true
})
export class DniPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return value;
    
    // Asegúrate de que el valor sea un número válido y elimine cualquier carácter no numérico
    const cleanedValue = value.replace(/\D/g, '');

    // Formatear el número con puntos cada 3 dígitos
    const formattedValue = cleanedValue.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');

    return formattedValue;
  }
}
