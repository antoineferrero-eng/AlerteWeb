import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Map } from '../map/map';
import { Card } from '../card/card';
import { List } from '../list/list';
import { SelectionService } from '../../core/services/selection.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { Navbar } from '../../layout/navbar/navbar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Map, Card, List, Navbar],
  templateUrl: './home.html',
  styleUrl: './home.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public selectionService = inject(SelectionService);
  private geolocationService = inject(GeolocationService);

  ngOnInit() {
    this.geolocationService.locateUserAndSelectDepartment();
    
    this.route.paramMap.subscribe(params => {
      const typeId = params.get('typeId');
      
      if (typeId === 'all') {
        this.selectionService.updateType(null);
      } else {
        const numType = Number(typeId);
        if (!isNaN(numType) && numType >= 1 && numType <= 9) {
          this.selectionService.updateType(numType);
        } else {
          this.router.navigate(['/home/all']);
        }
      }
    });
  }
}