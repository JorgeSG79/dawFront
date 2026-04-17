import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recovery',
  imports: [CommonModule, RouterModule],
  templateUrl: './recovery.html',
  styleUrl: './recovery.css',
})
export class Recovery {
  email = '';
  emailTouched = false;

  isLoading = signal(false);
  message = signal('');

  onEmailInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    this.email = target?.value ?? '';
  }

  markEmailTouched() {
    this.emailTouched = true;
  }

  isEmailEmpty(): boolean {
    return this.email.trim().length === 0;
  }

  isValidEmail(): boolean {
    if (this.isEmailEmpty()) {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }


  // Si sobra tiempo, implemmentar en backend
  onSubmit() {


  }
}
