import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Recovery } from './recovery/recovery';
import { Dashboard } from './dashboard/dashboard';
import { Profile } from './profile/profile';
import { Recargas } from './recargas/recargas';
import { NewStation } from './new-station/new-station';
import { AdminUsers } from './admin-users/admin-users';
import { AdminTarifas } from './admin-tarifas/admin-tarifas';

export const routes: Routes = [
	{ path: '', component: Login },
	{ path: 'register', component: Register },
	{ path: 'forgot-password', component: Recovery },
	{ path: 'dashboard', component: Dashboard },
	{ path: 'profile', component: Profile },
	{ path: 'recargas', component: Recargas },
	{ path: 'admin-users', component: AdminUsers },
	{ path: 'admin-tarifas', component: AdminTarifas },
	{ path: 'new-station', component: NewStation },
	{ path: 'new-station/:id', component: NewStation },
];
