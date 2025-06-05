import { createTheme } from '@mui/material';

// Caltrain colors
const colors = {
  primary: {
    main: '#CC2229', // Caltrain red
    light: '#d44b51',
    dark: '#8f171c',
    contrastText: '#fff',
  },
  background: {
    default: '#2B2D2F', // Dark gray background
    paper: '#3A3C3E', // Slightly lighter gray for cards
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
  },
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: colors.primary,
    background: colors.background,
    text: colors.text,
  },
  components: {
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.background.paper,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&.Mui-selected': {
            backgroundColor: colors.primary.main,
            color: colors.primary.contrastText,
            '&:hover': {
              backgroundColor: colors.primary.dark,
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: colors.background.paper,
        },
      },
    },
  },
}); 