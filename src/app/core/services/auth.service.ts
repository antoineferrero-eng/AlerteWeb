import { Injectable, signal, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SocialAuthService, SocialUser, GoogleLoginProvider } from '@abacritt/angularx-social-login';
import { UserDTO } from '../models/user.dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _user = signal<SocialUser | null>(null);
  private _currentUser = signal<UserDTO | null>(null);
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);

  constructor(public socialAuthService: SocialAuthService) {
    // 1. Initial load from localStorage
    const savedToken = localStorage.getItem('id_token');
    console.log('[AuthService] Constructor - Checking localStorage token:', !!savedToken);
    if (savedToken) {
      console.log('[AuthService] Token found, fetching /users/me...');
      this.http.get<UserDTO>('/users/me').subscribe({
        next: (profile) => this.ngZone.run(() => {
          console.log('[AuthService] /users/me success:', profile);
          this._currentUser.set(profile);
        }),
        error: (err) => this.ngZone.run(() => {
          console.error('[AuthService] /users/me error:', err);
          localStorage.removeItem('id_token');
          this._currentUser.set(null);
        })
      });
    }

    // 2. React to Social Login state changes
    this.socialAuthService.authState.subscribe((user) => {
      this.ngZone.run(() => {
        this._user.set(user);
        if (user && user.idToken) {
          localStorage.setItem('id_token', user.idToken);
          this.http.get<UserDTO>('/users/me').subscribe({
            next: (profile) => this._currentUser.set(profile),
            error: () => {
              localStorage.removeItem('id_token');
              this._currentUser.set(null);
            }
          });
        }
      });
    });
  }

  get user() {
    return this._user();
  }

  get currentUser() {
    return this._currentUser();
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('id_token') !== null;
  }

  logout(): void {
    localStorage.removeItem('id_token');
    this._currentUser.set(null);
    this._user.set(null);
    this.socialAuthService.signOut().catch(() => { });
  }

  signInWithGoogle(): void {
    this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID);
  }
}
