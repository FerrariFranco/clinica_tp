import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisHorariosComponent } from './mis-horarios.component';

describe('MisHorariosComponent', () => {
  let component: MisHorariosComponent;
  let fixture: ComponentFixture<MisHorariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisHorariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisHorariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
