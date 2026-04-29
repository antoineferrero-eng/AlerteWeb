export interface Alerte {
  type: number;
  level: number;
}

export interface Departement {
  num: string;
  lat: number;
  long: number;
}

export interface Bulletin {
  id: number;
  alertes: Alerte[];
  dailyMeteos: { id: number; data: string }[];
  departement: Departement;
}