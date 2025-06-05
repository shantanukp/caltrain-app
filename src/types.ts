export interface Station {
  id: string;
  name: string;
  code: string;
  location: {
    lat: number;
    lon: number;
  };
}

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
} 