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

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // 1. Obtener todas las estaciones para el mapa
  getEstaciones(): Observable<Estacion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Estacion[]>(`${this.apiUrl}/estaciones`, { headers });
  }

  // 2. Obtener mis vehículos (Necesita el Token)
  getMisVehiculos(): Observable<Vehiculo[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos`, { headers });
  }

  // 3. Obtener recargas (user: solo las suyas, admin: todas)
  // El backend discrimina segun el token enviado
  getRecargas(): Observable<Recarga[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Recarga[]>(`${this.apiUrl}/reservas`, { headers });
  }

  // 5. Crear una nueva estación (solo admin)
  crearEstacion(estacion: {
    nombre: string;
    direccion: string;
    ciudad?: string;
    provincia?: string;
    codigo_postal?: string;
    latitud: number | string;
    longitud: number | string;
    tarifa_id: number;
    num_puntos?: number | null;
    conectores_disponibles?: string;
    activo?: number;
  }): Observable<Estacion> {
    const headers = this.getAuthHeaders();
    return this.http.post<Estacion>(`${this.apiUrl}/estaciones`, estacion, { headers });
  }

  // 6. Editar una estación existente (solo admin)
  actualizarEstacion(id: number, estacion: {
    nombre: string;
    direccion: string;
    ciudad?: string;
    provincia?: string;
    codigo_postal?: string;
    latitud: number | string;
    longitud: number | string;
    tarifa_id: number;
    num_puntos?: number | null;
    conectores_disponibles?: string;
    activo?: number;
  }): Observable<Estacion> {
    const headers = this.getAuthHeaders();
    return this.http.put<Estacion>(`${this.apiUrl}/estaciones/${id}`, estacion, { headers });
  }

  // 7. Crear una reserva de carga
  crearReserva(reserva: {
    vehiculo_id: number;
    punto_id: number;
    fecha_reserva: string;
    tarifa_id: number | null;
  }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/reservas`, reserva, { headers });
  }
}
