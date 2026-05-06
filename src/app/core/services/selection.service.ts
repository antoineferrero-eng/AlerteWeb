import { Injectable, signal } from '@angular/core';
import { Bulletin } from '../models/bulletin.model';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  selectedBulletin = signal<Bulletin | null>(null);
  selectedType = signal<number | null>(null);

  updateSelection(bulletin: Bulletin): void {
    this.selectedBulletin.set(bulletin);
  }

  updateType(type: number | null): void {
    this.selectedType.set(type);
  }
}