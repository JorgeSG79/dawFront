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
}
