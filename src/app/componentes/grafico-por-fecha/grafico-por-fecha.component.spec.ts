import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficoPorFechaComponent } from './grafico-por-fecha.component';

describe('GraficoPorFechaComponent', () => {
  let component: GraficoPorFechaComponent;
  let fixture: ComponentFixture<GraficoPorFechaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoPorFechaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraficoPorFechaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
