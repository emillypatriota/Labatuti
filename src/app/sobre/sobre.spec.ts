import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SobreComponent } from './sobre';

describe('SobreComponent', () => {
  let component: SobreComponent;
  let fixture: ComponentFixture<SobreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SobreComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SobreComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});