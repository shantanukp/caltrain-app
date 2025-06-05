import JSZip from 'jszip';
import { Station, Train, TimetableEntry } from '../types';

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

  async loadGTFSData(gtfsUrl: string): Promise<void> {
    if (this.loaded) return;

    try {
      const response = await fetch(gtfsUrl);
      if (!response.ok) throw new Error('Failed to fetch GTFS data');
      
      const zipBuffer = await response.arrayBuffer();
      const zip = new JSZip();
      const contents = await zip.loadAsync(zipBuffer);
      
      // Parse routes.txt first
      const routesText = await contents.file('routes.txt')?.async('text');
      if (routesText) {
        const routes = this.parseCSV<GTFSRoute>(routesText);
        routes.forEach(route => {
          this.routes.set(route.route_id, route);
        });
      }

      // Parse stops.txt
      const stopsText = await contents.file('stops.txt')?.async('text');
      if (stopsText) {
        this.stations = this.parseCSV<GTFSStop>(stopsText).map(stop => ({
          id: stop.stop_id,
          name: stop.stop_name,
          code: stop.stop_code || stop.stop_id,
          location: {
            lat: parseFloat(stop.stop_lat),
            lon: parseFloat(stop.stop_lon)
          }
        }));
        console.log("Found stations", this.stations);
      }

      // Parse stop_times.txt
      const stopTimesText = await contents.file('stop_times.txt')?.async('text');
      if (stopTimesText) {
        this.stopTimes = this.parseCSV<GTFSStopTime>(stopTimesText);
      }

      // Parse calendar.txt
      const calendarText = await contents.file('calendar.txt')?.async('text');
      if (calendarText) {
        this.calendar = this.parseCSV<GTFSCalendar>(calendarText);
      }

      // Parse trips.txt
      const tripsText = await contents.file('trips.txt')?.async('text');
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
    // Sort stations from northwest (higher lat, lower lon) to southeast (lower lat, higher lon)
    return [...this.stations].sort((a, b) => {
      // Calculate a score that combines latitude and longitude
      // Higher latitude (more north) and lower longitude (more west) will get a higher score
      const scoreA = a.location.lat - a.location.lon;
      const scoreB = b.location.lat - b.location.lon;
      return scoreB - scoreA; // Sort in descending order (northwest first)
    });
  }

  getTimetable(fromStation: Station, toStation: Station): TimetableEntry[] {
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
          timetable.push({
            train: {
              ...train,
              departureTime: fromStopTime.departure_time,
              arrivalTime: toStopTime.arrival_time
            },
            fromStation,
            toStation,
            departureTime: fromStopTime.departure_time,
            arrivalTime: toStopTime.arrival_time
          });
          processedTrips.add(fromStopTime.trip_id);
        }
      }
    }

    return timetable.sort((a, b) => 
      a.departureTime.localeCompare(b.departureTime)
    );
  }
}

export const gtfsService = new GTFSService(); 