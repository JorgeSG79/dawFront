// src/app/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth'; // Ajusta según tu ruta de Node

  private canUseStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private setStorageItem(key: string, value: string): void {
    if (this.canUseStorage()) {
      window.localStorage.setItem(key, value);
    }
  }

  private getStorageItem(key: string): string | null {
    if (!this.canUseStorage()) {
      return null;
    }

    return window.localStorage.getItem(key);
  }

  private removeStorageItem(key: string): void {
    if (this.canUseStorage()) {
      window.localStorage.removeItem(key);
    }
  }

  private normalizeRole(rawRole: unknown): 'admin' | 'cliente' {
    if (typeof rawRole === 'string') {
      const normalized = rawRole
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      if (normalized === 'admin' || normalized === 'administrador') {
        return 'admin';
      }
    }

    if (typeof rawRole === 'number' && rawRole === 1) {
      return 'admin';
    }

    return 'cliente';
  }

  private getUserFromResponse(response: any): any {
    const candidate = response?.user ?? response?.usuario ?? response?.data?.user;
    if (Array.isArray(candidate)) {
      return candidate[0] ?? null;
    }
    return candidate ?? null;
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        // Guardamos el token y los datos básicos del usuario
        if (response.token) {
          this.setStorageItem('token', response.token);

          const user = this.getUserFromResponse(response);
          if (user) {
            const normalizedUser = {
              ...user,
              rol: this.normalizeRole(user?.rol ?? user?.role),
            };
            this.setStorageItem('user', JSON.stringify(normalizedUser));
          }
        }
      })
    );
  }

  register(payload: {
    nombre: string;
    apellidos: string;
    email: string;
    password: string;
    telefono: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, payload);
  }

  logout() {
    this.removeStorageItem('token');
    this.removeStorageItem('user');
  }

  getToken() {
    return this.getStorageItem('token');
  }

  getCurrentUser(): any | null {
    const rawUser = this.getStorageItem('user');
    if (!rawUser) {
      return null;
    }

    try {
      const user = JSON.parse(rawUser);
      return {
        ...user,
        rol: this.normalizeRole(user?.rol ?? user?.role),
      };
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.rol === 'admin';
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update`, profileData).pipe(
      tap(response => {
        // Actualizar el usuario en localStorage si la respuesta contiene datos del usuario
        if (response?.user) {
          const normalizedUser = {
            ...response.user,
            rol: this.normalizeRole(response.user?.rol ?? response.user?.role),
          };
          this.setStorageItem('user', JSON.stringify(normalizedUser));
        }
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/change-password`, {
      passwordActual: currentPassword,
      passwordNueva: newPassword,
    });
  }
}
