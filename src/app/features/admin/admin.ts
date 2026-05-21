import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../layout/navbar/navbar';
import { ApiService } from '../../core/services/api.service';
import { UserDTO } from '../../core/models/user.dto';
import { REGIONS } from '../../core/constants/regions';

// Angular Material modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, Navbar, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    MatAutocompleteModule, MatProgressSpinnerModule
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  users: UserDTO[] = [];
  filteredUsers: UserDTO[] = [];
  paginatedUsers: UserDTO[] = [];

  loading = true;

  currentPage = 1;
  pageSize = 15;

  // Filters
  filterNom = '';
  filterPrenom = '';
  filterMail = '';
  filterDroit: number | 'all' = 'all';
  filterRegion = '';

  availableRegions: string[] = REGIONS.map(r => r.name);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    console.log('[AdminComponent] loadUsers called. Starting getUsers API request...');
    this.loading = true;
    this.api.getUsers().subscribe({
      next: (data) => {
        console.log('[AdminComponent] getUsers API success:', data);
        this.ngZone.run(() => {
          this.users = data;
          this.extractRegions();
          this.applyFilters();
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('[AdminComponent] getUsers API error:', err);
        this.ngZone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  extractRegions() {
  }

  applyFilters() {
    this.filteredUsers = this.users.filter(u => {
      const matchNom = !this.filterNom || (u.lastName && u.lastName.toLowerCase().includes(this.filterNom.toLowerCase()));
      const matchPrenom = !this.filterPrenom || (u.firstName && u.firstName.toLowerCase().includes(this.filterPrenom.toLowerCase()));
      const matchMail = !this.filterMail || (u.mail && u.mail.toLowerCase().includes(this.filterMail.toLowerCase()));
      const matchDroit = this.filterDroit === 'all' || 
                         (this.filterDroit === 2 ? u.level >= 2 : u.level === this.filterDroit);
      const matchRegion = !this.filterRegion || (u.region && u.region.toLowerCase().includes(this.filterRegion.toLowerCase()));
      return matchNom && matchPrenom && matchMail && matchDroit && matchRegion;
    });
    this.currentPage = 1;
    this.updatePaginatedList();
  }

  updatePaginatedList() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  nextPage() {
    if (this.currentPage * this.pageSize < this.filteredUsers.length) {
      this.currentPage++;
      this.updatePaginatedList();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedList();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
  }

  updateUser(user: UserDTO) {
    if (user.level !== 1) {
      user.region = undefined; // Clear region if not manager
    }

    this.api.updateUser(user.id, user.level, user.region || null).subscribe({
      next: (updated) => {
        user.level = updated.level;
        user.region = updated.region;
        this.extractRegions();
        this.updatePaginatedList();
      },
      error: (err) => {
        console.error('Failed to update user', err);
      }
    });
  }
}
