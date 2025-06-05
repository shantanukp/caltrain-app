import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Direction } from '../types';

interface DirectionSelectorProps {
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
}

const DirectionSelector: React.FC<DirectionSelectorProps> = ({ direction, onDirectionChange }) => {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newDirection: Direction | null,
  ) => {
    if (newDirection !== null) {
      onDirectionChange(newDirection);
    }
  };

  return (
    <ToggleButtonGroup
      value={direction}
      exclusive
      onChange={handleChange}
      aria-label="train direction"
      size="small"
      sx={{ ml: 2 }}
    >
      <ToggleButton value="Northbound" aria-label="northbound">
        <ArrowUpwardIcon sx={{ mr: 1 }} />
        Northbound
      </ToggleButton>
      <ToggleButton value="Southbound" aria-label="southbound">
        <ArrowDownwardIcon sx={{ mr: 1 }} />
        Southbound
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default DirectionSelector; 