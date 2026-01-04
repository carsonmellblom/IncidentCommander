import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  Typography,
  Container,
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Button,
  Stack
} from '@mui/material';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AccessDenied from './pages/AccessDenied';
import Home from './pages/Home';

const NotFound = () => <Typography variant="h4" sx={{ mt: 4 }}>404 Not Found</Typography>;

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a1929', // Deep dark blue
      paper: '#001e3c',   // Slightly lighter for cards
    },
    primary: {
      main: '#3399ff', // Tech blue
    },
    secondary: {
      main: '#ce93d8', // Purple accent
    },
    error: {
      main: '#ff1744',
    },
    success: {
      main: '#00e676',
    },
    text: {
      primary: '#fff',
      secondary: '#b6c8d9',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600, letterSpacing: '0.02em' },
    h5: { fontWeight: 500, letterSpacing: '0.02em' },
    h6: { fontWeight: 500 },
    subtitle1: { letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(10, 25, 41, 0.7)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

// In a real app we'd check auth state here, for now relying on backend 401s for failed requests
// A simple "Protected Route" needs an AuthContext which we are adding next.
import { AuthProvider, PrivateRoute, AdminRoute, useAuth } from './context/AuthContext';

function AppContent() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', bgcolor: '#0a1929' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography variant="h6" component="div" sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '.1rem', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                INCIDENT COMMANDER
              </Typography>
            </Link>
          </Stack>
          {user && (
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleLogout}
                sx={{ borderColor: 'rgba(255,255,255,0.3)' }}
              >
                Sign Out
              </Button>
            </Stack>
          )}
        </Stack>

        <Container maxWidth="xl">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/access-denied" element={
              <PrivateRoute>
                <AccessDenied />
              </PrivateRoute>
            } />
            <Route path="/dashboard" element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            } />
            <Route path="/" element={<Home />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
