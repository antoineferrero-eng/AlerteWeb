import { Injectable } from '@angular/core';
import { ALERT_TYPES, ALERT_CLASSES, DEFAULT_ALERT_CLASS, MAP_COLORS, DEFAULT_MAP_COLOR } from '../constants/alertes.config';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  /** Obtenir le niveau d'alerte maximum ou celui du type filtré */
  getDisplayLevel(alertes: any[] | undefined, filterType: number | null): number {
    if (!alertes || alertes.length === 0) {
      return 0;
    }
    if (filterType !== null) {
      const alert = alertes.find(a => a.type === filterType);
      return alert ? alert.level : 0;
    }
    return Math.max(...alertes.map(a => a.level));
  }

  /** Obtenir la couleur associée à un niveau d'alerte */
  getColorForLevel(level: number): string {
    return MAP_COLORS[level] || DEFAULT_MAP_COLOR;
  }

  /** Obtenir la classe CSS associée à un niveau d'alerte */
  getAlertClass(level: number): string {
    return ALERT_CLASSES[level] || DEFAULT_ALERT_CLASS;
  }

  /** Obtenir le nom du type d'alerte à partir de son identifiant */
  getAlertTypeName(typeId: string | number): string {
    return ALERT_TYPES[typeId.toString()] || "Météo";
  }

  /** Obtenir la liste des alertes filtrées ou les plus importantes */
  getFilteredAlerts(alertes: any[] | undefined, filterType: number | null): any[] {
    if (!alertes) return [];
    if (filterType !== null) {
      const alert = alertes.find(a => a.type === filterType);
      return alert ? [alert] : [];
    }
    const maxLevel = this.getDisplayLevel(alertes, filterType);
    return alertes.filter(a => a.level === maxLevel);
  }

  /** Générer un résumé textuel des alertes en cours */
  getAlertSummary(alertes: any[] | undefined, filterType: number | null): string {
    if (!alertes || alertes.length === 0) {
      return filterType !== null ? "Pas d'alerte" : "Aucune alerte.";
    }

    if (filterType !== null) {
      const alert = alertes.find(a => a.type === filterType);
      const level = alert ? alert.level : 0;
      
      if (level === 0) return `Pas d'alerte`;
      if (level === 1) return `Pas d'alerte majeure`;
      if (level === 2) return `Alerte mineure`;
      if (level === 3) return `Alerte importante`;
      return `Alerte majeure`;
    }

    const maxLevel = this.getDisplayLevel(alertes, filterType);
    const relevantAlertes = alertes.filter(a => a.level === maxLevel);

    if (maxLevel === 0) return "Aucune alerte";
    if (maxLevel === 1) return "Pas d'alerte majeure";
    const types = relevantAlertes.map(a => this.getAlertTypeName(a.type)).join(', ');
    if (maxLevel === 2) return `Alertes mineures : ${types}`;
    if (maxLevel === 3) return `Alertes importantes : ${types}`;
    return `Alertes majeures : ${types}`;
  }
}
