import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'home/:level', component: HomeComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];