import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { shareReplay, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly API_URL = '';
  private bulletinsCache = new Map<string, Observable<any[]>>();
  private geoJsonCache$: Observable<any> | null = null;

  /** Récupérer les données GeoJSON des départements */
  getDepartmentsGeoJson(): Observable<any> {
    if (!this.geoJsonCache$) {
      this.geoJsonCache$ = this.http.get('/dataPoly.json').pipe(
        shareReplay(1)
      );
    }
    return this.geoJsonCache$;
  }

  /** Récupérer les données des départements */
  getData(): Observable<any> {
    return this.http.get(`${this.API_URL}/departements`);
  }

  /** Récupérer les bulletins d'alerte pour un département spécifique */
  getBulletinByDepartement(num: string | number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/bulletins?dep=${num}`);
  }

  /** Récupérer les bulletins d'alerte pour une date spécifique avec mise en cache */
  getBulletinsByDate(date: string): Observable<any[]> {
    if (!this.bulletinsCache.has(date)) {
      const request = this.http.get<any[]>(`${this.API_URL}/bulletins?date=${date}`).pipe(
        catchError(err => {
          return of([]);
        }),
        shareReplay(1)
      );
      this.bulletinsCache.set(date, request);
    }
    return this.bulletinsCache.get(date)!;
  }

  // ── Config endpoints ────────────────────────────────────────────────────────

  /** Récupérer la configuration complète (niveaux, types, crons) */
  getFullConfig(): Observable<any> {
    return this.http.get(`${this.API_URL}/config`);
  }

  /** Récupérer les niveaux d'alerte actifs */
  getActiveLevels(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/config/alert-levels`);
  }

  /** Définir les niveaux d'alerte actifs */
  setActiveLevels(levels: string[]): Observable<any> {
    return this.http.post(`${this.API_URL}/config/alert-levels`, levels);
  }

  /** Récupérer les types d'alerte actifs */
  getActiveTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/config/alert-types`);
  }

  /** Définir les types d'alerte actifs */
  setActiveTypes(types: string[]): Observable<any> {
    return this.http.post(`${this.API_URL}/config/alert-types`, types);
  }

  /** Récupérer le cron d'envoi de mail */
  getMailCron(): Observable<{ mailCron: string }> {
    return this.http.get<{ mailCron: string }>(`${this.API_URL}/config/mail-time`);
  }

  /** Définir le cron d'envoi de mail */
  setMailCron(cron: string): Observable<any> {
    return this.http.post(`${this.API_URL}/config/mail-time`, { cron });
  }

  /** Récupérer le cron de mise à jour des données */
  getUpdateCron(): Observable<{ updateCron: string }> {
    return this.http.get<{ updateCron: string }>(`${this.API_URL}/config/update-time`);
  }

  /** Définir le cron de mise à jour des données */
  setUpdateCron(cron: string): Observable<any> {
    return this.http.post(`${this.API_URL}/config/update-time`, { cron });
  }
}