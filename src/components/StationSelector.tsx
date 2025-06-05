import React from 'react';
import { Box, Autocomplete, TextField, Grid } from '@mui/material';
import { Station } from '../types';

interface StationSelectorProps {
  fromStation: Station | null;
  toStation: Station | null;
  onFromStationChange: (station: Station | null) => void;
  onToStationChange: (station: Station | null) => void;
  stations: Station[];
  loading: boolean;
}

const StationSelector: React.FC<StationSelectorProps> = ({
  fromStation,
  toStation,
  onFromStationChange,
  onToStationChange,
  stations,
  loading
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Autocomplete
            value={fromStation}
            onChange={(_: any, newValue: Station | null) => onFromStationChange(newValue)}
            options={stations}
            getOptionLabel={(option: Station) => option.name}
            loading={loading}
            renderInput={(params: any) => (
              <TextField
                {...params}
                label="From Station"
                variant="outlined"
                fullWidth
                helperText={loading ? "Loading stations..." : ""}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Autocomplete
            value={toStation}
            onChange={(_: any, newValue: Station | null) => onToStationChange(newValue)}
            options={stations}
            getOptionLabel={(option: Station) => option.name}
            loading={loading}
            renderInput={(params: any) => (
              <TextField
                {...params}
                label="To Station"
                variant="outlined"
                fullWidth
                helperText={loading ? "Loading stations..." : ""}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default StationSelector; 