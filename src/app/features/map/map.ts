import { Component, AfterViewInit, inject } from '@angular/core';
import { Map, NavigationControl } from 'maplibre-gl';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class MapComponent implements AfterViewInit {
  private apiService = inject(ApiService);
  private map!: Map;

  ngAfterViewInit() {
    this.map = new Map({
      container: 'map',
      style: 'https://api.maptiler.com/maps/019d8bf8-e2c5-713c-9f2f-2bb902febebd/style.json?key=WMoz1E5XIzcV8Oy6MxyJ',
      center: [2.4191036, 46.51109],
      zoom: 5,
      renderWorldCopies: false,
      attributionControl: false
    });
    
    this.map.dragRotate.disable();
    this.map.keyboard.disable();
    this.map.touchZoomRotate.disableRotation();
    this.map.scrollZoom.disable();
    this.map.dragPan.disable();
    this.map.doubleClickZoom.disable();

    this.map.on('load', () => {
      const today = new Date().toISOString().split('T')[0];

      forkJoin({
        geoJson: this.apiService.getDepartmentsGeoJson(),
        bulletins: this.apiService.getBulletinsByDate(today)
      }).subscribe({
        next: ({ geoJson, bulletins }) => {
          this.map.addSource('departements', {
            type: 'geojson',
            data: geoJson
          });

          this.map.addLayer({
            id: 'couche-couleur-dynamique',
            type: 'fill',
            source: 'departements',
            paint: {
              'fill-color': '#a0a0a0',
              'fill-opacity': 1
            }
          });

          this.map.addLayer({
            id: 'outline-departements',
            type: 'line',
            source: 'departements',
            paint: {
              'line-color': '#ffffff',
              'line-width': 1
            }
          });

          const couleursAplaties: any[] = [];

          bulletins.forEach((bulletin: any) => {
            const code = bulletin.departement.num.toString();
            let maxLevel = 0;

            if (bulletin.alertes && bulletin.alertes.length > 0) {
              maxLevel = Math.max(...bulletin.alertes.map((a: any) => a.level));
            }

            let color = '#d2f3ff';
            if (maxLevel === 1) color = '#31aa35';
            if (maxLevel === 2) color = '#fff600';
            if (maxLevel === 3) color = '#ffb600';
            if (maxLevel >= 4) color = '#ff0000';

            couleursAplaties.push(code, color);

            if (code === '69') {
              couleursAplaties.push('69D', color);
              couleursAplaties.push('69M', color);
            }
            if (code === '20') {
              couleursAplaties.push('2A', color);
              couleursAplaties.push('2B', color);
            }
          });

          if (couleursAplaties.length > 0) {
            const expressionMatch = [
              'match',
              ['get', 'ref:INSEE'],
              ...couleursAplaties,
              '#d2f3ff'
            ];
            
            this.map.setPaintProperty('couche-couleur-dynamique', 'fill-color', expressionMatch);
          }
        }
      });
    });
  }
}