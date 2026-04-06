// src/app/services/data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Estacion, Vehiculo, Recarga } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // 1. Obtener todas las estaciones para el mapa
  getEstaciones(): Observable<Estacion[]> {
    return this.http.get<Estacion[]>(`${this.apiUrl}/estaciones`);
  }

  // 2. Obtener mis vehículos (Necesita el Token)
  getMisVehiculos(): Observable<Vehiculo[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos`, { headers });
  }

  // 3. Obtener mi historial de recargas
  getMisRecargas(): Observable<Recarga[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Recarga[]>(`${this.apiUrl}/recargas/mis-recargas`, { headers });
  }

  // 4. Obtener todas las recargas (solo admin)
  getTodasRecargas(): Observable<Recarga[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Recarga[]>(`${this.apiUrl}/recargas`, { headers });
  }

  // 5. Crear una nueva estación (solo admin)
  crearEstacion(estacion: Omit<Estacion, 'id'>): Observable<Estacion> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<Estacion>(`${this.apiUrl}/estaciones`, estacion, { headers });
  }
}
