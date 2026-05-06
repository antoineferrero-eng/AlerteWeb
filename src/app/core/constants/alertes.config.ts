export const ALERT_TYPES: Record<string, string> = {
  "1": "Vent",
  "2": "Pluie",
  "3": "Orages",
  "4": "Inondation",
  "5": "Neige",
  "6": "Canicule",
  "7": "Froid",
  "8": "Avalanches",
  "9": "Vagues"
};

export const MAP_COLORS: Record<number, string> = {
  1: '#31aa35',
  2: '#fff600',
  3: '#ffb600',
  4: '#ff0000'
};

export const DEFAULT_MAP_COLOR = '#d2f3ff';

export const ALERT_CLASSES: Record<number, string> = {
  1: 'bg-green',
  2: 'bg-yellow',
  3: 'bg-orange',
  4: 'bg-red'
};

export const DEFAULT_ALERT_CLASS = 'bg-default';

export const getDateString = (offsetDays: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};