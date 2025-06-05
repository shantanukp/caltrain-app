import React from 'react';
import { Autocomplete, TextField, Box, IconButton, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { Station, Direction } from '../types';
import { gtfsService } from '../services/gtfs';

interface StationSelectorProps {
  fromStation: Station | null;
  toStation: Station | null;
  onFromStationChange: (station: Station | null) => void;
  onToStationChange: (station: Station | null) => void;
  direction: Direction;
  onSwapRequested: () => void;
  loading: boolean;
}

const StationSelector: React.FC<StationSelectorProps> = ({
  fromStation,
  toStation,
  onFromStationChange,
  onToStationChange,
  direction,
  onSwapRequested,
  loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const stationNames = gtfsService.getUniqueStationNames();

  const handleFromStationChange = (_event: any, value: string | null) => {
    if (value) {
      const station = gtfsService.getStationByNameAndDirection(value, direction);
      onFromStationChange(station || null);
    } else {
      onFromStationChange(null);
    }
  };

  const handleToStationChange = (_event: any, value: string | null) => {
    if (value) {
      const station = gtfsService.getStationByNameAndDirection(value, direction);
      onToStationChange(station || null);
    } else {
      onToStationChange(null);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      gap: 2, 
      alignItems: isMobile ? 'stretch' : 'center',
      width: '100%'
    }}>
      <Autocomplete
        value={fromStation?.displayName || null}
        onChange={handleFromStationChange}
        options={stationNames}
        sx={{ 
          width: isMobile ? '100%' : 300,
          flexGrow: isMobile ? 1 : 0
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="From Station"
            disabled={loading}
          />
        )}
      />

      <Tooltip title="Swap stations">
        <IconButton 
          onClick={onSwapRequested}
          disabled={loading}
          sx={{ 
            bgcolor: 'action.selected',
            '&:hover': {
              bgcolor: 'action.focus',
            },
            alignSelf: isMobile ? 'center' : 'auto'
          }}
        >
          {isMobile ? <SwapVertIcon /> : <SwapHorizIcon />}
        </IconButton>
      </Tooltip>

      <Autocomplete
        value={toStation?.displayName || null}
        onChange={handleToStationChange}
        options={stationNames}
        sx={{ 
          width: isMobile ? '100%' : 300,
          flexGrow: isMobile ? 1 : 0
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="To Station"
            disabled={loading}
          />
        )}
      />
    </Box>
  );
};

export default StationSelector; 