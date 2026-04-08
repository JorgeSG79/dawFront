import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  private authService = inject(AuthService);
  isLoadingProfile = false;
  isLoadingPassword = false;
  showVehicleForm = false;
  showPasswordForm = false;
  vehicleCreated = false;
  vehicleError = '';
  profileEditMode = false;
  profileSaved = false;
  profileError = '';
  passwordSaved = false;
  passwordError = '';

  passwordData = {
    actual: '',
    nueva: '',
    repetir: '',
  };

  vehicleData = {
    marca: '',
    modelo: '',
    matricula: '',
    capacidadBateria: null as number | null,
    tipoConector: '',
  };

  // Datos de ejemplo (esto vendría de un servicio)
  user = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    role: 'Administrador',
    joinedDate: 'Marzo 2024',
    avatar: 'https://ui-avatars.com/api/?name=Juan+Perez&background=e3f2fd&color=0d6efd&size=128'
  };

  editableProfile = {
    firstName: this.user.firstName,
    lastName: this.user.lastName,
    email: this.user.email,
  };

  ngOnInit() {
    this.loadUserData();
  }

  private loadUserData() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = {
        firstName: currentUser.nombre || currentUser.firstName || 'Usuario',
        lastName: currentUser.apellido || currentUser.lastName || '',
        email: currentUser.email || '',
        role: currentUser.rol || 'cliente',
        joinedDate: currentUser.joinedDate || 'Desconocida',
        avatar: `https://ui-avatars.com/api/?name=${currentUser.nombre || 'User'}&background=e3f2fd&color=0d6efd&size=128`,
      };
      this.editableProfile = {
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
      };
    }
  }

  toggleVehicleForm() {
    this.showVehicleForm = !this.showVehicleForm;
    this.vehicleCreated = false;
    this.vehicleError = '';
  }

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
    this.passwordSaved = false;
    this.passwordError = '';
    if (!this.showPasswordForm) {
      this.passwordData = {
        actual: '',
        nueva: '',
        repetir: '',
      };
    }
  }

  submitVehicle() {
    this.vehicleCreated = false;
    this.vehicleError = '';

    if (
      !this.vehicleData.marca.trim() ||
      !this.vehicleData.modelo.trim() ||
      !this.vehicleData.matricula.trim() ||
      !this.vehicleData.tipoConector.trim() ||
      this.vehicleData.capacidadBateria === null ||
      this.vehicleData.capacidadBateria <= 0
    ) {
      this.vehicleError = 'Completa todos los campos y revisa la capacidad de bateria.';
      return;
    }

    const newVehicle = { ...this.vehicleData };
    console.log('Vehiculo preparado para guardar:', newVehicle);

    this.vehicleCreated = true;
    this.vehicleData = {
      marca: '',
      modelo: '',
      matricula: '',
      capacidadBateria: null,
      tipoConector: '',
    };
  }

  updateVehicleField(field: 'marca' | 'modelo' | 'matricula' | 'tipoConector', event: Event) {
    const target = event.target as HTMLInputElement;
    this.vehicleData[field] = target.value;
  }

  updateBattery(event: Event) {
    const target = event.target as HTMLInputElement;
    this.vehicleData.capacidadBateria = target.value ? Number(target.value) : null;
  }

  updatePasswordField(field: 'actual' | 'nueva' | 'repetir', event: Event) {
    const target = event.target as HTMLInputElement;
    this.passwordData[field] = target.value;
  }

  submitPasswordChange() {
    this.passwordSaved = false;
    this.passwordError = '';

    if (
      !this.passwordData.actual.trim() ||
      !this.passwordData.nueva.trim() ||
      !this.passwordData.repetir.trim()
    ) {
      this.passwordError = 'Completa todos los campos de contraseña.';
      return;
    }

    if (this.passwordData.nueva.length < 6) {
      this.passwordError = 'La nueva contraseña debe tener al menos 6 caracteres.';
      return;
    }

    if (this.passwordData.nueva !== this.passwordData.repetir) {
      this.passwordError = 'La nueva contraseña y su confirmacion no coinciden.';
      return;
    }

    this.isLoadingPassword = true;
    this.authService.changePassword(this.passwordData.actual, this.passwordData.nueva).subscribe({
      next: () => {
        this.isLoadingPassword = false;
        this.passwordSaved = true;
        this.passwordData = {
          actual: '',
          nueva: '',
          repetir: '',
        };
        this.showPasswordForm = false;
      },
      error: (err) => {
        this.isLoadingPassword = false;
        this.passwordError = err.error?.message || 'Error al cambiar la contraseña. Verifica tu contraseña actual.';
      }
    });
  }

  startEditProfile() {
    this.profileEditMode = true;
    this.profileSaved = false;
    this.profileError = '';
    this.editableProfile = {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
    };
  }

  cancelEditProfile() {
    this.profileEditMode = false;
    this.profileError = '';
  }

  updateProfileField(field: 'firstName' | 'lastName' | 'email', event: Event) {
    const target = event.target as HTMLInputElement;
    this.editableProfile[field] = target.value;
  }

  saveProfile() {
    this.profileSaved = false;
    this.profileError = '';

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !this.editableProfile.firstName.trim() ||
      !this.editableProfile.lastName.trim() ||
      !this.editableProfile.email.trim() ||
      !emailPattern.test(this.editableProfile.email)
    ) {
      this.profileError = 'Revisa nombre, apellidos y correo electronico.';
      return;
    }

    this.isLoadingProfile = true;
    const updatePayload = {
      nombre: this.editableProfile.firstName.trim(),
      apellido: this.editableProfile.lastName.trim(),
      email: this.editableProfile.email.trim(),
    };

    this.authService.updateProfile(updatePayload).subscribe({
      next: (res) => {
        this.isLoadingProfile = false;
        this.user = {
          ...this.user,
          firstName: this.editableProfile.firstName.trim(),
          lastName: this.editableProfile.lastName.trim(),
          email: this.editableProfile.email.trim(),
        };
        this.profileEditMode = false;
        this.profileSaved = true;
      },
      error: (err) => {
        this.isLoadingProfile = false;
        this.profileError = err.error?.message || 'Error al guardar el perfil. Inténtalo de nuevo.';
      }
    });
  }
}
