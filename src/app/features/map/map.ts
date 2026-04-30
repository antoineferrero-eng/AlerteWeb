import { Component, AfterViewInit, inject, effect } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Map, LngLatBoundsLike } from 'maplibre-gl';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SelectionService } from '../../core/services/selection.service';
import { Bulletin } from '../../core/models/bulletin.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class MapComponent implements AfterViewInit {
  private apiService = inject(ApiService);
  private selectionService = inject(SelectionService);
  private map!: Map;
  private allBulletins: Bulletin[] = [];

  private geoJsonData: any = null;
  private isMapReady = false;

  private readonly FRANCE_BOUNDS: LngLatBoundsLike = [[-5.14, 41.33], [9.56, 51.12]];

  mapConfig = {
    width: '100%',
    height: '100%'
  };

  constructor() {
    effect(() => {
      const selected = this.selectionService.selectedBulletin();
      this.updateMapSelection(selected);
    });
  }

  ngAfterViewInit() {
    this.map = new Map({
      container: 'map',
      style: 'https://api.maptiler.com/maps/019d8bf8-e2c5-713c-9f2f-2bb902febebd/style.json?key=WMoz1E5XIzcV8Oy6MxyJ',
      bounds: this.FRANCE_BOUNDS,
      maxBounds: this.FRANCE_BOUNDS,
      fitBoundsOptions: { padding: 10 },
      renderWorldCopies: false,
      attributionControl: false,
      trackResize: true
    });
    
    this.map.dragRotate.disable();
    this.map.keyboard.disable();
    this.map.touchZoomRotate.disableRotation();

    window.addEventListener('resize', () => {
      this.map.resize();
    });

    this.map.on('load', () => {
      const today = new Date().toISOString().split('T')[0];

      forkJoin({
        geoJson: this.apiService.getDepartmentsGeoJson(),
        bulletins: this.apiService.getBulletinsByDate(today)
      }).subscribe({
        next: ({ geoJson, bulletins }) => {
          this.geoJsonData = geoJson;
          this.allBulletins = bulletins;

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

          this.map.addLayer({
            id: 'highlight-departement',
            type: 'line',
            source: 'departements',
            paint: {
              'line-color': '#45cdff',
              'line-width': 3 
            },
            filter: ['==', 'ref:INSEE', ''] 
          });

          this.map.on('click', 'couche-couleur-dynamique', (e) => {
            if (e.features && e.features.length > 0) {
              const codeInsee = e.features[0].properties?.['ref:INSEE'];
              const matchingBulletin = this.allBulletins.find(b => b.departement.num === codeInsee.toString());
              if (matchingBulletin) {
                this.selectionService.updateSelection(matchingBulletin);
              }
            }
          });

          this.map.on('mouseenter', 'couche-couleur-dynamique', () => this.map.getCanvas().style.cursor = 'pointer');
          this.map.on('mouseleave', 'couche-couleur-dynamique', () => this.map.getCanvas().style.cursor = '');

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
            if (code === '69') couleursAplaties.push('69D', color, '69M', color);
            if (code === '20') couleursAplaties.push('2A', color, '2B', color);
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

          this.isMapReady = true;
          this.updateMapSelection(this.selectionService.selectedBulletin());
        }
      });
    });
  }

  private updateMapSelection(selected: Bulletin | null) {
    if (!this.isMapReady || !this.map) return;

    if (selected) {
      this.map.setFilter('highlight-departement', ['==', 'ref:INSEE', selected.departement.num]);

      if (this.geoJsonData) {
        const feature = this.geoJsonData.features.find((f: any) => f.properties?.['ref:INSEE'] === selected.departement.num);
        if (feature) {
          const bounds = this.calculateBounds(feature);
          this.map.fitBounds(bounds, { padding: 40, maxZoom: 8, duration: 1000 });
        }
      }
    } else {
      this.map.setFilter('highlight-departement', ['==', 'ref:INSEE', '']);
    }
  }

  private calculateBounds(feature: any): LngLatBoundsLike {
    let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;

    const processCoordinates = (coords: any[]) => {
      for (const coord of coords) {
        if (typeof coord[0] === 'number') {
          minLng = Math.min(minLng, coord[0]);
          minLat = Math.min(minLat, coord[1]);
          maxLng = Math.max(maxLng, coord[0]);
          maxLat = Math.max(maxLat, coord[1]);
        } else {
          processCoordinates(coord);
        }
      }
    };

    processCoordinates(feature.geometry.coordinates);
    return [[minLng, minLat], [maxLng, maxLat]];
  }
}