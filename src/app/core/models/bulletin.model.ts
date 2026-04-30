export interface SiteRessource {
  email: string;
  "dk-code-ressource": string;
}

export interface SiteOt {
  debut: string;
  numeroOt: string;
  ressource: SiteRessource;
}

export interface Site {
  "dk-code-emplacement": string;
  ordresDeTravail: SiteOt[];
}

export interface Alerte {
  type: number;
  level: number;
}

export interface Departement {
  num: string;
  lat: number;
  long: number;
  sites: Site[];
}

export interface DailyMeteoData {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
    weather_code: number[];
    sunrise: string[];
    sunset: string[];
  };
}

export interface DailyMeteo {
  id: number;
  data: string; 
}

export interface Bulletin {
  id: number;
  alertes: Alerte[];
  dailyMeteos: DailyMeteo[];
  departement: Departement;
}