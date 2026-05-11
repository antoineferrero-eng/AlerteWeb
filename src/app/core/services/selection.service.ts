import { Injectable, signal } from '@angular/core';
import { Bulletin } from '../models/bulletin.model';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  selectedBulletin = signal<Bulletin | null>(null);
  selectedType = signal<number | null>(null);

  /** Mettre à jour le bulletin d'alerte sélectionné */
  updateSelection(bulletin: Bulletin): void {
    this.selectedBulletin.set(bulletin);
  }

  /** Mettre à jour le type d'alerte sélectionné pour le filtrage */
  updateType(type: number | null): void {
    this.selectedType.set(type);
  }
}