import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  private apiService = inject(ApiService);

  ngOnInit(): void {
    this.apiService.getData().subscribe({
      next: (data: any) => console.log("Données reçues de l'API :", data),
      error: (err: any) => console.error("Erreur de connexion API :", err)
    });
  }
}