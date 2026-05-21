import { Component, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, GoogleSigninButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private dialogRef = inject(MatDialogRef<LoginComponent>);
  public authService = inject(AuthService);
  private ngZone = inject(NgZone);

  constructor() {
    this.authService.socialAuthService?.authState.subscribe((user) => {
      if (user) {
        this.ngZone.run(() => {
          this.dialogRef.close(true);
        });
      }
    });
  }

  close() {
    this.dialogRef.close(false);
  }
}
