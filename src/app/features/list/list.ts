import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { SelectionService } from '../../core/services/selection.service';
import { ApiService } from '../../core/services/api.service';
import { catchError, of } from 'rxjs';
import { DEPARTEMENTS_MAP } from '../../core/constants/departements'; 
import { Bulletin } from '../../core/models/bulletin.model';
import { ALERT_TYPES, ALERT_CLASSES, DEFAULT_ALERT_CLASS, MAP_COLORS, DEFAULT_MAP_COLOR, getDateString } from '../../core/constants/alertes.config';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [NgFor, NgClass, NgIf],
  templateUrl: './list.html',
  styleUrl: './list.css',
  host: {
    '[style.--color-alert-1]': 'MAP_COLORS[1]',
    '[style.--color-alert-2]': 'MAP_COLORS[2]',
    '[style.--color-alert-3]': 'MAP_COLORS[3]',
    '[style.--color-alert-4]': 'MAP_COLORS[4]',
    '[style.--color-alert-default]': 'DEFAULT_MAP_COLOR'
  }
})
export class List implements OnInit {
  public selectionService = inject(SelectionService);
  private apiService = inject(ApiService);
  public alertService = inject(AlertService);
  
  readonly MAP_COLORS = MAP_COLORS;
  readonly DEFAULT_MAP_COLOR = DEFAULT_MAP_COLOR;

  bulletins = signal<Bulletin[]>([]);

  filteredBulletins = computed(() => {
    return this.bulletins();
  });

  constructor() {
    effect(() => {
      const selected = this.selectionService.selectedBulletin();
      if (selected) {
        setTimeout(() => {
          document.getElementById('dept-' + selected.departement.num)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    });
  }

  ngOnInit() {
    const todayStr = getDateString();
    
    this.apiService.getBulletinsByDate(todayStr).pipe(
      catchError(err => {
        return of([]); 
      })
    ).subscribe(data => {
      if (data && data.length > 0) {
        const sorted = data
          .filter(b => DEPARTEMENTS_MAP[b.departement.num])
          .sort((a, b) => a.departement.num.localeCompare(b.departement.num, undefined, { numeric: true }));
        this.bulletins.set(sorted);
      }
    });
  }

  selectDepartement(bulletin: Bulletin) {
    this.selectionService.updateSelection(bulletin);
  }

  isSelected(bulletin: Bulletin): boolean {
    return this.selectionService.selectedBulletin()?.departement?.num === bulletin.departement.num;
  }

  getDeptName(num: string): string {
    return DEPARTEMENTS_MAP[num] || `Département ${num}`;
  }
}