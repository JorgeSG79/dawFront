import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerForm;
  loading = signal(false);
  error = signal('');
  success = signal('');
  private authService: AuthService;
  private router: Router;

  constructor(private fb: FormBuilder, authService: AuthService, router: Router) {
    this.authService = authService;
    this.router = router;
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordsMatch });
  }

  passwordsMatch(form: any) {
    const pass = form.get('password')?.value;
    const confirm = form.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  submit() {
    this.error.set('');
    this.success.set('');
    if (this.registerForm.invalid) {
      this.error.set('Por favor, completa todos los campos correctamente.');
      return;
    }

    const formValue = this.registerForm.value;
    const payload = {
      nombre: (formValue.nombre ?? '').trim(),
      apellidos: (formValue.apellidos ?? '').trim(),
      email: (formValue.email ?? '').trim(),
      password: formValue.password ?? '',
      telefono: (formValue.telefono ?? '').trim(),
    };

    this.loading.set(true);

    this.authService.register(payload).subscribe({
      next: () => {
        this.authService.login({
          email: payload.email,
          password: payload.password,
        }).subscribe({
          next: () => {
            this.loading.set(false);
            this.success.set('¡Usuario registrado correctamente!');
            this.registerForm.reset();
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.loading.set(false);
            this.success.set('¡Usuario registrado correctamente!');
            this.error.set('No se pudo iniciar sesión automáticamente. Inicia sesión manualmente.');
            this.router.navigate(['/']);
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'No se pudo registrar el usuario.');
      }
    });
  }
}
