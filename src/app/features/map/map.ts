import { Component, AfterViewInit, inject, effect, NgZone } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Map as MapLibreMap, LngLatBoundsLike } from 'maplibre-gl';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SelectionService } from '../../core/services/selection.service';
import { Bulletin } from '../../core/models/bulletin.model';
import { MAP_COLORS, DEFAULT_MAP_COLOR, getDateString } from '../../core/constants/alertes.config';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class Map implements AfterViewInit {
  private apiService = inject(ApiService);
  private selectionService = inject(SelectionService);
  private alertService = inject(AlertService);
  private zone = inject(NgZone);
  private map!: MapLibreMap;
  private allBulletins: Bulletin[] = [];
  private geoJsonData: any = null;
  private isMapReady = false;
  private readonly FRANCE_BOUNDS: LngLatBoundsLike = [[-5.14, 41.33], [9.56, 51.12]];

  filterType = this.selectionService.selectedType;

  mapConfig = {
    width: '100%',
    height: '100%'
  };

  constructor() {
    effect(() => {
      const selected = this.selectionService.selectedBulletin();
      this.updateMapSelection(selected);
    });

    effect(() => {
      const typeId = this.filterType();
      if (this.isMapReady && this.allBulletins.length > 0) {
        this.applyMapColors(typeId);
      }
    });
  }

  ngAfterViewInit() {
    this.map = new MapLibreMap({
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
      const today = getDateString();

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
              'line-color': '#000000',
              'line-width': 1
            },
            filter: ['==', 'ref:INSEE', '']
          });

          this.map.on('click', 'couche-couleur-dynamique', (e) => {
            this.zone.run(() => {
              if (e.features && e.features.length > 0) {
                const codeInsee = e.features[0].properties?.['ref:INSEE'];
                const matchingBulletin = this.allBulletins.find(b => b.departement.num === codeInsee.toString());
                if (matchingBulletin) {
                  this.selectionService.updateSelection(matchingBulletin);
                }
              }
            });
          });

          this.map.on('mouseenter', 'couche-couleur-dynamique', () => this.map.getCanvas().style.cursor = 'pointer');
          this.map.on('mouseleave', 'couche-couleur-dynamique', () => this.map.getCanvas().style.cursor = '');

          this.isMapReady = true;
          this.applyMapColors(this.filterType());
          this.updateMapSelection(this.selectionService.selectedBulletin());
        }
      });
    });
  }

  applyMapColors(filterType: number | null) {
    const couleursAplaties: any[] = [];

    this.allBulletins.forEach((bulletin: any) => {
      const code = bulletin.departement.num.toString();
      const maxLevel = this.alertService.getDisplayLevel(bulletin.alertes, filterType);
      const color = this.alertService.getColorForLevel(maxLevel);

      couleursAplaties.push(code, color);
    });

    if (couleursAplaties.length > 0) {
      const expressionMatch = [
        'match',
        ['get', 'ref:INSEE'],
        ...couleursAplaties,
        DEFAULT_MAP_COLOR
      ];
      this.map.setPaintProperty('couche-couleur-dynamique', 'fill-color', expressionMatch);
    }
  }

  private updateMapSelection(selected: Bulletin | null) {
    if (!this.isMapReady || !this.map) return;

    try {
      if (selected && selected.departement && selected.departement.num) {
        this.map.setFilter('highlight-departement', ['==', 'ref:INSEE', selected.departement.num.toString()]);
        
        if (this.geoJsonData) {
          const feature = this.geoJsonData.features.find((f: any) => f.properties?.['ref:INSEE'] === selected.departement.num.toString());
          if (feature && feature.geometry && feature.geometry.coordinates) {
            const bounds = this.calculateBounds(feature);
            this.map.fitBounds(bounds, { padding: 80, maxZoom: 7, duration: 1000 });
          }
        }
      } else {
        this.map.setFilter('highlight-departement', ['==', 'ref:INSEE', '']);
      }
    } catch (e) { }
  }

  private calculateBounds(feature: any): LngLatBoundsLike {
    let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;

    const processCoordinates = (coords: any[]) => {
      if (!coords) return;
      for (const coord of coords) {
        if (Array.isArray(coord) && typeof coord[0] === 'number') {
          minLng = Math.min(minLng, coord[0]);
          minLat = Math.min(minLat, coord[1]);
          maxLng = Math.max(maxLng, coord[0]);
          maxLat = Math.max(maxLat, coord[1]);
        } else if (Array.isArray(coord)) {
          processCoordinates(coord);
        }
      }
    };

    processCoordinates(feature.geometry.coordinates);

    if (minLng > maxLng || minLat > maxLat) {
      return this.FRANCE_BOUNDS;
    }

    return [[minLng, minLat], [maxLng, maxLat]];
  }
}