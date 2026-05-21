import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, tap } from 'rxjs';
import { Navbar } from '../../layout/navbar/navbar';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { REGIONS } from '../../core/constants/regions';

// Angular Material modules
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface ResourceWithOt {
  dkCode: string;
  libFonction: string;
  telPortable: string;
  email: string;
  nbOt: number;
  sendingEmail?: boolean;
  sendingMessage?: boolean;
}

@Component({
  selector: 'app-manage',
  standalone: true,
  imports: [
    CommonModule,
    Navbar,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './manage.html',
  styleUrl: './manage.css'
})
export class ManageComponent implements OnInit {
  private api = inject(ApiService);
  public authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  ressources: ResourceWithOt[] = [];
  filteredRessources: ResourceWithOt[] = [];
  paginatedRessources: ResourceWithOt[] = [];
  loading = true;

  currentPage = 1;
  pageSize = 20;

  filterDkCode = '';
  filterMail = '';
  filterTelPortable = '';

  toast: { message: string; type: 'success' | 'error' } | null = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    console.log('[ManageComponent] Starting loadData()...');
    const startAll = performance.now();
    this.loading = true;

    const currentUser = this.authService.currentUser;
    const userLevel = currentUser?.level ?? 0;
    const userRegionName = currentUser?.region;

    let allowedDepts: string[] = [];
    if (userLevel === 1 && userRegionName) {
      const foundRegion = REGIONS.find(r => r.name.toLowerCase() === userRegionName.toLowerCase());
      allowedDepts = foundRegion ? foundRegion.departments : [];
    }

    const startApi = performance.now();
    this.api.getManageRessources(userLevel, allowedDepts).subscribe({
      next: (ressources) => {
        const timeApi = performance.now() - startApi;
        console.log(`[ManageComponent] [API] getManageRessources returned ${ressources.length} items in ${timeApi.toFixed(1)}ms`);

        this.ngZone.run(() => {
          const startMapping = performance.now();

          this.ressources = ressources;
          this.applyFilters();

          const endMapping = performance.now();
          console.log(`[ManageComponent] [CLIENT] Mapping, filtering and pagination completed in ${(endMapping - startMapping).toFixed(1)}ms`);
          console.log(`[ManageComponent] [TOTAL] Load to Render took ${(performance.now() - startAll).toFixed(1)}ms`);

          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('[ManageComponent] Failed to load data:', err);
        this.ngZone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  applyFilters() {
    this.filteredRessources = this.ressources.filter(res => {
      const matchDkCode = !this.filterDkCode || (res.dkCode && res.dkCode.toLowerCase().includes(this.filterDkCode.toLowerCase()));
      const matchMail = !this.filterMail || (res.email && res.email.toLowerCase().includes(this.filterMail.toLowerCase()));
      const matchTel = !this.filterTelPortable || (res.telPortable && res.telPortable.toLowerCase().includes(this.filterTelPortable.toLowerCase()));
      return matchDkCode && matchMail && matchTel;
    });
    this.currentPage = 1;
    this.updatePaginatedList();
  }

  updatePaginatedList() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedRessources = this.filteredRessources.slice(startIndex, endIndex);
  }

  nextPage() {
    if (this.currentPage * this.pageSize < this.filteredRessources.length) {
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
    return Math.ceil(this.filteredRessources.length / this.pageSize) || 1;
  }

  sendEmail(res: ResourceWithOt) {
    if (res.sendingEmail) return;

    if (!res.email || res.email === 'null') {
      this.showToast("Impossible d'envoyer : cette ressource n'a pas d'adresse email valide.", 'error');
      return;
    }

    res.sendingEmail = true;
    this.api.sendResourceEmail(res.dkCode).subscribe({
      next: (resp) => {
        res.sendingEmail = false;
        this.showToast(resp.message || 'E-mail d\'alerte envoyé avec succès !', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        res.sendingEmail = false;
        this.showToast(err.error?.message || "Erreur lors de l'envoi de l'e-mail d'alerte.", 'error');
        this.cdr.detectChanges();
      }
    });
  }

  sendMessage(res: ResourceWithOt) {
    if (res.sendingMessage) return;

    if (!res.telPortable || res.telPortable === 'null') {
      this.showToast("Impossible d'envoyer : cette ressource n'a pas de numéro de téléphone portable.", 'error');
      return;
    }

    res.sendingMessage = true;
    this.api.sendResourceMessage(res.dkCode).subscribe({
      next: (resp) => {
        res.sendingMessage = false;
        this.showToast(resp.message || 'SMS d\'alerte envoyé avec succès !', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        res.sendingMessage = false;
        this.showToast(err.error?.message || "Erreur lors de l'envoi du message d'alerte.", 'error');
        this.cdr.detectChanges();
      }
    });
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toast = { message, type };
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 4000);
  }
}
