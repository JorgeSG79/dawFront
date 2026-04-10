import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../services/data.service';
import { AuthService } from '../services/auth.service';

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

  loading = false;
  success = false;
  error = '';
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
    }
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

    this.loading = true;
    this.dataService.crearEstacion({
      nombre: this.stationData.nombre,
      direccion: this.stationData.direccion,
      ciudad: this.stationData.ciudad,
      provincia: this.stationData.provincia,
      codigo_postal: this.stationData.codigo_postal,
      latitud: this.stationData.latitud,
      longitud: this.stationData.longitud,
      tarifa_id: this.stationData.tarifa_id,
    }).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        this.stationData = {
          nombre: '', direccion: '', ciudad: '', provincia: '',
          codigo_postal: '', latitud: '', longitud: '',
          num_puntos: null, conectores_disponibles: '', activo: 1, tarifa_id: 1,
        };
      },
      error: () => {
        this.error = 'Error al crear la estación. Inténtalo de nuevo.';
        this.loading = false;
      }
    });
  }
}
