import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Recovery } from './recovery/recovery';
import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [
	{ path: '', component: Login },
	{ path: 'register', component: Register },
	{ path: 'forgot-password', component: Recovery },
	{ path: 'dashboard', component: Dashboard },
];
