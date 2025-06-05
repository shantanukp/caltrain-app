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
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Station, TimetableEntry, Direction } from '../types';
import { gtfsService } from '../services/gtfs';
import DirectionSelector from './DirectionSelector';

interface TimetableViewProps {
  fromStation: Station;
  toStation: Station;
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
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
      backgroundColor: 'rgba(76, 175, 80, 0.15)',  // Green with higher opacity
      borderLeft: '4px solid #4caf50', // Green
      '&:hover': {
        backgroundColor: 'rgba(76, 175, 80, 0.25)' // Darker on hover
      }
    }; 
  } else if (type.includes('limited')) {
    return { 
      backgroundColor: 'rgba(33, 150, 243, 0.15)',  // Blue with higher opacity
      borderLeft: '4px solid #2196f3', // Blue
      '&:hover': {
        backgroundColor: 'rgba(33, 150, 243, 0.25)' // Darker on hover
      }
    }; 
  } else if (type.includes('local')) {
    return { 
      backgroundColor: 'rgba(255, 152, 0, 0.15)',  // Orange with higher opacity
      borderLeft: '4px solid #ff9800', // Orange
      '&:hover': {
        backgroundColor: 'rgba(255, 152, 0, 0.25)' // Darker on hover
      }
    }; 
  } else {
    return { 
      backgroundColor: 'rgba(158, 158, 158, 0.1)',  // Grey with higher opacity
      borderLeft: '4px solid #9e9e9e', // Grey
      '&:hover': {
        backgroundColor: 'rgba(158, 158, 158, 0.2)' // Darker on hover
      }
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

const TimetableView: React.FC<TimetableViewProps> = ({ 
  fromStation, 
  toStation, 
  direction,
  onDirectionChange 
}) => {
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        px: 2, 
        pt: 1, 
        pb: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? 2 : 0
      }}>
        <Box>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            gutterBottom
            sx={{
              wordBreak: 'break-word',
              textAlign: isMobile ? 'center' : 'left'
            }}
          >
            Schedule: {fromStation.displayName} → {toStation.displayName}
          </Typography>

          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: 'text.secondary',
              textAlign: isMobile ? 'center' : 'left'
            }}
          >
            {formatDate(new Date())}
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: isMobile ? 'center' : 'flex-end'
        }}>
          <DirectionSelector 
            direction={direction}
            onDirectionChange={onDirectionChange}
          />
        </Box>
      </Box>
      
      <Box sx={{ 
        px: 2, 
        pb: 1,
        overflowX: 'auto',
        display: isMobile ? 'flex' : 'block',
        justifyContent: 'center'
      }}>
        <Typography 
          variant="subtitle2" 
          color="text.secondary"
          component="div"
          sx={{
            whiteSpace: 'nowrap',
            textAlign: isMobile ? 'center' : 'left'
          }}
        >
          <span style={{ color: '#4caf50' }}>●</span> Baby Bullet/Express &nbsp;&nbsp;
          <span style={{ color: '#2196f3' }}>●</span> Limited &nbsp;&nbsp;
          <span style={{ color: '#ff9800' }}>●</span> Local &nbsp;&nbsp;
          <span style={{ color: '#9e9e9e' }}>●</span> Other
        </Typography>
      </Box>
      
      <TableContainer component={Paper} sx={{ 
        flex: 1,
        overflow: 'auto',
        borderRadius: 1,
        '& .MuiTable-root': {
          borderCollapse: 'separate',
          borderSpacing: 0,
        }
      }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  borderBottom: 2,
                  borderColor: 'divider',
                  ...(isMobile && {
                    padding: '8px',
                    whiteSpace: 'nowrap'
                  })
                }}
              >
                Train
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  borderBottom: 2,
                  borderColor: 'divider',
                  ...(isMobile && {
                    padding: '8px',
                    whiteSpace: 'nowrap'
                  })
                }}
              >
                Type
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  borderBottom: 2,
                  borderColor: 'divider',
                  ...(isMobile && {
                    padding: '8px',
                    whiteSpace: 'nowrap'
                  })
                }}
              >
                Departure
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  borderBottom: 2,
                  borderColor: 'divider',
                  ...(isMobile && {
                    padding: '8px',
                    whiteSpace: 'nowrap'
                  })
                }}
              >
                Arrival
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  borderBottom: 2,
                  borderColor: 'divider',
                  ...(isMobile && {
                    padding: '8px',
                    whiteSpace: 'nowrap'
                  })
                }}
              >
                Duration
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timetableEntries.map((entry) => {
              const duration = calculateDuration(entry.departureTime, entry.arrivalTime);
              return (
                <TableRow 
                  key={`${entry.train.id}-${entry.departureTime}`}
                  sx={{
                    ...getRouteStyle(entry.train.routeType),
                    '&:hover': {
                      filter: 'brightness(0.95)'
                    },
                    ...(isMobile && {
                      '& .MuiTableCell-root': {
                        padding: '8px',
                        whiteSpace: 'nowrap'
                      }
                    })
                  }}
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
    </Box>
  );
};

export default TimetableView; 