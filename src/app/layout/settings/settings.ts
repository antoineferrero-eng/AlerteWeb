import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

/** Convertit une expression cron "s m h * * *" → "HH:MM" */
function cronToTime(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  const minuteIdx = parts.length === 6 ? 1 : 0;
  const hourIdx = parts.length === 6 ? 2 : 1;
  let h = parts[hourIdx] ?? '0';
  let m = parts[minuteIdx] ?? '0';

  // Sécurité si le cron est corrompu (ex: "NaN")
  if (h === 'NaN' || isNaN(parseInt(h, 10))) h = '00';
  if (m === 'NaN' || isNaN(parseInt(m, 10))) m = '00';

  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

/** Convertit "HH:MM" → expression cron Spring "0 MM HH * * *" */
function timeToCron(time: string): string {
  if (!time || !time.includes(':')) return '0 0 0 * * *';
  const [h, m] = time.split(':');
  const hh = parseInt(h, 10);
  const mm = parseInt(m, 10);

  if (isNaN(hh) || isNaN(mm)) return '0 0 0 * * *';
  return `0 ${mm} ${hh} * * *`;
}

export const ALERT_LEVELS = [
  { value: '1', label: 'Vert' },
  { value: '2', label: 'Jaune' },
  { value: '3', label: 'Orange' },
  { value: '4', label: 'Rouge' },
];

export const ALERT_TYPES = [
  { value: '1', label: 'Vent violent' },
  { value: '2', label: 'Pluie-inondation' },
  { value: '3', label: 'Orages' },
  { value: '4', label: 'Crues' },
  { value: '5', label: 'Neige/verglas' },
  { value: '6', label: 'Canicule' },
  { value: '7', label: 'Grand froid' },
  { value: '8', label: 'Avalanches' },
  { value: '9', label: 'Vagues-submersion' },
];

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsDialogComponent implements OnInit {
  private api = inject(ApiService);
  private dialogRef = inject(MatDialogRef<SettingsDialogComponent>);
  private cdr = inject(ChangeDetectorRef);

  readonly alertLevels = ALERT_LEVELS;
  readonly alertTypes = ALERT_TYPES;

  /** Niveaux sélectionnés (ex: ['orange', 'rouge']) */
  selectedLevels: string[] = [];
  /** Types sélectionnés (ex: ['1','2','3','4']) */
  selectedTypes: string[] = [];
  /** Heure de mise à jour au format HH:MM */
  updateTime = '00:00';
  /** Heure d'envoi mail au format HH:MM */
  mailTime = '04:00';

  loading = true;
  saving = false;

  ngOnInit(): void {
    forkJoin({
      config: this.api.getFullConfig(),
    }).subscribe({
      next: ({ config }) => {
        this.selectedLevels = config.activeLevels ?? [];
        this.selectedTypes = config.activeTypes ?? [];
        this.updateTime = cronToTime(config.updateTime ?? '0 0 0 * * *');
        this.mailTime = cronToTime(config.mailTime ?? '0 0 4 * * *');
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isLevelSelected(value: string): boolean {
    return this.selectedLevels.includes(value);
  }

  toggleLevel(value: string, checked: boolean): void {
    if (checked) {
      this.selectedLevels = [...this.selectedLevels, value];
    } else {
      this.selectedLevels = this.selectedLevels.filter(v => v !== value);
    }
  }

  isTypeSelected(value: string): boolean {
    return this.selectedTypes.includes(value);
  }

  toggleType(value: string, checked: boolean): void {
    if (checked) {
      this.selectedTypes = [...this.selectedTypes, value];
    } else {
      this.selectedTypes = this.selectedTypes.filter(v => v !== value);
    }
  }

  save(): void {
    this.saving = true;
    forkJoin({
      levels: this.api.setActiveLevels(this.selectedLevels),
      types: this.api.setActiveTypes(this.selectedTypes),
      mailCron: this.api.setMailCron(timeToCron(this.mailTime)),
      updateCron: this.api.setUpdateCron(timeToCron(this.updateTime)),
    }).subscribe({
      next: () => {
        this.saving = false;
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}
