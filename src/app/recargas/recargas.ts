import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../services/data.service';
import { AuthService } from '../services/auth.service';
import { Recarga } from '../models/interfaces';

@Component({
  selector: 'app-recargas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recargas.html',
  styleUrl: './recargas.css',
})
export class Recargas implements OnInit {
  private dataService = inject(DataService);
  private authService = inject(AuthService);

  recargas: Recarga[] = [];
  loading = true;
  error = '';
  isAdmin = false;

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.loadRecargas();
  }

  private loadRecargas() {
    this.loading = true;
    this.error = '';

    this.dataService.getHistorialRecargas()
      .subscribe({
        next: (data: Recarga[]) => {
          this.recargas = Array.isArray(data) ? data : [];
          this.loading = false;
        },
        error: (err: { error?: { message?: string } }) => {
          this.error = err?.error?.message || 'No se pudieron cargar las recargas.';
          this.recargas = [];
          this.loading = false;
        }
      });
  }
}
