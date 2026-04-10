import { CommonModule } from '@angular/common';
import { Component, inject, AfterViewInit, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, NgZone, ElementRef, ViewChild } from '@angular/core';
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
export class Dashboard implements AfterViewInit, OnInit, OnDestroy {
  private router = inject(Router);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private ngZone = inject(NgZone);
  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;
  private resizeListener?: () => void;
  map: any; // Guarda la referencia aquí
  adminMapHeightPx: number | null = null;
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
    tarifa_id: [null as number | null],
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

  private resolveIsAdmin(user: any): boolean {
    const candidates = [
      user?.rol,
      user?.role,
      user?.perfil,
      user?.tipo,
      user?.tipo_usuario,
      user?.rol_nombre,
    ];

    for (const value of candidates) {
      if (typeof value === 'string') {
        const normalized = value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();

        if (normalized === 'admin' || normalized === 'administrador') {
          return true;
        }
      }

      if (typeof value === 'number' && value === 1) {
        return true;
      }
    }

    if (user?.is_admin === true || user?.admin === true) {
      return true;
    }

    if (user?.is_admin === 1 || user?.admin === 1) {
      return true;
    }

    return false;
  }

  private getEstadoPunto(punto: Punto): string {
    return (punto.estado_actual ?? '').trim().toLowerCase();
  }

  private isPuntoDisponible(punto: Punto): boolean {
    const estado = this.getEstadoPunto(punto);
    if (estado) {
      return punto.activo === 1 && estado === 'disponible';
    }
    return punto.activo === 1;
  }

  private ajustarAlturaMapaAdmin() {
    if (typeof window === 'undefined') {
      return;
    }

    if (!this.isAdmin) {
      this.adminMapHeightPx = null;
      this.cdr.markForCheck();
      return;
    }

    const mapElement = this.mapContainer?.nativeElement;
    if (!mapElement) {
      return;
    }

    const margenInferior = 16;
    const alturaDisponible = Math.floor(window.innerHeight - mapElement.getBoundingClientRect().top - margenInferior);
    this.adminMapHeightPx = Math.max(380, alturaDisponible);
    this.cdr.markForCheck();

    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 0);
    }
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    const isAdminUser = this.resolveIsAdmin(user) || this.authService.isAdmin();
    this.userRole = isAdminUser ? 'admin' : 'cliente';
    this.userName = user?.nombre ?? user?.name ?? 'Usuario';
    this.cdr.markForCheck();

    if (this.isCliente) {
      this.dataService.getMisVehiculos().subscribe({
        next: (coches) => {
          this.misCoches = coches;
          this.cdr.markForCheck();
        },
        error: () => {
          this.misCoches = [];
          this.cdr.markForCheck();
        }
      });
    }
  }

  selectVehicle(index: number) {
    this.selectedVehicleIndex = index;
    this.cdr.markForCheck();
  }

  abrirModalReserva(estacion: Estacion) {
    this.estacionSeleccionada = estacion;
    this.puntosDisponibles = estacion.puntos?.filter(p => this.isPuntoDisponible(p)) ?? [];
    this.showReservaModal = true;
    this.reservaError = '';
    this.reservaForm.reset({
      punto_id: '',
      fecha_reserva: new Date().toISOString().split('T')[0],
      tarifa_id: estacion.tarifa?.id ?? null,
    });
    this.cdr.markForCheck();
  }

  editarEstacion(estacion: Estacion) {
    this.router.navigate(['/new-station', estacion.id]);
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
      tarifa_id: this.reservaForm.get('tarifa_id')?.value ?? null,
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
      this.map = L.map('map').setView([40.4168, -3.7038], 9);

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

            // Contar puntos realmente disponibles para reserva
            const puntosActivos = est.puntos?.filter(p => this.isPuntoDisponible(p)).length ?? 0;
            const totalPuntos = est.puntos?.length ?? 0;
            const conectoresInfo = `${puntosActivos}/${totalPuntos} disponibles`;

            // Generar tabla de puntos
            let puntosHtml = '<table class="table table-sm mb-2"><tbody>';
            est.puntos?.forEach(punto => {
              const estadoActual = this.getEstadoPunto(punto);
              const estado = estadoActual || (punto.activo === 1 ? 'disponible' : 'fuera de servicio');
              const badgeClass = estado === 'disponible'
                ? 'bg-success'
                : estado === 'ocupado'
                  ? 'bg-warning text-dark'
                  : 'bg-danger';
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
                ${this.isAdmin
                  ? `<button id="btn-edit-station-${est.id}" class="btn btn-sm btn-warning w-100 mt-2">
                      <i class="fa-solid fa-pen-to-square"></i> Editar estación
                    </button>`
                  : `<button id="btn-reserva-${est.id}" class="btn btn-sm btn-primary w-100 mt-2">
                      <i class="fa-solid fa-calendar-check"></i> Hacer reserva
                    </button>`}
              </div>
            `);

            // Agregar listener al botón de acción según el rol
            marker.on('popupopen', () => {
              if (this.isAdmin) {
                const btnEdit = document.getElementById(`btn-edit-station-${est.id}`);
                if (btnEdit) {
                  btnEdit.addEventListener('click', () => {
                    this.ngZone.run(() => {
                      this.editarEstacion(est);
                    });
                  });
                }
              } else {
                const btnReserva = document.getElementById(`btn-reserva-${est.id}`);
                if (btnReserva) {
                  btnReserva.addEventListener('click', () => {
                    this.ngZone.run(() => {
                      this.abrirModalReserva(est);
                    });
                  });
                }
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
        this.ajustarAlturaMapaAdmin();
      }, 200);

      this.resizeListener = () => this.ajustarAlturaMapaAdmin();
      window.addEventListener('resize', this.resizeListener, { passive: true });
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined' && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = undefined;
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
