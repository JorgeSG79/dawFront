import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-new-station',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './new-station.html',
  styleUrl: './new-station.css',
})
export class NewStation {
  private dataService = inject(DataService);

  loading = false;
  success = false;
  error = '';

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
  };

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
      this.stationData.num_puntos === null
    ) {
      this.error = 'Completa todos los campos obligatorios.';
      return;
    }

    this.loading = true;
    this.dataService.crearEstacion({
      ...this.stationData,
      num_puntos: this.stationData.num_puntos!,
      conectores_disponibles: this.stationData.conectores_disponibles || null,
    }).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        this.stationData = {
          nombre: '', direccion: '', ciudad: '', provincia: '',
          codigo_postal: '', latitud: '', longitud: '',
          num_puntos: null, conectores_disponibles: '', activo: 1,
        };
      },
      error: () => {
        this.error = 'Error al crear la estación. Inténtalo de nuevo.';
        this.loading = false;
      }
    });
  }
}
