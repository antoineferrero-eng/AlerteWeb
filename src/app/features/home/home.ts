import { Component } from '@angular/core';
import { MapComponent } from '../map/map';
import { Card } from '../card/card';
import { List } from '../list/list';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MapComponent, Card, List],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent {}