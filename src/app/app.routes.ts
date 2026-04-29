import { Routes } from '@angular/router';
import { MapComponent } from './features/map/map';

export const routes: Routes = [
  { path: 'carte', component: MapComponent },
  { path: '', redirectTo: '/carte', pathMatch: 'full' }
];