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
}