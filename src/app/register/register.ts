import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

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

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
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
    this.loading.set(true);
    // Simula registro
    setTimeout(() => {
      this.loading.set(false);
      this.success.set('¡Usuario registrado correctamente!');
      this.registerForm.reset();
    }, 1200);
  }
}
