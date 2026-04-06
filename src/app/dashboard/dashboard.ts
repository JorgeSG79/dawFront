import { CommonModule } from '@angular/common';
import { Component, inject, AfterViewInit, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements AfterViewInit, OnInit {
  private router = inject(Router);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  map: any; // Guarda la referencia aquí
  misCoches: any[] = [];
  estacionesCount = 0;
  selectedVehicleIndex = 0;
  userRole = 'cliente';
  userName = 'Usuario';


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
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.userRole = user?.rol ?? user?.role ?? 'cliente';
        this.userName = user?.nombre ?? user?.name ?? 'Usuario';
      } catch {
        this.userRole = 'cliente';
      }
    }

    if (this.isCliente) {
      this.dataService.getMisVehiculos().subscribe(coches => {
        this.misCoches = coches;
      });
    }
  }

  selectVehicle(index: number) {
    this.selectedVehicleIndex = index;
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

          estaciones.forEach(est => {
            const lat = Number(est.latitud);
            const lng = Number(est.longitud);

            if (Number.isNaN(lat) || Number.isNaN(lng)) {
              return;
            }

            const marker = L.marker([lat, lng]).addTo(this.map);
            const ubicacion = [est.ciudad, est.provincia].filter(Boolean).join(', ');
            const conectores = est.conectores_disponibles ?? 'Sin datos';

            marker.bindPopup(`
              <b>${est.nombre}</b><br>
              ${est.direccion}<br>
              ${ubicacion ? `<small>${ubicacion}</small><br>` : ''}
              <small>Puntos: ${est.num_puntos} | Conector: ${conectores}</small>
            `);
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
