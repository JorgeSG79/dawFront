import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { DataService } from '../services/data.service';
import { AuthService } from '../services/auth.service';
import { Tarifa } from '../models/interfaces';

@Component({
  selector: 'app-admin-tarifas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-tarifas.html',
  styleUrl: './admin-tarifas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTarifas implements OnInit {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  tarifas: Tarifa[] = [];
  loading = true;
  submitting = false;
  deletingId: number | null = null;
  error = '';
  success = '';
  editingId: number | null = null;

  form = {
    nombre: '',
    precio_kwh: '',
  };

  ngOnInit() {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadTarifas();
  }

  private loadTarifas() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.dataService.getTarifas()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (tarifas) => {
          this.tarifas = Array.isArray(tarifas) ? tarifas : [];
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudieron cargar las tarifas.';
          this.tarifas = [];
          this.cdr.markForCheck();
        }
      });
  }

  editTarifa(tarifa: Tarifa) {
    this.editingId = tarifa.id;
    this.form.nombre = tarifa.nombre ?? '';
    this.form.precio_kwh = String(tarifa.precio_kwh ?? '');
    this.error = '';
    this.success = '';
    this.cdr.markForCheck();
  }

  cancelEdit() {
    this.editingId = null;
    this.form = { nombre: '', precio_kwh: '' };
    this.error = '';
    this.success = '';
    this.cdr.markForCheck();
  }

  submitTarifa() {
    this.error = '';
    this.success = '';

    const nombre = this.form.nombre.trim();
    const precio = Number(this.form.precio_kwh);

    if (!nombre || Number.isNaN(precio) || precio < 0) {
      this.error = 'Introduce un nombre y un precio por kWh valido.';
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    const payload = { nombre, precio_kwh: precio };
    const request$ = this.editingId
      ? this.dataService.actualizarTarifa(this.editingId, payload)
      : this.dataService.crearTarifa(payload);

    request$
      .pipe(
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.success = this.editingId ? 'Tarifa actualizada correctamente.' : 'Tarifa creada correctamente.';
          this.editingId = null;
          this.form = { nombre: '', precio_kwh: '' };
          this.loadTarifas();
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo guardar la tarifa.';
          this.cdr.markForCheck();
        }
      });
  }

  deleteTarifa(tarifa: Tarifa) {
    const confirmed = window.confirm(`¿Eliminar la tarifa "${tarifa.nombre}"?`);
    if (!confirmed) {
      return;
    }

    this.error = '';
    this.success = '';
    this.deletingId = tarifa.id;
    this.cdr.markForCheck();

    this.dataService.eliminarTarifa(tarifa.id)
      .pipe(
        finalize(() => {
          this.deletingId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          if (this.editingId === tarifa.id) {
            this.cancelEdit();
          }
          this.success = 'Tarifa eliminada correctamente.';
          this.loadTarifas();
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo eliminar la tarifa.';
          this.cdr.markForCheck();
        }
      });
  }
}
