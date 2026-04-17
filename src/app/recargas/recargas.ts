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
  selectedRecargaId: number | null = null;
  selectedReserva: Recarga | null = null;
  detalleLoading = false;
  detalleError = '';
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
          this.recargas = data ?? [];
          this.loading = false;
        },
        error: (err: { error?: { message?: string } }) => {
          console.error('[recargas] error:', err);
          this.error = err?.error?.message || 'No se pudieron cargar las recargas.';
          this.recargas = [];
          this.loading = false;
        }
      });
  }

  toggleReservaDetalle(recarga: Recarga) {
    if (this.selectedRecargaId === recarga.id) {
      this.selectedRecargaId = null;
      this.selectedReserva = null;
      this.detalleError = '';
      this.detalleLoading = false;
      return;
    }

    this.selectedRecargaId = recarga.id;
    this.selectedReserva = null;
    this.detalleError = '';

    const reservaId = recarga.reserva_id;
    if (!reservaId) {
      this.detalleError = 'Esta recarga no tiene una reserva asociada.';
      return;
    }

    this.detalleLoading = true;

    this.dataService.getReservas().subscribe({
      next: (reservas: Recarga[]) => {
        const lista = reservas ?? [];

        if (lista.length === 0) {
          this.detalleError = 'No se encontro la reserva asociada a esta recarga.';
          this.detalleLoading = false;
          return;
        }

        this.selectedReserva = lista[0];
        this.detalleLoading = false;
      },
      error: (err: { error?: { message?: string } }) => {
        this.detalleError = err?.error?.message || 'No se pudo cargar la reserva asociada.';
        this.detalleLoading = false;
      }
    });
  }
}
