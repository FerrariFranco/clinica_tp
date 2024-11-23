import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'convertirHora',
  standalone:true
})
export class ConvertirHoraPipe implements PipeTransform {
  transform(value: string): string {
    // Verificamos si el valor es válido (debería ser una cadena con formato HH:mm:ss)
    if (!value) return value;
    
    // Extraemos las partes de la hora y los minutos
    const [hora, minutos] = value.split(':');
    
    // Devolvemos el formato deseado
    return `a las ${hora}:${minutos}`;
  }
}
