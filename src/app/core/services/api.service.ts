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

  // ── User management ───────────────────────────────────────────────────────

  /** Récupérer tous les utilisateurs (réservé admin) */
  getUsers(): Observable<import('../models/user.dto').UserDTO[]> {
    return this.http.get<import('../models/user.dto').UserDTO[]>(`${this.API_URL}/users`);
  }

  /** Mettre à jour le rôle et la région d'un utilisateur */
  updateUser(id: number, level: number, region: string | null): Observable<import('../models/user.dto').UserDTO> {
    return this.http.patch<import('../models/user.dto').UserDTO>(`${this.API_URL}/users/${id}`, { level, region });
  }

  // ── Resource management ───────────────────────────────────────────────────

  /** Récupérer toutes les ressources (réservé manager/admin) */
  getRessources(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/ressources`);
  }

  /** Récupérer les ressources optimisées pour la page manage (avec calcul de nbOt côté backend) */
  getManageRessources(level?: number, depts?: string[]): Observable<any[]> {
    let url = `${this.API_URL}/ressources/manage`;
    const params: string[] = [];
    if (level !== undefined) {
      params.push(`level=${level}`);
    }
    if (depts && depts.length > 0) {
      params.push(`depts=${depts.join(',')}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<any[]>(url);
  }

  /** Récupérer tous les ordres de travail (OT) */
  getOts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/ordre-de-travails`);
  }

  /** Récupérer tous les sites */
  getSites(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/sites`);
  }

  /** Déclencher manuellement l'envoi d'un email d'alerte à une ressource */
  sendResourceEmail(dkCode: string): Observable<any> {
    return this.http.post(`${this.API_URL}/ressources/${dkCode}/email`, {});
  }

  /** Déclencher manuellement l'envoi d'un SMS à une ressource */
  sendResourceMessage(dkCode: string): Observable<any> {
    return this.http.post(`${this.API_URL}/ressources/${dkCode}/message`, {});
  }
}