import React, { useEffect, useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Box,
  Tooltip
} from '@mui/material';
import { Station, TimetableEntry } from '../types';
import { gtfsService } from '../services/gtfs';

interface TimetableViewProps {
  fromStation: Station;
  toStation: Station;
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  let hour = parseInt(hours);
  const isPM = hour >= 12;
  
  // Convert to 12-hour format
  if (hour > 24) {
    // Handle next day times
    hour = hour - 24;
    return `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'} (+1)`;
  } else {
    // Handle same day times
    return `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${minutes} ${isPM ? 'PM' : 'AM'}`;
  }
};

const calculateDuration = (departure: string, arrival: string) => {
  const [depHours, depMinutes] = departure.split(':').map(Number);
  const [arrHours, arrMinutes] = arrival.split(':').map(Number);
  
  let durationMinutes = (arrHours * 60 + arrMinutes) - (depHours * 60 + depMinutes);
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return { 
    text: `${hours}h ${minutes}m`,
    minutes: durationMinutes
  };
};

const getRouteStyle = (routeType: string) => {
  const type = routeType.toLowerCase();
  
  if (type.includes('bullet') || type.includes('express')) {
    return { 
      backgroundColor: '#f1f8e9',  // Light green
      borderLeft: '4px solid #4caf50' // Green
    }; 
  } else if (type.includes('limited')) {
    return { 
      backgroundColor: '#e3f2fd',  // Light blue
      borderLeft: '4px solid #2196f3' // Blue
    }; 
  } else if (type.includes('local')) {
    return { 
      backgroundColor: '#fff3e0',  // Light orange
      borderLeft: '4px solid #ff9800' // Orange
    }; 
  } else {
    return { 
      backgroundColor: '#ffffff',  // White
      borderLeft: '4px solid #9e9e9e' // Grey
    }; 
  }
};

const isTrainRunningToday = (train: TimetableEntry['train']) => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1-5 is Monday-Friday, 6 is Saturday
  
  if (dayOfWeek === 0) return train.service.sunday;
  if (dayOfWeek === 6) return train.service.saturday;
  return train.service.weekday;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const TimetableView: React.FC<TimetableViewProps> = ({ fromStation, toStation }) => {
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const entries = gtfsService.getTimetable(fromStation, toStation)
      .filter(entry => isTrainRunningToday(entry.train));
    setTimetableEntries(entries);
    setLoading(false);
  }, [fromStation, toStation]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Typography variant="h5" sx={{ p: 2 }}>
        Schedule: {fromStation.name} → {toStation.name}
      </Typography>

      <Typography variant="subtitle1" sx={{ px: 2, color: 'text.secondary' }}>
        {formatDate(new Date())}
      </Typography>
      
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          <span style={{ color: '#4caf50' }}>●</span> Baby Bullet/Express &nbsp;&nbsp;
          <span style={{ color: '#2196f3' }}>●</span> Limited &nbsp;&nbsp;
          <span style={{ color: '#ff9800' }}>●</span> Local &nbsp;&nbsp;
          <span style={{ color: '#9e9e9e' }}>●</span> Other
        </Typography>
      </Box>
      
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Train</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Departure</TableCell>
              <TableCell>Arrival</TableCell>
              <TableCell>Duration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timetableEntries.map((entry) => {
              const duration = calculateDuration(entry.departureTime, entry.arrivalTime);
              return (
                <TableRow 
                  key={`${entry.train.id}-${entry.departureTime}`}
                  sx={getRouteStyle(entry.train.routeType)}
                >
                  <TableCell>{entry.train.id}</TableCell>
                  <TableCell>
                    <Tooltip title={entry.train.headsign}>
                      <span>{entry.train.routeType}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{formatTime(entry.departureTime)}</TableCell>
                  <TableCell>{formatTime(entry.arrivalTime)}</TableCell>
                  <TableCell>{duration.text}</TableCell>
                </TableRow>
              );
            })}
            {timetableEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No trains running on this route today
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TimetableView; 