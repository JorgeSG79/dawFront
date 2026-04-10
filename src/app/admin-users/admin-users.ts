import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { DataService } from '../services/data.service';
import { AuthService } from '../services/auth.service';
import { Usuario } from '../models/interfaces';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers implements OnInit {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  users: Usuario[] = [];
  loading = true;
  error = '';
  deletingUserId: number | null = null;

  ngOnInit() {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadUsers();
  }

  private loadUsers() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.dataService.getUsuarios()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (users) => {
          this.users = Array.isArray(users) ? users : [];
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo cargar el listado de usuarios.';
          this.users = [];
          this.cdr.markForCheck();
        }
      });
  }

  eliminarUsuario(user: Usuario) {
    if (user.rol?.toLowerCase() === 'admin') {
      this.error = 'No se puede eliminar un usuario administrador desde esta pantalla.';
      this.cdr.markForCheck();
      return;
    }

    const confirmado = window.confirm(`¿Seguro que quieres eliminar a ${user.nombre}?`);
    if (!confirmado) {
      return;
    }

    this.error = '';
    this.deletingUserId = user.id;
    this.cdr.markForCheck();

    this.dataService.eliminarUsuario(user.id)
      .pipe(
        finalize(() => {
          this.deletingUserId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo eliminar el usuario.';
          this.cdr.markForCheck();
        }
      });
  }

  getUserEmail(user: Usuario): string {
    const value = user.email ?? user.correo;
    return value && value.trim() ? value : 'Sin email';
  }

  getUserTelefono(user: Usuario): string {
    const value = user.telefono;
    return value && value.trim() ? value : 'Sin telefono';
  }

  getUserFechaAlta(user: Usuario): string {
    const raw = user.created_at ?? user.fecha_creacion;
    if (!raw) {
      return '-';
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return raw;
    }

    return date.toLocaleDateString('es-ES');
  }

  getUserEstado(user: Usuario): string {
    if (typeof user.activo === 'number') {
      return user.activo === 1 ? 'Activo' : 'Inactivo';
    }

    if (typeof user.activo === 'boolean') {
      return user.activo ? 'Activo' : 'Inactivo';
    }

    if (user.estado && user.estado.trim()) {
      return user.estado;
    }

    return 'N/D';
  }
}
