import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';

export const routes: Routes = [
  { path: 'home', redirectTo: 'home/all', pathMatch: 'full' },
  { path: 'home/:typeId', component: HomeComponent },
  { path: '', redirectTo: 'home/all', pathMatch: 'full' }
];