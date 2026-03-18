import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recovery',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './recovery.html',
  styleUrl: './recovery.css',
})
export class Recovery {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  recoveryForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isLoading = signal(false);
  message = signal('');

  onSubmit() {
    if (this.recoveryForm.valid) {
      this.isLoading.set(true);
      this.message.set('');
      const email = this.recoveryForm.value.email;
      this.http.post('/api/recovery', { email }).subscribe({
        next: () => {
          this.message.set('Email de recuperación enviado exitosamente.');
          this.isLoading.set(false);
        },
        error: (err) => {
          this.message.set('Error al enviar el email de recuperación. Inténtalo de nuevo.');
          this.isLoading.set(false);
        },
      });
    }
  }
}
