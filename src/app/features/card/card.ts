import { Component, inject, computed, effect, signal, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgIf, NgClass, DecimalPipe } from '@angular/common';
import { SelectionService } from '../../core/services/selection.service';
import { Observable, shareReplay } from 'rxjs';
import { DEPARTEMENTS_MAP } from '../../core/constants/departements';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [NgIf, NgClass, DecimalPipe],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card {
  private selectionService = inject(SelectionService);
  private http = inject(HttpClient);
  
  bulletin = this.selectionService.selectedBulletin;
  filterLevel = input<number | null>(null);
  
  meteoToday = signal<any>(null);
  meteoTomorrow = signal<any>(null);
  bulletinTomorrow = signal<any>(null);

  private static cache = new Map<string, Observable<any[]>>();

  constructor() {
    effect(() => {
      const current = this.bulletin();
      if (current) {
        const numDept = current.departement.num;
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        this.getBulletins(todayStr).subscribe(bulletins => {
          const b = bulletins.find(b => b.departement.num === numDept);
          if (b && b.dailyMeteos && b.dailyMeteos.length > 0) {
            this.meteoToday.set(b.dailyMeteos[0]);
          } else {
            this.meteoToday.set(null);
          }
        });

        this.getBulletins(tomorrowStr).subscribe(bulletins => {
          const b = bulletins.find(b => b.departement.num === numDept);
          this.bulletinTomorrow.set(b || null);
          if (b && b.dailyMeteos && b.dailyMeteos.length > 0) {
            this.meteoTomorrow.set(b.dailyMeteos[0]);
          } else {
            this.meteoTomorrow.set(null);
          }
        });
      }
    });
  }

  private getBulletins(date: string): Observable<any[]> {
    if (!Card.cache.has(date)) {
      const request = this.http.get<any[]>(`http://localhost:8080/bulletins?date=${date}`).pipe(
        shareReplay(1)
      );
      Card.cache.set(date, request);
    }
    return Card.cache.get(date)!;
  }

  departementName = computed(() => {
    const b = this.bulletin();
    if (!b) return '';
    return DEPARTEMENTS_MAP[b.departement.num] || `Département ${b.departement.num}`;
  });

  filteredAlertsToday = computed(() => {
    const b = this.bulletin();
    const level = this.filterLevel();
    if (!b || !b.alertes) return [];
    if (level !== null) return b.alertes.filter((a: any) => a.level === level);
    return b.alertes;
  });

  filteredAlertsTomorrow = computed(() => {
    const b = this.bulletinTomorrow();
    const level = this.filterLevel();
    if (!b || !b.alertes) return [];
    if (level !== null) return b.alertes.filter((a: any) => a.level === level);
    return b.alertes;
  });

  maxAlertLevel = computed(() => {
    const alertes = this.filteredAlertsToday();
    return alertes.length > 0 ? Math.max(...alertes.map((a: any) => a.level)) : 0;
  });

  maxAlertLevelTomorrow = computed(() => {
    const alertes = this.filteredAlertsTomorrow();
    return alertes.length > 0 ? Math.max(...alertes.map((a: any) => a.level)) : 0;
  });

  alertSummaryToday = computed(() => {
    return this.generateAlertSummary(this.filteredAlertsToday(), this.filterLevel());
  });

  alertSummaryTomorrow = computed(() => {
    return this.generateAlertSummary(this.filteredAlertsTomorrow(), this.filterLevel());
  });

  generateAlertSummary(alertes: any[], filterLevel: number | null): string {
    if (!alertes || alertes.length === 0) {
      return "Aucune alerte.";
    }
    
    const maxLevel = Math.max(...alertes.map(a => a.level));

    if (filterLevel !== null) {
      if (maxLevel === 1) return "Pas d'alerte majeure.";
      if (maxLevel === 2) return "Alertes mineures.";
      if (maxLevel === 3) return "Alertes importantes.";
      if (maxLevel >= 4) return "Alertes majeures.";
    }
    
    if (maxLevel === 1) {
      return "Pas d'alerte majeure.";
    }

    const typesOfMaxLevel = alertes
      .filter(a => a.level === maxLevel)
      .map(a => this.getAlertTypeName(a.type.toString()))
      .join(', ');

    if (maxLevel === 2) {
      return `Il y a des alertes mineures pour : ${typesOfMaxLevel}`;
    } else if (maxLevel === 3) {
      return `Il y a des alertes pour : ${typesOfMaxLevel}`;
    } else if (maxLevel >= 4) {
      return `Il y a des alertes majeures pour : ${typesOfMaxLevel}`;
    }

    return "Aucune alerte.";
  }

  getAlertTypeName(typeId: string): string {
    if (typeId === "1") return "Vent Violent";
    if (typeId === "2") return "Pluie-Inondation";
    if (typeId === "3") return "Orages";
    if (typeId === "4") return "Inondation";
    if (typeId === "5") return "Neige-verglas";
    if (typeId === "6") return "Canicule";
    if (typeId === "7") return "Grand Froid";
    if (typeId === "8") return "Avalanches";
    if (typeId === "9") return "Vagues-Submersion";
    return "Phénomène météo";
  }

  getAlertClass(): string {
    const level = this.maxAlertLevel();
    if (level === 1) return 'bg-green';
    if (level === 2) return 'bg-yellow';
    if (level === 3) return 'bg-orange';
    if (level >= 4) return 'bg-red';
    return 'bg-default';
  }

  getAlertClassTomorrow(): string {
    const level = this.maxAlertLevelTomorrow();
    if (level === 1) return 'bg-green';
    if (level === 2) return 'bg-yellow';
    if (level === 3) return 'bg-orange';
    if (level >= 4) return 'bg-red';
    return 'bg-default';
  }
}