import { Component, OnInit, inject, signal, effect, computed, input } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { SelectionService } from '../../core/services/selection.service';
import { ApiService } from '../../core/services/api.service';
import { catchError, of } from 'rxjs';
import { DEPARTEMENTS_MAP } from '../../core/constants/departements'; 
import { Bulletin } from '../../core/models/bulletin.model';
import { ALERT_TYPES, ALERT_CLASSES, DEFAULT_ALERT_CLASS, MAP_COLORS, DEFAULT_MAP_COLOR, getDateString } from '../../core/constants/alertes.config';

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
  
  readonly MAP_COLORS = MAP_COLORS;
  readonly DEFAULT_MAP_COLOR = DEFAULT_MAP_COLOR;

  filterLevel = input<number | null>(null);
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

  getDisplayLevel(alertes: any[]): number {
    const typeId = this.selectionService.selectedType();
    
    if (!alertes || alertes.length === 0) {
      return typeId !== null ? 1 : 0;
    }

    if (typeId !== null) {
      const alert = alertes.find(a => a.type === typeId);
      return alert ? alert.level : 0;
    }

    return Math.max(...alertes.map(a => a.level));
  }

  getFilteredAlerts(alertes: any[]): any[] {
    const typeId = this.selectionService.selectedType();
    if (!alertes) return [];
    if (typeId !== null) {
      const alert = alertes.find(a => a.type === typeId);
      return alert ? [alert] : [];
    }
    const maxLevel = this.getDisplayLevel(alertes);
    return alertes.filter(a => a.level === maxLevel);
  }

  getAlertClass(level: number): string {
    return ALERT_CLASSES[level] || DEFAULT_ALERT_CLASS;
  }

  getAlertSummary(alertes: any[]): string {
    const typeId = this.selectionService.selectedType();
    
    if (!alertes || alertes.length === 0) {
      if (typeId !== null) {
        return `Pas d'alerte`;
      }
      return "Aucune alerte.";
    }

    if (typeId !== null) {
      const alert = alertes.find(a => a.type === typeId);
      const level = alert ? alert.level : 1;
      
      if (level === 1) return `Pas d'alerte majeure`;
      if (level === 2) return `Alerte mineure`;
      if (level === 3) return `Alerte importante`;
      return `Alerte majeure`;
    }

    const maxLevel = this.getDisplayLevel(alertes);
    const relevantAlertes = alertes.filter(a => a.level === maxLevel);

    if (maxLevel === 1) return "Pas d'alerte majeure";
    const types = relevantAlertes.map(a => this.getAlertTypeName(a.type.toString())).join(', ');
    if (maxLevel === 2) return `Alertes mineures : ${types}`;
    if (maxLevel === 3) return `Alertes importantes : ${types}`;
    return `Alertes majeures : ${types}`;
  }

  getAlertTypeName(typeId: string): string {
    return ALERT_TYPES[typeId] || "Météo";
  }
}