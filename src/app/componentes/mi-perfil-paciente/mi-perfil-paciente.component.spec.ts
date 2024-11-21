import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiPerfilPacienteComponent } from './mi-perfil-paciente.component';

describe('MiPerfilPacienteComponent', () => {
  let component: MiPerfilPacienteComponent;
  let fixture: ComponentFixture<MiPerfilPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiPerfilPacienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiPerfilPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
