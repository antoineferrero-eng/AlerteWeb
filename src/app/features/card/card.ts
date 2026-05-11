import { Component, inject, computed, effect, signal, input } from '@angular/core';
import { NgIf, NgClass, NgFor, NgSwitch, NgSwitchCase, NgTemplateOutlet, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { SelectionService } from '../../core/services/selection.service';
import { ApiService } from '../../core/services/api.service';
import { Observable, shareReplay, catchError, of } from 'rxjs';
import { DEPARTEMENTS_MAP } from '../../core/constants/departements';
import { Bulletin, DailyMeteo, Alerte } from '../../core/models/bulletin.model';
import { MAP_COLORS, DEFAULT_MAP_COLOR, getDateString } from '../../core/constants/alertes.config';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [NgIf, NgClass, NgFor, NgSwitch, NgSwitchCase, NgTemplateOutlet],
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
  public selectionService = inject(SelectionService);
  private apiService = inject(ApiService);
  public alertService = inject(AlertService);
  public router = inject(Router);

  get isHomeAll(): boolean {
    return this.router.url === '/home/all';
  }
  
  readonly MAP_COLORS = MAP_COLORS;
  readonly DEFAULT_MAP_COLOR = DEFAULT_MAP_COLOR;
  
  bulletin = this.selectionService.selectedBulletin;
  
  meteoToday = signal<any | null>(null);
  meteoTomorrow = signal<any | null>(null);
  bulletinTomorrow = signal<Bulletin | null>(null);

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
    return this.apiService.getBulletinsByDate(date);
  }

  private decimalPipe = new DecimalPipe('en-US'); // Provide a default locale

  departementName = computed(() => {
    const b = this.bulletin();
    return b ? (DEPARTEMENTS_MAP[b.departement.num] || `Département ${b.departement.num}`) : '';
  });

  getDisplayInfo(meteo: DailyMeteo | null, type: number | null): {value: string, unit: string, icon: string}[] {
    if (!meteo) return [];
    if (type === null || type === undefined) {
      return [
        { value: this.decimalPipe.transform(meteo.tempMax, '1.0-0')!, unit: '°C', icon: 'temp' },
        { value: meteo.windSpeedMax?.toString(), unit: 'km/h', icon: 'wind' }
      ].filter(i => i.value);
    }
    
    switch (type) {
      case 1: // Vent
        return [
          { value: meteo.windSpeedMax?.toString(), unit: 'km/h', icon: 'wind' },
          { value: meteo.windGustsMax?.toString(), unit: 'km/h', icon: 'windGust' }
        ];
      case 2: // Pluie
        return [
          { value: meteo.precipitationProbabilityMax?.toString(), unit: '%', icon: 'rainPourcent' },
          { value: meteo.precipitationSum?.toString(), unit: 'mm', icon: 'rain' }
        ];
      case 3: // Orages
        return [
          { value: meteo.precipitationProbabilityMax?.toString(), unit: '%', icon: 'rainPourcent' },
          { value: meteo.windGustsMax?.toString(), unit: 'km/h', icon: 'windGust' }
        ];
      case 4: // Inondation
        return [
          { value: meteo.precipitationSum?.toString(), unit: 'mm', icon: 'rain' }
        ];
      case 5: // Neige
      case 8: // Avalanches
        return [
          { value: meteo.snowfallSum?.toString(), unit: 'cm', icon: 'snow' }
        ];
      case 6: // Canicule
        return [
          { value: this.decimalPipe.transform(meteo.tempMax, '1.0-0')!, unit: '°C', icon: 'tempHigh' },
          { value: this.decimalPipe.transform(meteo.uvIndexMax, '1.0-0')!, unit: '', icon: 'uv' }
        ];
      case 7: // Froid
        return [
          { value: this.decimalPipe.transform(meteo.tempMin, '1.0-0')!, unit: '°C', icon: 'tempLow' },
          { value: meteo.windSpeedMax?.toString(), unit: 'km/h', icon: 'wind' }
        ];
      case 9: // Vagues
        return [
          { value: meteo.windSpeedMax?.toString(), unit: 'km/h', icon: 'wind' }
        ];
      default:
        return [
          { value: this.decimalPipe.transform(meteo.tempMax, '1.0-0')!, unit: '°C', icon: 'temp' }
        ];
    }
  }
}