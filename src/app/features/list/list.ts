import { Component, OnInit, inject, signal, effect, computed, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { SelectionService } from '../../core/services/selection.service';
import { DEPARTEMENTS_MAP } from '../../core/constants/departements'; 

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [NgFor, NgClass, NgIf],
  templateUrl: './list.html',
  styleUrl: './list.css'
})
export class List implements OnInit {
  private http = inject(HttpClient);
  public selectionService = inject(SelectionService);
  
  filterLevel = input<number | null>(null);
  allBulletins = signal<any[]>([]);

  filteredBulletins = computed(() => {
    const bulletins = this.allBulletins();
    const level = this.filterLevel();

    if (level === null) {
      return bulletins;
    }

    return bulletins.filter(b => b.alertes && b.alertes.some((a: any) => a.level === level));
  });

  selectedNum = computed(() => {
    const selected = this.selectionService.selectedBulletin();
    return selected?.departement?.num;
  });

  constructor() {
    effect(() => {
      const num = this.selectedNum();
      if (num) {
        setTimeout(() => {
          const element = document.getElementById('dept-' + num);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    });
  }

  ngOnInit() {
    const todayStr = new Date().toISOString().split('T')[0];
    
    this.http.get<any[]>(`http://localhost:8080/bulletins?date=${todayStr}`)
      .subscribe({
        next: (data) => {
          const filtered = data.filter(b => DEPARTEMENTS_MAP[b.departement.num]);

          const sorted = filtered.sort((a, b) => {
            return a.departement.num.localeCompare(b.departement.num, undefined, { numeric: true });
          });
          
          this.allBulletins.set(sorted);
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  selectDepartement(bulletin: any) {
    this.selectionService.updateSelection(bulletin);
  }

  isSelected(bulletin: any): boolean {
    return this.selectedNum() === bulletin.departement.num;
  }

  getDeptName(num: string): string {
    return DEPARTEMENTS_MAP[num] || `Département ${num}`;
  }

  getFilteredAlerts(alertes: any[]): any[] {
    if (!alertes) return [];
    const level = this.filterLevel();
    if (level !== null) {
      return alertes.filter((a: any) => a.level === level);
    }
    return alertes;
  }

  getMaxLevel(alertes: any[]): number {
    if (!alertes || alertes.length === 0) return 0;
    return Math.max(...alertes.map(a => a.level));
  }

  getDisplayLevel(alertes: any[]): number {
    const filtered = this.getFilteredAlerts(alertes);
    return this.getMaxLevel(filtered);
  }

  getAlertClass(level: number): string {
    if (level === 1) return 'bg-green';
    if (level === 2) return 'bg-yellow';
    if (level === 3) return 'bg-orange';
    if (level >= 4) return 'bg-red';
    return 'bg-default';
  }

  getAlertSummary(alertes: any[]): string {
    if (!alertes || alertes.length === 0) return "Aucune alerte.";
    
    const maxLevel = this.getMaxLevel(alertes);
    const filterLevel = this.filterLevel();
    
    if (filterLevel !== null) {
      if (maxLevel === 1) return "Pas d'alerte majeure.";
      if (maxLevel === 2) return "Alertes mineures.";
      if (maxLevel === 3) return "Alertes importantes.";
      if (maxLevel >= 4) return "Alertes majeures.";
    }

    if (maxLevel === 1) return "Pas d'alerte majeure.";
    
    const typesOfMaxLevel = alertes
      .filter(a => a.level === maxLevel)
      .map(a => this.getAlertTypeName(a.type.toString()))
      .join(', ');

    if (maxLevel === 2) return `Il y a des alertes mineures pour : ${typesOfMaxLevel}`;
    if (maxLevel === 3) return `Il y a des alertes pour : ${typesOfMaxLevel}`;
    if (maxLevel >= 4) return `Il y a des alertes majeures pour : ${typesOfMaxLevel}`;

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
}