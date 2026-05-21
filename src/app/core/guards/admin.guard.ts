import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';
import { UserDTO } from '../models/user.dto';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);

  if (authService.currentUser) {
    if (authService.currentUser.level >= 2) {
      return true;
    }
    return router.parseUrl('/home');
  }

  const token = localStorage.getItem('id_token');
  if (token) {
    return http.get<UserDTO>('/users/me').pipe(
      map(profile => {
        if (profile && profile.level >= 2) {
          return true;
        }
        return router.parseUrl('/home');
      }),
      catchError(() => {
        return of(router.parseUrl('/home'));
      })
    );
  }

  return router.parseUrl('/home');
};
