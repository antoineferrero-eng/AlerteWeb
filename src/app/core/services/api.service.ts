import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly API_URL = '';

  getDepartmentsGeoJson(): Observable<any> {
    return this.http.get('/dataPoly.json');
  }

  getData(): Observable<any> {
    return this.http.get(`${this.API_URL}/departements`);
  }

  getBulletinByDepartement(num: string | number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/bulletins?dep=${num}`);
  }

  getBulletinsByDate(date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/bulletins?date=${date}`);
  }
}