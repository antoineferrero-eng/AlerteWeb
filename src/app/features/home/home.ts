import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapComponent } from '../map/map';
import { Card } from '../card/card';
import { List } from '../list/list';
import { Navbar } from '../../layout/navbar/navbar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MapComponent, Card, List, Navbar],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent {
  private route = inject(ActivatedRoute);
  filterLevel = signal<number | null>(null);

  constructor() {
    this.route.paramMap.subscribe(params => {
      const level = params.get('level');
      this.filterLevel.set(level ? parseInt(level, 10) : null);
    });
  }
}