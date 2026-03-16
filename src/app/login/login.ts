import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

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

  constructor(private fb: FormBuilder) {
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
    // Simula login
    setTimeout(() => {
      this.loading.set(false);
      // Aquí iría la lógica real de autenticación
      alert('Login correcto (simulado)');
    }, 1000);
  }
}
