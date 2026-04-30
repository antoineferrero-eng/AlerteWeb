import { Component, inject, computed, effect, signal } from '@angular/core';
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
            this.meteoToday.set(JSON.parse(b.dailyMeteos[0].data));
          } else {
            this.meteoToday.set(null);
          }
        });

        this.getBulletins(tomorrowStr).subscribe(bulletins => {
          const b = bulletins.find(b => b.departement.num === numDept);
          this.bulletinTomorrow.set(b || null);
          if (b && b.dailyMeteos && b.dailyMeteos.length > 0) {
            this.meteoTomorrow.set(JSON.parse(b.dailyMeteos[0].data));
          } else {
            this.meteoTomorrow.set(null);
          }
        });
      }
    });
  }

  private getBulletins(date: string): Observable<any[]> {
    if (!Card.cache.has(date)) {
      const request = this.http.get<any[]>(`http://localhost:8080/bulletins/date/${date}`).pipe(
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
  maxAlertLevel = computed(() => {
    const b = this.bulletin();
    if (b && b.alertes && b.alertes.length > 0) {
      return Math.max(...b.alertes.map((a: any) => a.level));
    }
    return 0;
  });

  maxAlertLevelTomorrow = computed(() => {
    const b = this.bulletinTomorrow();
    if (b && b.alertes && b.alertes.length > 0) {
      return Math.max(...b.alertes.map((a: any) => a.level));
    }
    return 0;
  });

  alertSummaryToday = computed(() => {
    return this.generateAlertSummary(this.bulletin()?.alertes);
  });

  alertSummaryTomorrow = computed(() => {
    return this.generateAlertSummary(this.bulletinTomorrow()?.alertes);
  });

  generateAlertSummary(alertes: any[] | undefined): string {
    if (!alertes || alertes.length === 0) {
      return "Aucune alerte.";
    }
    
    const maxLevel = Math.max(...alertes.map(a => a.level));
    
    if (maxLevel === 1) {
      return "Pas d'alerte majeure";
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