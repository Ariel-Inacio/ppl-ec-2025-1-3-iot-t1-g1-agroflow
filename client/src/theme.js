// theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary:   { main: '#2e7d32' },   // deep green
    secondary: { main: '#ffb300' },   // amber
    background:{ default: '#f4f6f8' }
  },
  typography: {
    fontFamily: 'Montserrat, sans-serif',
    h4: { fontWeight: 700, color: '#2e7d32' },
    h6: { fontWeight: 600, color: '#388e3c' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }
      }
    },
    MuiSlider: {
      styleOverrides: {
        thumb: {
          backgroundColor: '#ffb300',
          border: '2px solid #fff',
          '&:hover': {
            boxShadow: '0 0 0 8px rgba(255,179,0,0.2)',
          }
        },
        track: { color: '#2e7d32' },
        rail:  { color: '#ccc' }
      }
    }
  }
});

export default theme;
