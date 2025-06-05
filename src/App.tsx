import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, ThemeProvider, CssBaseline } from '@mui/material';
import { HashRouter, useSearchParams } from 'react-router-dom';
import StationSelector from './components/StationSelector';
import TimetableView from './components/TimetableView';
import { Station, Direction } from './types';
import { gtfsService } from './services/gtfs';
import { theme } from './theme';

function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFromStation, setSelectedFromStation] = useState<Station | null>(null);
  const [selectedToStation, setSelectedToStation] = useState<Station | null>(null);
  const [direction, setDirection] = useState<Direction>('Northbound');
  const [loading, setLoading] = useState(true);

  // Load stations and initialize from URL params
  useEffect(() => {
    const loadStations = async () => {
      try {
        await gtfsService.loadGTFSData('/caltrain-ca-us.zip');
        
        // Get parameters from URL
        const fromId = searchParams.get('from');
        const toId = searchParams.get('to');
        const urlDirection = searchParams.get('direction') as Direction;

        // Set direction if valid
        if (urlDirection && (urlDirection === 'Northbound' || urlDirection === 'Southbound')) {
          setDirection(urlDirection);
        }

        // Set initial stations if they exist in URL
        if (fromId) {
          const fromStation = gtfsService.getStations().find(s => s.id === fromId);
          if (fromStation) setSelectedFromStation(fromStation);
        }
        if (toId) {
          const toStation = gtfsService.getStations().find(s => s.id === toId);
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

  // Update URL when stations or direction change
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

  const handleDirectionChange = (newDirection: Direction) => {
    setDirection(newDirection);
    
    // Try to find matching stations in the new direction
    const newFromStation = selectedFromStation 
      ? gtfsService.getStationByNameAndDirection(selectedFromStation.displayName, newDirection) || null
      : null;
    
    const newToStation = selectedToStation
      ? gtfsService.getStationByNameAndDirection(selectedToStation.displayName, newDirection) || null
      : null;

    // Update stations
    setSelectedFromStation(newFromStation);
    setSelectedToStation(newToStation);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set('direction', newDirection);
    
    if (newFromStation) {
      params.set('from', newFromStation.id);
    } else {
      params.delete('from');
    }
    
    if (newToStation) {
      params.set('to', newToStation.id);
    } else {
      params.delete('to');
    }
    
    setSearchParams(params);
  };

  const handleSwapStations = () => {
    // Calculate new direction
    const newDirection = direction === 'Northbound' ? 'Southbound' : 'Northbound';
    
    // Get stations in new direction
    const newFromStation = selectedToStation 
      ? gtfsService.getStationByNameAndDirection(selectedToStation.displayName, newDirection) || null
      : null;
    
    const newToStation = selectedFromStation
      ? gtfsService.getStationByNameAndDirection(selectedFromStation.displayName, newDirection) || null
      : null;

    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set('direction', newDirection);
    
    if (newFromStation) {
      params.set('from', newFromStation.id);
    } else {
      params.delete('from');
    }
    
    if (newToStation) {
      params.set('to', newToStation.id);
    } else {
      params.delete('to');
    }

    // Update all state at once
    setDirection(newDirection);
    setSelectedFromStation(newFromStation);
    setSelectedToStation(newToStation);
    setSearchParams(params);
  };

  return (
    <Box 
      sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.default'
      }}
    >
      <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ py: 3 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
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
            direction={direction}
            onSwapRequested={handleSwapStations}
            loading={loading}
          />
        </Box>

        <Box sx={{ flex: 1, overflow: 'hidden', mb: 3 }}>
          {selectedFromStation && selectedToStation && (
            <TimetableView 
              fromStation={selectedFromStation}
              toStation={selectedToStation}
              direction={direction}
              onDirectionChange={handleDirectionChange}
            />
          )}
        </Box>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
