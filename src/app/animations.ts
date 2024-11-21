import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  // Transición lenta entre Home y MiPerfilPaciente
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

  // Transición rápida para todas las demás
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
  ])
]);
