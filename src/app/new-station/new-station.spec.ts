import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewStation } from './new-station';

describe('NewStation', () => {
  let component: NewStation;
  let fixture: ComponentFixture<NewStation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewStation],
    }).compileComponents();

    fixture = TestBed.createComponent(NewStation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
