import { CommonModule } from '@angular/common';
import { Component, inject, AfterViewInit, OnInit, OnDestroy, NgZone, ElementRef, ViewChild } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { AuthService } from '../services/auth.service';
import { Estacion, Punto } from '../models/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements AfterViewInit, OnInit, OnDestroy {

  private router = inject(Router);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;
  private resizeListener?: () => void;
  private leafletLib: any;
  private stationMarkers: any[] = [];

  map: any;
  adminMapHeightPx: number | null = null;
  misCoches: any[] = [];
  estacionesCount = 0;
  selectedVehicleIndex = 0;
  userRole = 'cliente';
  userName = 'Usuario';

  // Estado del modal de reserva consolidado
  reserva = {
    visible: false,
    estacion: null as Estacion | null,
    puntos: [] as Punto[],
    punto_id: '',
    fecha: new Date().toISOString().split('T')[0],
    tarifa_id: null as number | null,
    cargando: false,
    error: ''
  };


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
    if (!user) return false;

    const adminValue = user.rol || user.role || user.tipo || user.is_admin || user.admin;
    if (!adminValue) return false;

    if (typeof adminValue === 'number') return adminValue === 1;
    if (adminValue === true) return true;

    const normalized = String(adminValue).toLowerCase().replace(/á|é|í|ó|ú/g, 'a');
    return normalized === 'admin' || normalized === 'administrador';
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
    if (typeof window === 'undefined' || !this.isAdmin || !this.mapContainer?.nativeElement) {
      this.adminMapHeightPx = null;
      return;
    }

    const {top} = this.mapContainer.nativeElement.getBoundingClientRect();
    this.adminMapHeightPx = Math.max(380, Math.floor(window.innerHeight - top - 16));

    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 0);
    }
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    const isAdminUser = this.resolveIsAdmin(user) || this.authService.isAdmin();
    this.userRole = isAdminUser ? 'admin' : 'cliente';
    this.userName = user?.nombre ?? user?.name ?? 'Usuario';

    if (this.isCliente) {
      this.dataService.getMisVehiculos().subscribe({
        next: (coches) => {
          this.misCoches = coches;
        },
        error: () => {
          this.misCoches = [];
        }
      });
    }
  }

  selectVehicle(index: number) {
    this.selectedVehicleIndex = index;
  }

  abrirModalReserva(estacion: Estacion) {
    this.reserva = {
      visible: true,
      estacion,
      puntos: estacion.puntos?.filter(p => this.isPuntoDisponible(p)) ?? [],
      punto_id: '',
      fecha: new Date().toISOString().split('T')[0],
      tarifa_id: estacion.tarifa?.id ?? null,
      cargando: false,
      error: ''
    };
  }

  editarEstacion(estacion: Estacion) {
    this.router.navigate(['/new-station', estacion.id], {
      state: { station: estacion }
    });
  }

  cerrarModalReserva() {
    this.reserva.visible = false;
    this.reserva.estacion = null;
    this.reserva.puntos = [];
  }

  hacerReserva() {
    this.reserva.error = '';
    if (!this.reserva.punto_id || !this.reserva.fecha || !this.selectedVehicle) {
      this.reserva.error = 'Por favor, completa todos los campos.';
      return;
    }

    this.reserva.cargando = true;
    this.dataService.crearReserva({
      vehiculo_id: this.selectedVehicle.id,
      punto_id: Number(this.reserva.punto_id),
      fecha_reserva: this.reserva.fecha,
      tarifa_id: this.reserva.tarifa_id ?? null,
    }).subscribe({
      next: () => {
        this.reserva.cargando = false;
        this.map?.closePopup();
        this.cerrarModalReserva();
        this.cargarEstaciones();
        alert('¡Reserva realizada con éxito!');
      },
      error: (err) => {
        this.reserva.cargando = false;
        this.reserva.error = err?.error?.message || 'Error al realizar la reserva.';
      }
    });
  }

  async ngAfterViewInit() {
    if (typeof window !== 'undefined') {
      const L = await import('leaflet');
      this.leafletLib = L;

      // Inicializamos el mapa
      this.map = L.map('map').setView([40.4168, -3.7038], 7);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      this.cargarEstaciones();

      setTimeout(() => {
        this.map.invalidateSize();
        this.ajustarAlturaMapaAdmin();
      }, 200);

      this.resizeListener = () => this.ajustarAlturaMapaAdmin();
      window.addEventListener('resize', this.resizeListener, { passive: true });
    }
  }

  private cargarEstaciones() {
    if (!this.map || !this.leafletLib) {
      return;
    }

    this.stationMarkers.forEach(marker => this.map.removeLayer(marker));
    this.stationMarkers = [];

    const L = this.leafletLib;

    this.dataService.getEstaciones().subscribe({
      next: (estaciones) => {
        this.estacionesCount = estaciones.length;

        estaciones.forEach(est => {
          const lat = Number(est.latitud);
          const lng = Number(est.longitud);

          if (Number.isNaN(lat) || Number.isNaN(lng)) {
            return;
          }

          const marker = L.marker([lat, lng]).addTo(this.map);
          this.stationMarkers.push(marker);
          const ubicacion = [est.ciudad, est.provincia].filter(Boolean).join(', ');

          // Contar puntos realmente disponibles para reserva (esto tengo que revisar si se hace bien)
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

          const btnId = `btn-${this.isAdmin ? 'edit' : 'reserva'}-${est.id}`;
          const btnHtml = this.isAdmin
            ? `<button id="${btnId}" class="btn btn-sm btn-warning w-100 mt-2"><i class="fa-solid fa-pen-to-square"></i> Editar estación</button>`
            : `<button id="${btnId}" class="btn btn-sm btn-primary w-100 mt-2"><i class="fa-solid fa-calendar-check"></i> Hacer reserva</button>`;

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
              ${btnHtml}
            </div>
          `);

          marker.on('popupopen', () => {
            const btn = document.getElementById(btnId);
            if (btn) {
              btn.addEventListener('click', () => {
                this.ngZone.run(() => {
                  this.isAdmin ? this.editarEstacion(est) : this.abrirModalReserva(est);
                });
              });
            }
          });
        });
      },
      error: (err) => {
        console.error('Error al cargar estaciones:', err);
      }
    });
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
