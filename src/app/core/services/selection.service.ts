import { Injectable, signal } from '@angular/core';
import { Bulletin } from '../models/bulletin.model';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  selectedBulletin = signal<Bulletin | null>(null);

  updateSelection(bulletin: Bulletin): void {
    this.selectedBulletin.set(bulletin);
  }
}