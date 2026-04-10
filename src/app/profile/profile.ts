import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DataService } from '../services/data.service';
import { Vehiculo } from '../models/interfaces';

type VehiculoApi = Vehiculo & {
  capacidad_bateria?: number | null;
  capacidadBateria?: number | null;
  tipo_conector?: string;
  tipoConector?: string;
};

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
    this.loadVehicleData();
  }

  private loadVehicleData() {
    this.isLoadingVehicle = true;
    this.dataService.getMisVehiculos().subscribe({
      next: (vehicles) => {
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
        this.isLoadingVehicle = false;
      }
    });
  }

  private mapVehicleToForm(vehicle: VehiculoApi) {
    const capacidadSnake = typeof vehicle.capacidad_bateria === 'number' ? vehicle.capacidad_bateria : null;
    const capacidadCamel = typeof vehicle.capacidadBateria === 'number' ? vehicle.capacidadBateria : null;
    const tipoSnake = typeof vehicle.tipo_conector === 'string' ? vehicle.tipo_conector : '';
    const tipoCamel = typeof vehicle.tipoConector === 'string' ? vehicle.tipoConector : '';

    return {
      marca: vehicle.marca ?? '',
      modelo: vehicle.modelo ?? '',
      matricula: vehicle.matricula ?? '',
      capacidadBateria: (capacidadSnake ?? capacidadCamel) as number | null,
      tipoConector: (tipoSnake || tipoCamel).trim(),
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
      !this.vehicleData.matricula.trim() ||
      !this.vehicleData.tipoConector.trim() ||
      this.vehicleData.capacidadBateria === null ||
      this.vehicleData.capacidadBateria <= 0
    ) {
      this.vehicleError = 'Completa todos los campos y revisa la capacidad de bateria.';
      return;
    }

    this.isLoadingVehicle = true;
    const payload = {
      marca: this.vehicleData.marca.trim(),
      modelo: this.vehicleData.modelo.trim(),
      matricula: this.vehicleData.matricula.trim(),
      capacidad_bateria: this.vehicleData.capacidadBateria,
      tipo_conector: this.vehicleData.tipoConector.trim(),
    };

    const request$ = this.editingVehicleId
      ? this.dataService.actualizarVehiculo(this.editingVehicleId, payload)
      : this.dataService.crearVehiculo(payload);

    request$.subscribe({
      next: (vehiculo) => {
        this.vehicleCreated = true;
        this.isLoadingVehicle = false;
        this.editingVehicleId = vehiculo?.id ?? this.editingVehicleId;
        this.vehicleData = this.mapVehicleToForm(vehiculo as VehiculoApi);
      },
      error: (err) => {
        this.isLoadingVehicle = false;
        this.vehicleError = err?.error?.message || 'No se pudo guardar el vehiculo.';
      }
    });
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
