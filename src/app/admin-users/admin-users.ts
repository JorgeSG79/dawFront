import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../services/data.service';
import { AuthService } from '../services/auth.service';
import { Usuario } from '../models/interfaces';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})

export class AdminUsers implements OnInit {

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);

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

    this.dataService.getUsuarios()
      .subscribe({
        next: (users) => {
          this.users = Array.isArray(users) ? users : [];
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo cargar el listado de usuarios.';
          this.users = [];
          this.loading = false;
        }
      });
  }

  eliminarUsuario(user: Usuario) {
    if (user.rol?.toLowerCase() === 'admin') {
      this.error = 'No se puede eliminar un usuario administrador desde esta pantalla.';
      return;
    }

    const confirmado = window.confirm(`¿Seguro que quieres eliminar a ${user.nombre}?`);
    if (!confirmado) {
      return;
    }

    this.error = '';
    this.deletingUserId = user.id;

    this.dataService.eliminarUsuario(user.id)
      .subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.deletingUserId = null;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo eliminar el usuario.';
          this.deletingUserId = null;
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


}
