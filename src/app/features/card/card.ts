import { Component, inject, computed, effect, signal, input } from '@angular/core';
import { NgIf, NgClass, DecimalPipe } from '@angular/common';
import { SelectionService } from '../../core/services/selection.service';
import { ApiService } from '../../core/services/api.service';
import { Observable, shareReplay, catchError, of } from 'rxjs';
import { DEPARTEMENTS_MAP } from '../../core/constants/departements';
import { Bulletin, DailyMeteo, Alerte } from '../../core/models/bulletin.model';
import { ALERT_TYPES, ALERT_CLASSES, DEFAULT_ALERT_CLASS, MAP_COLORS, DEFAULT_MAP_COLOR, getDateString } from '../../core/constants/alertes.config';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [NgIf, NgClass, DecimalPipe],
  templateUrl: './card.html',
  styleUrl: './card.css',
  host: {
    '[style.--color-alert-1]': 'MAP_COLORS[1]',
    '[style.--color-alert-2]': 'MAP_COLORS[2]',
    '[style.--color-alert-3]': 'MAP_COLORS[3]',
    '[style.--color-alert-4]': 'MAP_COLORS[4]',
    '[style.--color-alert-default]': 'DEFAULT_MAP_COLOR'
  }
})
export class Card {
  private selectionService = inject(SelectionService);
  private apiService = inject(ApiService);
  
  readonly MAP_COLORS = MAP_COLORS;
  readonly DEFAULT_MAP_COLOR = DEFAULT_MAP_COLOR;

  filterLevel = input<number | null>(null);
  bulletin = this.selectionService.selectedBulletin;
  
  meteoToday = signal<any | null>(null);
  meteoTomorrow = signal<any | null>(null);
  bulletinTomorrow = signal<Bulletin | null>(null);

  private static cache = new Map<string, Observable<Bulletin[]>>();

  constructor() {
    effect(() => {
      const current = this.bulletin();
      if (current) {
        const numDept = current.departement.num;
        const todayStr = getDateString(0);
        const tomorrowStr = getDateString(1);

        this.getBulletins(todayStr).subscribe(bulletins => {
          const b = bulletins.find(bulletin => bulletin.departement.num === numDept);
          this.meteoToday.set(b?.dailyMeteos?.[0] || null);
        });

        this.getBulletins(tomorrowStr).subscribe(bulletins => {
          const b = bulletins.find(bulletin => bulletin.departement.num === numDept);
          this.bulletinTomorrow.set(b || null);
          this.meteoTomorrow.set(b?.dailyMeteos?.[0] || null);
        });
      }
    });
  }

  private getBulletins(date: string): Observable<Bulletin[]> {
    if (!Card.cache.has(date)) {
      const request = this.apiService.getBulletinsByDate(date).pipe(
        catchError(err => {
          return of([]);
        }),
        shareReplay(1)
      );
      Card.cache.set(date, request);
    }
    return Card.cache.get(date)!;
  }

  departementName = computed(() => {
    const b = this.bulletin();
    return b ? (DEPARTEMENTS_MAP[b.departement.num] || `Département ${b.departement.num}`) : '';
  });

  maxAlertLevel = computed(() => {
    const b = this.bulletin();
    const typeId = this.selectionService.selectedType();
    if (!b || !b.alertes || b.alertes.length === 0) return 0;

    if (typeId !== null) {
      const alert = b.alertes.find((a: any) => a.type === typeId);
      return alert ? alert.level : 0;
    }
    return Math.max(...b.alertes.map((a: any) => a.level));
  });

  maxAlertLevelTomorrow = computed(() => {
    const b = this.bulletinTomorrow();
    const typeId = this.selectionService.selectedType();
    if (!b || !b.alertes || b.alertes.length === 0) return 0;

    if (typeId !== null) {
      const alert = b.alertes.find((a: any) => a.type === typeId);
      return alert ? alert.level : 0;
    }
    return Math.max(...b.alertes.map((a: any) => a.level));
  });

  alertSummaryToday = computed(() => this.generateAlertSummary(this.bulletin()?.alertes));
  alertSummaryTomorrow = computed(() => this.generateAlertSummary(this.bulletinTomorrow()?.alertes));

  generateAlertSummary(alertes: Alerte[] | undefined): string {
    const typeId = this.selectionService.selectedType();
    
    if (!alertes || alertes.length === 0) {
      if (typeId !== null) {
        return `Pas d'alerte : ${this.getAlertTypeName(typeId.toString())}`;
      }
      return "Aucune alerte.";
    }

    if (typeId !== null) {
      const alert = alertes.find(a => a.type === typeId);
      const level = alert ? alert.level : 1;
      const typeName = this.getAlertTypeName(typeId.toString());

      if (level === 1) return `Pas d'alerte majeure`;
      if (level === 2) return `Alerte mineure`;
      if (level === 3) return `Alerte importante`;
      return `Alerte majeure : ${typeName}`;
    }

    const maxLevel = Math.max(...alertes.map(a => a.level));
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

  getAlertClass(): string {
    const l = this.maxAlertLevel();
    return ALERT_CLASSES[l] || DEFAULT_ALERT_CLASS;
  }

  getAlertClassTomorrow(): string {
    const l = this.maxAlertLevelTomorrow();
    return ALERT_CLASSES[l] || DEFAULT_ALERT_CLASS;
  }
}