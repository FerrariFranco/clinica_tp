import { trigger, transition, style, query, animate, group, keyframes } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  // Transición de un componente hacia MiPerfilPaciente
  transition('* => MiPerfilPaciente', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({ position: 'absolute', top: 0, left: 0, width: '100%' })
    ], { optional: true }),
    query(':enter', [style({ left: '100%', opacity: 0 })], { optional: true }),
    group([
      query(':leave', [animate('500ms ease-out', style({ left: '-100%', opacity: 0 }))], { optional: true }),
      query(':enter', [animate('700ms ease-out', style({ left: '0%', opacity: 1 }))], { optional: true })
    ])
  ]),

  // Transición de izquierda a derecha (debe ser utilizado en la ruta adecuada)
  transition('* => leftToRight', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({ position: 'absolute', top: 0, left: 0, width: '100%' })
    ], { optional: true }),
    query(':enter', [style({ left: '-100%', opacity: 0 })], { optional: true }),
    group([
      query(':leave', [animate('300ms ease-out', style({ left: '100%', opacity: 0 }))], { optional: true }),
      query(':enter', [animate('300ms ease-out', style({ left: '0%', opacity: 1 }))], { optional: true })
    ])
  ]),

  // Transición de abajo hacia arriba
  transition('* => bottomToTop', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({ position: 'absolute', top: 0, left: 0, width: '100%' })
    ], { optional: true }),
    query(':enter', [style({ bottom: '-100%', opacity: 0 })], { optional: true }),
    group([
      query(':leave', [animate('300ms ease-out', style({ bottom: '100%', opacity: 0 }))], { optional: true }),
      query(':enter', [animate('500ms ease-out', style({ bottom: '0%', opacity: 1 }))], { optional: true })
    ])
  ]),

  // Transición de desvanecimiento
  transition('* => fade', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({ position: 'absolute', top: 0, left: 0, width: '100%' })
    ], { optional: true }),
    query(':enter', [style({ opacity: 0 })], { optional: true }),
    group([
      query(':leave', [animate('300ms ease-out', style({ opacity: 0 }))], { optional: true }),
      query(':enter', [animate('300ms ease-out', style({ opacity: 1 }))], { optional: true })
    ])
  ]),
  transition('* => shake', [
    style({ position: 'relative' }),
    query(':enter', [
      style({ transform: 'translateX(0)', opacity: 1 })
    ], { optional: true }),
    animate('0.6s', keyframes([
      style({ transform: 'translateX(0)', offset: 0 }),
      style({ transform: 'translateX(-10px)', offset: 0.25 }),
      style({ transform: 'translateX(10px)', offset: 0.5 }),
      style({ transform: 'translateX(-10px)', offset: 0.75 }),
      style({ transform: 'translateX(0)', offset: 1 })
    ]))
  ]),transition('* => shakeVertical', [
    style({ position: 'relative' }),
    query(':enter', [
      style({ transform: 'translateY(0)', opacity: 1 })
    ], { optional: true }),
    animate('0.6s', keyframes([
      style({ transform: 'translateY(0)', offset: 0 }),
      style({ transform: 'translateY(-10px)', offset: 0.25 }),
      style({ transform: 'translateY(10px)', offset: 0.5 }),
      style({ transform: 'translateY(-10px)', offset: 0.75 }),
      style({ transform: 'translateY(0)', offset: 1 })
    ]))
  ]),transition('* => rotateIn', [
    style({ transform: 'rotate(0deg)' }), // Estado inicial sin rotación
    animate('500ms ease-in-out', style({ transform: 'rotate(360deg)' })) // Gira 360 grados
  ]),
  // Transición general entre cualquier ruta
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({ position: 'absolute', top: 0, left: 0, width: '100%' })
    ], { optional: true }),
    query(':enter', [style({ left: '100%', opacity: 0 })], { optional: true }),
    group([
      query(':leave', [animate('200ms ease-out', style({ left: '-100%', opacity: 0 }))], { optional: true }),
      query(':enter', [animate('200ms ease-out', style({ left: '0%', opacity: 1 }))], { optional: true })
    ])
  ]),
]);
