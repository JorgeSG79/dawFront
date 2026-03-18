import { CommonModule } from '@angular/common';
import { Component, inject, AfterViewInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements AfterViewInit {
  private router = inject(Router);

  async ngAfterViewInit() {
    if (typeof window !== 'undefined') {
      const L = await import('leaflet');

      const map = L.map('map').setView([40.4168, -3.7038], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
    }
  }

  logout() {
    this.router.navigate(['/']);
  }
}
