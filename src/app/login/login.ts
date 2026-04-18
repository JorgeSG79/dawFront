// login.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // <--- Importa el servicio

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = signal('');
  password = signal('');
  submitted = signal(false);
  loading = signal(false);
  error = signal('');

  private router = inject(Router);
  private authService = inject(AuthService);

  updateEmail(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.email.set(value);
  }

  updatePassword(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.password.set(value);
  }

  private isEmailValid() {
    const value = this.email().trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private isPasswordValid() {
    return this.password().length >= 4;
  }

  isEmailInvalid() {
    return this.submitted() && !this.isEmailValid();
  }

  isPasswordInvalid() {
    return this.submitted() && !this.isPasswordValid();
  }

  submit() {
    this.error.set('');
    this.submitted.set(true);

    if (!this.isEmailValid() || !this.isPasswordValid()) {
      this.error.set('Por favor, completa todos los campos correctamente.');
      return;
    }

    this.loading.set(true);

    // LLAMADA REAL AL BACKEND
    this.authService.login({
      email: this.email().trim(),
      password: this.password(),
    }).subscribe({
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
