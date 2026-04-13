import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { DataService } from '../services/data.service';
import { AuthService } from '../services/auth.service';
import { Estacion, Recarga, Tarifa } from '../models/interfaces';

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
  tarifas: Tarifa[] = [];
  loading = true;
  error = '';
  isAdmin = false;

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.cdr.markForCheck();
    this.loadTarifas();
    this.loadRecargas();
  }

  getTarifaPrecio(recarga: Recarga): string {
    if (recarga.precio_kwh !== undefined && recarga.precio_kwh !== null) {
      return `${recarga.precio_kwh} €/kWh`;
    }

    if (recarga.tarifa_precio !== undefined && recarga.tarifa_precio !== null) {
      return `${recarga.tarifa_precio} €/kWh`;
    }

    if (!recarga.tarifa_id) {
      return 'Sin tarifa';
    }

    const tarifa = this.tarifas.find((item) => item.id === recarga.tarifa_id);
    if (!tarifa) {
      return 'Precio no disponible';
    }

    return `${tarifa.precio_kwh} €/kWh`;
  }

  private loadTarifas() {
    this.dataService.getTarifas().subscribe({
      next: (data) => {
        this.tarifas = Array.isArray(data) ? data : [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadTarifasDesdeEstaciones();
      }
    });
  }

  private loadTarifasDesdeEstaciones() {
    this.dataService.getEstaciones().subscribe({
      next: (estaciones) => {
        const mapTarifas = new Map<number, Tarifa>();
        (Array.isArray(estaciones) ? estaciones : []).forEach((estacion: Estacion) => {
          if (estacion.tarifa?.id !== undefined && estacion.tarifa?.id !== null) {
            mapTarifas.set(estacion.tarifa.id, estacion.tarifa);
          }
        });
        this.tarifas = Array.from(mapTarifas.values());
        this.cdr.markForCheck();
      },
      error: () => {
        this.tarifas = [];
        this.cdr.markForCheck();
      }
    });
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
