# Caltrain Timetable App

A React application that displays train timetables using GTFS (General Transit Feed Specification) data. Users can select origin and destination stations to view all available trains between those stations.

## Features

- Station selection with autocomplete
- Display of train schedules between selected stations
- Service day information (weekday/weekend service)
- Compatible with GTFS format data
- Modern Material-UI interface

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/caltrain-app.git
cd caltrain-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure GTFS data source:
   - Open `src/components/StationSelector.tsx`
   - Replace `YOUR_GTFS_URL_HERE` with the URL to your GTFS data feed

4. Start the development server:
```bash
npm start
```

The application will be available at http://localhost:3000

## GTFS Data Format

This application expects GTFS data in the standard format, including:
- stops.txt - For station information
- trips.txt - For train trip information
- stop_times.txt - For arrival and departure times
- calendar.txt - For service day information

## Technologies Used

- React
- TypeScript
- Material-UI
- GTFS-Stream (for GTFS data parsing)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
