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
  id: number;
  type: number;
  level: number;
  bulletinId: number;
}

export interface Departement {
  num: string;
  lat: number;
  long: number;
  sites: Site[];
}

export interface DailyMeteo {
  id: number;
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  apparentTempMax: number;
  apparentTempMin: number;
  sunrise: string;
  sunset: string;
  daylightDuration: number;
  sunshineDuration: number;
  uvIndexMax: number;
  uvIndexClearSkyMax: number;
  rainSum: number;
  showersSum: number;
  snowfallSum: number;
  precipitationSum: number;
  precipitationHours: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  windGustsMax: number;
  windDirectionDominant: number;
  shortwaveRadiationSum: number;
  evapotranspiration: number;
}

export interface Bulletin {
  id: number;
  date: string;
  alertes: Alerte[];
  dailyMeteos: DailyMeteo[];
  departement: Departement;
}