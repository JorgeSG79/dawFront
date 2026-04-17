// src/app/services/data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { Estacion, Vehiculo, Recarga, Tarifa, Usuario } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = typeof window !== 'undefined'
      ? window.localStorage.getItem('token') ?? ''
      : '';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  //  Obtener todas las estaciones para el mapa
  getEstaciones(): Observable<Estacion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Estacion[]>(`${this.apiUrl}/estaciones`, { headers });
  }

  //  Obtener mis vehículos
  getMisVehiculos(): Observable<Vehiculo[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos`, { headers });
  }

  //Crear vehiculo
  crearVehiculo(vehiculo: {
    modelo: string;
    matricula: string;
  }): Observable<Vehiculo> {
    const headers = this.getAuthHeaders();
    return this.http.post<Vehiculo>(`${this.apiUrl}/vehiculos`, vehiculo, { headers });
  }

  //Actualizar vehiculo
  actualizarVehiculo(id: number, vehiculo: {
    modelo: string;
    matricula: string;
  }): Observable<Vehiculo> {
    const headers = this.getAuthHeaders();
    return this.http.put<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, vehiculo, { headers });
  }

// Obtener historial de recargas (user: solo las suyas, admin: todas)
  getHistorialRecargas(): Observable<Recarga[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Recarga[]>(`${this.apiUrl}/recargas`, { headers });
  }


  //  Obtener reservas (user: solo las suyas, admin: todas)
  getReservas(): Observable<Recarga[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Recarga[]>(`${this.apiUrl}/reservas`, { headers });
  }

  // Listado de usuarios (solo admin)
  getUsuarios(): Observable<Usuario[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Usuario[]>(`${this.apiUrl}/auth/usuarios`, { headers });
  }

  eliminarUsuario(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/auth/usuarios/${id}`, { headers });
  }

  // Gestion de tarifas (solo admin)
  getTarifas(): Observable<Tarifa[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Tarifa[]>(`${this.apiUrl}/tarifas`, { headers });
  }

  crearTarifa(tarifa: { nombre: string; precio_kwh: number | string }): Observable<Tarifa> {
    const headers = this.getAuthHeaders();
    return this.http.post<Tarifa>(`${this.apiUrl}/tarifas`, tarifa, { headers });
  }

  actualizarTarifa(id: number, tarifa: { nombre: string; precio_kwh: number | string }): Observable<Tarifa> {
    const headers = this.getAuthHeaders();
    return this.http.put<Tarifa>(`${this.apiUrl}/tarifas/${id}`, tarifa, { headers });
  }

  eliminarTarifa(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/tarifas/${id}`, { headers });
  }

  // Crear una nueva estación (solo admin)
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

  // Editar una estación existente (solo admin)
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

  eliminarEstacion(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/estaciones/${id}`, { headers });
  }

  // Crear una reserva de carga
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
