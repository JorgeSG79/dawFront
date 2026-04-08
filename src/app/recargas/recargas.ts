import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { DataService } from '../services/data.service';
import { AuthService } from '../services/auth.service';
import { Recarga } from '../models/interfaces';

@Component({
  selector: 'app-recargas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recargas.html',
  styleUrl: './recargas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Recargas implements OnInit {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  recargas: Recarga[] = [];
  loading = true;
  error = '';
  isAdmin = false;

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.cdr.markForCheck();
    this.loadRecargas();
  }

  private loadRecargas() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    // El backend discrimina automaticamente segun el token
    this.dataService.getRecargas()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.recargas = Array.isArray(data) ? data : [];
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudieron cargar las recargas.';
          this.recargas = [];
          this.cdr.markForCheck();
        }
      });
  }
}
