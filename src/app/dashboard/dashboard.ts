import { CommonModule } from '@angular/common';
import { Component, inject, AfterViewInit, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { AuthService } from '../services/auth.service';
import { Estacion, Punto } from '../models/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements AfterViewInit, OnInit {
  private router = inject(Router);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  map: any; // Guarda la referencia aquí
  misCoches: any[] = [];
  estacionesCount = 0;
  selectedVehicleIndex = 0;
  userRole = 'cliente';
  userName = 'Usuario';

  // Estado del modal de reserva
  showReservaModal = false;
  estacionSeleccionada: Estacion | null = null;
  puntosDisponibles: Punto[] = [];
  reservaForm = this.fb.group({
    punto_id: ['', Validators.required],
    fecha_reserva: [new Date().toISOString().split('T')[0], Validators.required],
    tarifa_id: [''],
  });
  reservandoStatus = false;
  reservaError = '';


  get isAdmin() {
    return this.userRole.toLowerCase() === 'admin';
  }

  get isCliente() {
    return !this.isAdmin;
  }

  get selectedVehicle() {
    return this.misCoches[this.selectedVehicleIndex] ?? null;
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.userRole = user?.rol ?? 'cliente';
    this.userName = user?.nombre ?? user?.name ?? 'Usuario';
    this.cdr.markForCheck();

    if (this.isCliente) {
      this.dataService.getMisVehiculos().subscribe(coches => {
        this.misCoches = coches;
        this.cdr.markForCheck();
      });
    }
  }

  selectVehicle(index: number) {
    this.selectedVehicleIndex = index;
    this.cdr.markForCheck();
  }

  abrirModalReserva(estacion: Estacion) {
    this.estacionSeleccionada = estacion;
    this.puntosDisponibles = estacion.puntos?.filter(p => p.activo === 1) ?? [];
    this.showReservaModal = true;
    this.reservaError = '';
    this.reservaForm.reset({
      punto_id: '',
      fecha_reserva: new Date().toISOString().split('T')[0],
      tarifa_id: '',
    });
    this.cdr.markForCheck();
  }

  cerrarModalReserva() {
    this.showReservaModal = false;
    this.estacionSeleccionada = null;
    this.puntosDisponibles = [];
    this.cdr.markForCheck();
  }

  hacerReserva() {
    this.reservaError = '';
    if (!this.reservaForm.valid || !this.selectedVehicle) {
      this.reservaError = 'Por favor, completa todos los campos.';
      return;
    }

    this.reservandoStatus = true;
    const reserva = {
      vehiculo_id: this.selectedVehicle.id,
      punto_id: Number(this.reservaForm.get('punto_id')?.value),
      fecha_reserva: this.reservaForm.get('fecha_reserva')?.value ?? '',
      tarifa_id: this.reservaForm.get('tarifa_id')?.value ? Number(this.reservaForm.get('tarifa_id')?.value) : null,
    };

    this.dataService.crearReserva(reserva).subscribe({
      next: (res) => {
        this.reservandoStatus = false;
        this.cdr.markForCheck();
        this.cerrarModalReserva();
        // Mostrar mensaje de éxito (opcional)
        alert('¡Reserva realizada con éxito!');
      },
      error: (err) => {
        this.reservandoStatus = false;
        this.reservaError = err?.error?.message || 'Error al realizar la reserva.';
        this.cdr.markForCheck();
      }
    });
  }

  async ngAfterViewInit() {
    if (typeof window !== 'undefined') {
      const L = await import('leaflet');

      // Inicializamos el mapa
      this.map = L.map('map').setView([40.4168, -3.7038], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      this.dataService.getEstaciones().subscribe({
        next: (estaciones) => {
          this.estacionesCount = estaciones.length;
          this.cdr.markForCheck();

          estaciones.forEach(est => {
            const lat = Number(est.latitud);
            const lng = Number(est.longitud);

            if (Number.isNaN(lat) || Number.isNaN(lng)) {
              return;
            }

            const marker = L.marker([lat, lng]).addTo(this.map);
            const ubicacion = [est.ciudad, est.provincia].filter(Boolean).join(', ');

            // Contar puntos activos e inactivos
            const puntosActivos = est.puntos?.filter(p => p.activo === 1).length ?? 0;
            const puntosInactivos = est.puntos?.filter(p => p.activo === 0).length ?? 0;
            const totalPuntos = est.puntos?.length ?? 0;
            const conectoresInfo = `${puntosActivos}/${totalPuntos} disponibles`;

            // Generar tabla de puntos
            let puntosHtml = '<table class="table table-sm mb-2"><tbody>';
            est.puntos?.forEach(punto => {
              const estado = punto.activo === 1 ? '✓ Activo' : '✗ Inactivo';
              const badgeClass = punto.activo === 1 ? 'bg-success' : 'bg-danger';
              puntosHtml += `<tr><td><small>${punto.nombre}</small></td><td><span class="badge ${badgeClass}">${estado}</span></td></tr>`;
            });
            puntosHtml += '</tbody></table>';

            marker.bindPopup(`
              <div style="width: 300px;">
                <b>${est.nombre}</b><br>
                ${est.direccion}<br>
                ${ubicacion ? `<small class="text-muted">${ubicacion}</small><br>` : ''}
                <small class="fw-semibold">Total: ${conectoresInfo}</small>
                <hr class="my-2">
                <div style="max-height: 200px; overflow-y: auto;">
                  ${puntosHtml}
                </div>
                <button id="btn-reserva-${est.id}" class="btn btn-sm btn-primary w-100 mt-2">
                  <i class="fa-solid fa-calendar-check"></i> Hacer reserva
                </button>
              </div>
            `);

            // Agregar listener al botón de reserva
            marker.on('popupopen', () => {
              const btn = document.getElementById(`btn-reserva-${est.id}`);
              if (btn) {
                btn.addEventListener('click', () => {
                  this.abrirModalReserva(est);
                });
              }
            });
          });
        },
        error: (err) => {
          console.error('Error al cargar estaciones:', err);
        }
      });

      // El timeout es perfecto para asegurar que el CSS de Flexbox se aplicó
      setTimeout(() => {
        this.map.invalidateSize();
      }, 200);
    }
  }

  profile() {
    this.router.navigate(['/profile']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
