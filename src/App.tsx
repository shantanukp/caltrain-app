import React, { useState, useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { BrowserRouter, useSearchParams, useNavigate } from 'react-router-dom';
import StationSelector from './components/StationSelector';
import TimetableView from './components/TimetableView';
import { Station } from './types';
import { gtfsService } from './services/gtfs';

function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFromStation, setSelectedFromStation] = useState<Station | null>(null);
  const [selectedToStation, setSelectedToStation] = useState<Station | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  // Load stations and initialize from URL params
  useEffect(() => {
    const loadStations = async () => {
      try {
        await gtfsService.loadGTFSData('/caltrain-ca-us.zip');
        const allStations = gtfsService.getStations();
        setStations(allStations);

        // Get station IDs from URL
        const fromId = searchParams.get('from');
        const toId = searchParams.get('to');

        // Set initial stations if they exist in URL
        if (fromId) {
          const fromStation = allStations.find(s => s.id === fromId);
          if (fromStation) setSelectedFromStation(fromStation);
        }
        if (toId) {
          const toStation = allStations.find(s => s.id === toId);
          if (toStation) setSelectedToStation(toStation);
        }
      } catch (error) {
        console.error('Error loading stations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, [searchParams]);

  // Update URL when stations change
  const handleFromStationChange = (station: Station | null) => {
    setSelectedFromStation(station);
    const params = new URLSearchParams(searchParams);
    if (station) {
      params.set('from', station.id);
    } else {
      params.delete('from');
    }
    setSearchParams(params);
  };

  const handleToStationChange = (station: Station | null) => {
    setSelectedToStation(station);
    const params = new URLSearchParams(searchParams);
    if (station) {
      params.set('to', station.id);
    } else {
      params.delete('to');
    }
    setSearchParams(params);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            color: '#1976d2', // CalTrain blue
            textAlign: 'center',
            mb: 4
          }}
        >
          Caltrain Timetable
        </Typography>
        
        <StationSelector 
          fromStation={selectedFromStation}
          toStation={selectedToStation}
          onFromStationChange={handleFromStationChange}
          onToStationChange={handleToStationChange}
          stations={stations}
          loading={loading}
        />

        {selectedFromStation && selectedToStation && (
          <TimetableView 
            fromStation={selectedFromStation}
            toStation={selectedToStation}
          />
        )}
      </Box>
    </Container>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
