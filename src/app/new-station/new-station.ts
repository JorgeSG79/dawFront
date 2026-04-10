import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DataService } from '../services/data.service';
import { AuthService } from '../services/auth.service';
import { Estacion, Punto } from '../models/interfaces';

@Component({
  selector: 'app-new-station',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './new-station.html',
  styleUrl: './new-station.css',
})
export class NewStation implements OnInit {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loadingStation = false;
  submitting = false;
  success = false;
  error = '';
  isEditMode = false;
  editStationId: number | null = null;
  readonly tarifasDisponibles = [
    { id: 1, nombre: 'Tarifa 1 - Económica' },
    { id: 2, nombre: 'Tarifa 2 - Estándar' },
    { id: 3, nombre: 'Tarifa 3 - Premium' },
  ];

  stationData = {
    nombre: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigo_postal: '',
    latitud: '',
    longitud: '',
    num_puntos: null as number | null,
    conectores_disponibles: '',
    activo: 1,
    tarifa_id: 1,
  };

  ngOnInit() {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    const stationIdParam = this.route.snapshot.paramMap.get('id') ?? this.route.snapshot.queryParamMap.get('stationId');
    const parsedId = stationIdParam ? Number(stationIdParam) : Number.NaN;
    if (Number.isFinite(parsedId) && parsedId > 0) {
      this.isEditMode = true;
      this.editStationId = parsedId;

      const stationFromState = (typeof window !== 'undefined'
        ? window.history.state?.station
        : undefined) as Estacion | undefined;
      if (stationFromState && Number(stationFromState.id) === parsedId) {
        this.stationData = this.mapStationToForm(stationFromState);
      }

      this.cargarEstacionParaEdicion(parsedId);
    }
  }

  private cargarEstacionParaEdicion(stationId: number) {
    this.loadingStation = true;
    this.error = '';

    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      this.loadingStation = false;
      this.error = 'No se pudo cargar la estación para edición (timeout).';
    }, 8000);

    this.dataService.getEstaciones()
      .subscribe({
      next: (estaciones) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        this.loadingStation = false;
        const station = estaciones.find((item) => Number(item.id) === stationId);
        if (!station) {
          this.error = 'No se encontró la estación a editar.';
          return;
        }

        this.stationData = this.mapStationToForm(station);
      },
      error: () => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        this.loadingStation = false;
        this.error = 'No se pudo cargar la estación para edición.';
      }
    });
  }

  private mapStationToForm(station: Estacion) {
    const conectores = this.extraerConectores(station.puntos ?? []);
    return {
      nombre: station.nombre ?? '',
      direccion: station.direccion ?? '',
      ciudad: station.ciudad ?? '',
      provincia: station.provincia ?? '',
      codigo_postal: station.codigo_postal ?? '',
      latitud: String(station.latitud ?? ''),
      longitud: String(station.longitud ?? ''),
      num_puntos: station.puntos?.length ?? station.num_puntos ?? null,
      conectores_disponibles: conectores,
      activo: 1,
      tarifa_id: Number(station.tarifa?.id ?? 1),
    };
  }

  private extraerConectores(puntos: Punto[]): string {
    const setConectores = new Set<string>();
    puntos.forEach((punto) => {
      const nombre = (punto.nombre ?? '').trim();
      if (nombre) {
        setConectores.add(nombre);
      }
    });
    return Array.from(setConectores).join(', ');
  }

  updateField(field: keyof typeof this.stationData, event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    (this.stationData as any)[field] = target.value;
  }

  updateNumPoints(event: Event) {
    const target = event.target as HTMLInputElement;
    this.stationData.num_puntos = target.value ? Number(target.value) : null;
  }

  updateActivo(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.stationData.activo = Number(target.value);
  }

  updateTarifa(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.stationData.tarifa_id = Number(target.value);
  }

  private releaseSubmitting() {
    setTimeout(() => {
      this.submitting = false;
    }, 150);
  }

  submit() {
    this.error = '';
    this.success = false;

    if (
      !this.stationData.nombre.trim() ||
      !this.stationData.direccion.trim() ||
      !this.stationData.ciudad.trim() ||
      !this.stationData.provincia.trim() ||
      !this.stationData.latitud.trim() ||
      !this.stationData.longitud.trim() ||
      !this.stationData.tarifa_id
    ) {
      this.error = 'Completa todos los campos obligatorios.';
      return;
    }

    this.submitting = true;
    const payload = {
      nombre: this.stationData.nombre,
      direccion: this.stationData.direccion,
      ciudad: this.stationData.ciudad,
      provincia: this.stationData.provincia,
      codigo_postal: this.stationData.codigo_postal,
      latitud: this.stationData.latitud,
      longitud: this.stationData.longitud,
      tarifa_id: this.stationData.tarifa_id,
      num_puntos: this.stationData.num_puntos,
      conectores_disponibles: this.stationData.conectores_disponibles,
      activo: this.stationData.activo,
    };

    const request$ = this.isEditMode && this.editStationId
      ? this.dataService.actualizarEstacion(this.editStationId, payload)
      : this.dataService.crearEstacion(payload);

    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      this.releaseSubmitting();
      this.error = this.isEditMode
        ? 'La actualización tardó demasiado. Revisa conexión o backend.'
        : 'La creación tardó demasiado. Revisa conexión o backend.';
    }, 15000);

    request$.subscribe({
      next: () => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeoutId);
        this.releaseSubmitting();
        this.success = true;

        if (this.isEditMode) {
          return;
        }

        this.stationData = {
          nombre: '', direccion: '', ciudad: '', provincia: '',
          codigo_postal: '', latitud: '', longitud: '',
          num_puntos: null, conectores_disponibles: '', activo: 1, tarifa_id: 1,
        };
      },
      error: () => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeoutId);
        this.releaseSubmitting();
        this.error = this.isEditMode
          ? 'Error al actualizar la estación. Inténtalo de nuevo.'
          : 'Error al crear la estación. Inténtalo de nuevo.';
      }
    });
  }
}
