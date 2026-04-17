import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

import { Recargas } from './recargas';
import { DataService } from '../services/data.service';
import { AuthService } from '../services/auth.service';

describe('Recargas', () => {
  let component: Recargas;
  let fixture: ComponentFixture<Recargas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recargas],
      providers: [
        provideRouter([]),
        {
          provide: DataService,
          useValue: {
            getHistorialRecargas: () => of([]),
          },
        },
        {
          provide: AuthService,
          useValue: {
            isAdmin: () => false,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Recargas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
