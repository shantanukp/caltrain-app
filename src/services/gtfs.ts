import JSZip from 'jszip';
import { Station, Train, TimetableEntry, Direction } from '../types';

interface GTFSStop {
  stop_id: string;
  stop_name: string;
  stop_code: string;
  stop_lat: string;
  stop_lon: string;
}

interface GTFSTrip {
  trip_id: string;
  route_id: string;
  service_id: string;
  trip_headsign?: string;
  trip_short_name?: string;
}

interface GTFSRoute {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
  route_desc?: string;
}

interface GTFSStopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: string;
}

interface GTFSCalendar {
  service_id: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

class GTFSService {
  private stations: Station[] = [];
  private trains: Train[] = [];
  private stopTimes: GTFSStopTime[] = [];
  private calendar: GTFSCalendar[] = [];
  private routes: Map<string, GTFSRoute> = new Map();
  private loaded = false;
  private timetableData: TimetableEntry[] = [];
  private initialized = false;

  async loadGTFSData(gtfsUrl: string): Promise<void> {
    if (this.initialized) return;

    try {
      const response = await fetch(process.env.PUBLIC_URL + gtfsUrl);
      const blob = await response.blob();
      const zip = await JSZip.loadAsync(blob);
      
      // Parse routes.txt first
      const routesText = await zip.file('routes.txt')?.async('text');
      if (routesText) {
        const routes = this.parseCSV<GTFSRoute>(routesText);
        routes.forEach(route => {
          this.routes.set(route.route_id, route);
        });
      }

      // Load stops.txt
      const stopsFile = await zip.file('stops.txt')?.async('text');
      if (!stopsFile) throw new Error('stops.txt not found in GTFS data');

      const stops = this.parseCSV<GTFSStop>(stopsFile);
      this.stations = stops
        .filter(stop => stop.stop_id && stop.stop_name)
        .map(stop => {
          const name = stop.stop_name;
          const direction = this.getDirectionFromName(name);
          return {
            id: stop.stop_id,
            name: name,
            direction: direction,
            displayName: this.removeDirectionSuffix(name),
            code: stop.stop_code || stop.stop_id,
            location: {
              lat: parseFloat(stop.stop_lat),
              lon: parseFloat(stop.stop_lon)
            }
          };
        })
        .filter(station => station.direction !== null);

      // Parse stop_times.txt
      const stopTimesText = await zip.file('stop_times.txt')?.async('text');
      if (stopTimesText) {
        this.stopTimes = this.parseCSV<GTFSStopTime>(stopTimesText);
      }

      // Parse calendar.txt
      const calendarText = await zip.file('calendar.txt')?.async('text');
      if (calendarText) {
        this.calendar = this.parseCSV<GTFSCalendar>(calendarText);
      }

      // Parse trips.txt
      const tripsText = await zip.file('trips.txt')?.async('text');
      if (tripsText) {
        const trips = this.parseCSV<GTFSTrip>(tripsText);
        this.trains = trips.map(trip => {
          const service = this.calendar.find(cal => cal.service_id === trip.service_id);
          const route = this.routes.get(trip.route_id);
          return {
            id: trip.trip_id,
            routeId: trip.route_id,
            tripId: trip.trip_id,
            routeType: route?.route_long_name || route?.route_short_name || 'Unknown',
            headsign: trip.trip_headsign || '',
            departureTime: '',  // Will be populated when getting timetable
            arrivalTime: '',    // Will be populated when getting timetable
            service: {
              weekday: service ? service.monday === '1' || service.tuesday === '1' || 
                               service.wednesday === '1' || service.thursday === '1' || 
                               service.friday === '1' : false,
              saturday: service ? service.saturday === '1' : false,
              sunday: service ? service.sunday === '1' : false
            }
          };
        });
      }

      this.loaded = true;
      this.initialized = true;
    } catch (error) {
      console.error('Error loading GTFS data:', error);
      throw error;
    }
  }

  private parseCSV<T>(csv: string): T[] {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj: any, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {}) as T;
      });
  }

  getStations(): Station[] {
    return this.stations;
  }

  getUniqueStationNames(): string[] {
    const uniqueNames = new Set<string>();
    this.stations.forEach(station => uniqueNames.add(station.displayName));
    return Array.from(uniqueNames).sort();
  }

  getStationsByDirection(direction: Direction): Station[] {
    return this.stations.filter(station => station.direction === direction);
  }

  getStationByNameAndDirection(displayName: string, direction: Direction): Station | undefined {
    return this.stations.find(
      station => station.displayName === displayName && station.direction === direction
    );
  }

  getStopsBetween(tripId: string, fromStationId: string, toStationId: string): number {
    // Get all stop times for this trip
    const tripStops = this.stopTimes
      .filter(st => st.trip_id === tripId)
      .sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence));

    // Find the sequence numbers for our stations
    const fromStop = tripStops.find(st => st.stop_id === fromStationId);
    const toStop = tripStops.find(st => st.stop_id === toStationId);

    if (!fromStop || !toStop) return 0;

    const fromSeq = parseInt(fromStop.stop_sequence);
    const toSeq = parseInt(toStop.stop_sequence);

    // Count stops between these sequences (excluding the departure station)
    return tripStops.filter(st => {
      const seq = parseInt(st.stop_sequence);
      return seq > fromSeq && seq <= toSeq;
    }).length;
  }

  getTimetable(fromStation: Station, toStation: Station): TimetableEntry[] {
    // Only return timetable entries if stations are in the same direction
    if (fromStation.direction !== toStation.direction) {
      return [];
    }
    
    const relevantStopTimes = this.stopTimes.filter(st => 
      st.stop_id === fromStation.id || st.stop_id === toStation.id
    );

    const timetable: TimetableEntry[] = [];
    const processedTrips = new Set<string>();

    for (const fromStopTime of relevantStopTimes) {
      if (fromStopTime.stop_id !== fromStation.id || processedTrips.has(fromStopTime.trip_id)) continue;

      const toStopTime = this.stopTimes.find(st => 
        st.trip_id === fromStopTime.trip_id && 
        st.stop_id === toStation.id &&
        parseInt(st.stop_sequence) > parseInt(fromStopTime.stop_sequence)
      );

      if (toStopTime) {
        const train = this.trains.find(t => t.id === fromStopTime.trip_id);
        if (train) {
          const numStops = this.getStopsBetween(train.id, fromStation.id, toStation.id);
          const entry: TimetableEntry = {
            train: {
              ...train,
              departureTime: fromStopTime.departure_time,
              arrivalTime: toStopTime.arrival_time
            },
            fromStation,
            toStation,
            departureTime: fromStopTime.departure_time,
            arrivalTime: toStopTime.arrival_time,
            numStops
          };
          timetable.push(entry);
          processedTrips.add(fromStopTime.trip_id);
        }
      }
    }

    return timetable.sort((a, b) => 
      a.departureTime.localeCompare(b.departureTime)
    );
  }

  private getDirectionFromName(name: string): 'Northbound' | 'Southbound' | null {
    if (name.includes('Northbound')) return 'Northbound';
    if (name.includes('Southbound')) return 'Southbound';
    return null;
  }

  private removeDirectionSuffix(name: string): string {
    return name
      .replace(' Northbound', '')
      .replace(' Southbound', '')
      .replace(' Caltrain', '')
      .trim();
  }
}

export const gtfsService = new GTFSService(); 