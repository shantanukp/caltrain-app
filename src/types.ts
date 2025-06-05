export interface Station {
  id: string;
  name: string;
  direction: 'Northbound' | 'Southbound' | null;
  displayName: string; // Name without direction suffix
  code: string;
  location: {
    lat: number;
    lon: number;
  };
}

export type Direction = 'Northbound' | 'Southbound';

export interface Train {
  id: string;
  routeId: string;
  tripId: string;
  routeType: string;
  headsign: string;
  departureTime: string;
  arrivalTime: string;
  service: {
    weekday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
}

export interface TimetableEntry {
  train: Train;
  fromStation: Station;
  toStation: Station;
  departureTime: string;
  arrivalTime: string;
  numStops: number;
} 