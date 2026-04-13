import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DataService } from '../services/data.service';
import { Vehiculo } from '../models/interfaces';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  private authService = inject(AuthService);
  private dataService = inject(DataService);
  isLoadingProfile = false;
  isLoadingPassword = false;
  isLoadingVehicle = false;
  showVehicleForm = false;
  showPasswordForm = false;
  vehicleCreated = false;
  vehicleError = '';
  editingVehicleId: number | null = null;
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
    this.loadVehicleData();
  }

  private loadVehicleData() {
    this.isLoadingVehicle = true;
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      this.isLoadingVehicle = false;
      this.vehicleError = 'La carga del vehiculo tardó demasiado. Revisa conexión o backend.';
    }, 15000);

    this.dataService.getMisVehiculos().subscribe({
      next: (vehicles) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        const currentVehicle = Array.isArray(vehicles) ? vehicles[0] : null;
        if (currentVehicle) {
          this.editingVehicleId = currentVehicle.id;
          this.vehicleData = this.mapVehicleToForm(currentVehicle);
        } else {
          this.editingVehicleId = null;
        }
        this.isLoadingVehicle = false;
      },
      error: () => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        this.isLoadingVehicle = false;
        this.vehicleError = 'No se pudieron cargar los datos del vehiculo.';
      }
    });
  }

  private mapVehicleToForm(vehicle: Vehiculo) {
    return {
      marca: vehicle.marca ?? '',
      modelo: vehicle.modelo ?? '',
      matricula: vehicle.matricula ?? '',
    };
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

    if (this.showVehicleForm) {
      this.loadVehicleData();
    }
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
      !this.vehicleData.matricula.trim()
    ) {
      this.vehicleError = 'Completa marca, modelo y matrícula.';
      return;
    }

    this.isLoadingVehicle = true;
    const payload = {
      marca: this.vehicleData.marca.trim(),
      modelo: this.vehicleData.modelo.trim(),
      matricula: this.vehicleData.matricula.trim(),
    };

    const request$ = this.editingVehicleId
      ? this.dataService.actualizarVehiculo(this.editingVehicleId, payload)
      : this.dataService.crearVehiculo(payload);

    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      this.isLoadingVehicle = false;
      this.vehicleError = 'La operación del vehiculo tardó demasiado. Revisa conexión o backend.';
    }, 15000);

    request$.subscribe({
      next: (vehiculo) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        this.vehicleCreated = true;
        this.editingVehicleId = vehiculo?.id ?? this.editingVehicleId;
        this.vehicleData = this.mapVehicleToForm(vehiculo as Vehiculo);
        this.isLoadingVehicle = false;
      },
      error: (err) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        this.isLoadingVehicle = false;
        this.vehicleError = err?.error?.message || 'No se pudo guardar el vehiculo.';
      }
    });
  }

  updateVehicleField(field: 'marca' | 'modelo' | 'matricula', event: Event) {
    const target = event.target as HTMLInputElement;
    this.vehicleData[field] = target.value;
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
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      this.isLoadingPassword = false;
      this.passwordError = 'El cambio de contraseña tardó demasiado. Revisa conexión o backend.';
    }, 15000);

    this.authService.changePassword(this.passwordData.actual, this.passwordData.nueva).subscribe({
      next: () => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
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
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
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

    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      this.isLoadingProfile = false;
      this.profileError = 'La actualización del perfil tardó demasiado. Revisa conexión o backend.';
    }, 15000);

    this.authService.updateProfile(updatePayload).subscribe({
      next: (res) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
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
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        this.isLoadingProfile = false;
        this.profileError = err.error?.message || 'Error al guardar el perfil. Inténtalo de nuevo.';
      }
    });
  }
}
