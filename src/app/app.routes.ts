import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Recovery } from './recovery/recovery';
import { Dashboard } from './dashboard/dashboard';
import { Profile } from './profile/profile';
import { Recargas } from './recargas/recargas';
import { NewStation } from './new-station/new-station';

export const routes: Routes = [
	{ path: '', component: Login },
	{ path: 'register', component: Register },
	{ path: 'forgot-password', component: Recovery },
	{ path: 'dashboard', component: Dashboard },
	{ path: 'profile', component: Profile },
	{ path: 'recargas', component: Recargas },
	{ path: 'new-station', component: NewStation },
];
