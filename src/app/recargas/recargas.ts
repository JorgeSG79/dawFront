import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../services/data.service';
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

  recargas: Recarga[] = [];
  loading = true;
  error = '';
  isAdmin = false;

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        const rol = (user?.rol ?? user?.role ?? '').toLowerCase();
        this.isAdmin = rol === 'admin';
      } catch {
        this.isAdmin = false;
      }
    }

    const llamada$ = this.isAdmin
      ? this.dataService.getTodasRecargas()
      : this.dataService.getMisRecargas();

    llamada$.subscribe({
      next: (data) => {
        this.recargas = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las recargas.';
        this.loading = false;
      }
    });
  }
}
