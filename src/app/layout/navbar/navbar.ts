import { Component, inject, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SettingsDialogComponent } from '../settings/settings';
import { LoginComponent } from '../login/login';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  isMenuOpen = false;
  private dialog = inject(MatDialog);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  constructor() {
    effect(() => {
      const currentUser = this.authService.currentUser;
      const user = this.authService.user;
      this.cdr.detectChanges();
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  openSettings() {
    if (this.authService.isAuthenticated()) {
      if ((this.authService.currentUser?.level ?? 0) >= 2) {
        this.dialog.open(SettingsDialogComponent, {
          maxWidth: '90vw',
          width: 'auto'
        });
      }
    } else {
      const dialogRef = this.dialog.open(LoginComponent, {
        maxWidth: '90vw',
        width: '400px',
        panelClass: 'login-dialog-panel'
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}