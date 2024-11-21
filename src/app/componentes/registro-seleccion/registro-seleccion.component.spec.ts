import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroSeleccionComponent } from './registro-seleccion.component';

describe('RegistroSeleccionComponent', () => {
  let component: RegistroSeleccionComponent;
  let fixture: ComponentFixture<RegistroSeleccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroSeleccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroSeleccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
