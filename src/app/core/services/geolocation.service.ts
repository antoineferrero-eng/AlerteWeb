import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { SelectionService } from './selection.service';
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { firstValueFrom } from 'rxjs';
import { getDateString } from '../constants/alertes.config';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private apiService = inject(ApiService);
  private selectionService = inject(SelectionService);

  /** Localiser l'utilisateur et sélectionner automatiquement son département */
  async locateUserAndSelectDepartment(): Promise<void> {
    try {
      if (!navigator.geolocation) {
        return;
      }

      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          const userPoint = point([lng, lat]);

          const geoJson = await firstValueFrom(this.apiService.getDepartmentsGeoJson());

          let foundInseeCode: string | null = null;

          for (const feature of geoJson.features) {
            if (feature.geometry && booleanPointInPolygon(userPoint, feature as any)) {
              foundInseeCode = feature.properties?.['ref:INSEE'];
              break;
            }
          }

          if (foundInseeCode) {
            const todayStr = getDateString();
            const bulletins = await firstValueFrom(this.apiService.getBulletinsByDate(todayStr));
            const matchingBulletin = bulletins.find(b => b.departement.num === foundInseeCode);

            if (matchingBulletin) {
              this.selectionService.updateSelection(matchingBulletin);
            }
          }
        } catch (e) {
        }
      }, () => {
      }, {
        enableHighAccuracy: false,
        maximumAge: 900000,
        timeout: 30000
      });
    } catch (e) {
    }
  }
}
