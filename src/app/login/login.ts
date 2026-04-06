// login.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // <--- Importa el servicio

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm;
  loading = signal(false);
  error = signal('');

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService); // <--- Inyectamos el AuthService

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  submit() {
    this.error.set('');
    if (this.loginForm.invalid) {
      this.error.set('Por favor, completa todos los campos correctamente.');
      return;
    }

    this.loading.set(true);

    // LLAMADA REAL AL BACKEND
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        console.log('Login exitoso', res);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        // Manejo de errores (ej: usuario no encontrado o password mal)
        this.error.set(err.error?.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
      }
    });
  }

  skipLogin() {
    this.error.set('');
    localStorage.setItem('user', JSON.stringify({ nombre: 'Cliente Demo', rol: 'cliente' }));
    this.router.navigate(['/dashboard']);
  }

  skipLoginAsAdmin() {
    this.error.set('');
    localStorage.setItem('user', JSON.stringify({ nombre: 'Admin Demo', rol: 'admin' }));
    this.router.navigate(['/dashboard']);
  }
}
