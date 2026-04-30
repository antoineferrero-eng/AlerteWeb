import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgClass } from '@angular/common';
import { SelectionService } from '../../core/services/selection.service';
import { DEPARTEMENTS_MAP } from '../../core/constants/departements'; 

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './list.html',
  styleUrl: './list.css'
})
export class List implements OnInit {
  private http = inject(HttpClient);
  public selectionService = inject(SelectionService);
  
  bulletins = signal<any[]>([]);

  constructor() {
    effect(() => {
      const selected = this.selectionService.selectedBulletin();
      if (selected) {
        setTimeout(() => {
          const element = document.getElementById('dept-' + selected.departement.num);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    });
  }

  ngOnInit() {
    const todayStr = new Date().toISOString().split('T')[0];
    
    this.http.get<any[]>(`http://localhost:8080/bulletins/date/${todayStr}`)
      .subscribe(data => {
        const filtered = data.filter(b => DEPARTEMENTS_MAP[b.departement.num]);

        // 2. On trie le résultat filtré
        const sorted = filtered.sort((a, b) => {
          return a.departement.num.localeCompare(b.departement.num, undefined, { numeric: true });
        });
        
        this.bulletins.set(sorted);
      });
  }

  selectDepartement(bulletin: any) {
    this.selectionService.updateSelection(bulletin);
  }

  isSelected(bulletin: any): boolean {
    const selected = this.selectionService.selectedBulletin();
    return selected !== null && 
           selected.departement !== undefined && 
           selected.departement.num === bulletin.departement.num;
  }

  getDeptName(num: string): string {
    return DEPARTEMENTS_MAP[num] || `Département ${num}`;
  }

  getMaxLevel(alertes: any[]): number {
    if (!alertes || alertes.length === 0) return 0;
    return Math.max(...alertes.map(a => a.level));
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
    
    if (maxLevel === 1) {
      return "Pas d'alerte majeure";
    }

    const typesOfMaxLevel = alertes
      .filter(a => a.level === maxLevel)
      .map(a => this.getAlertTypeName(a.type.toString()))
      .join(', ');

    if (maxLevel === 2) {
      return `Il y a des alertes mineures pour : ${typesOfMaxLevel}`;
    } else if (maxLevel === 3) {
      return `Il y a des alertes pour : ${typesOfMaxLevel}`;
    } else if (maxLevel >= 4) {
      return `Il y a des alertes majeures pour : ${typesOfMaxLevel}`;
    }

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