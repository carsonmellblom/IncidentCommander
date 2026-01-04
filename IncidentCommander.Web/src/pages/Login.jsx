import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    TextField,
    Button,
    Typography,
    Alert,
    Paper,
} from '@mui/material';

import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            if (response.ok) {
                // Fetch full user data including roles
                const meResponse = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
                if (meResponse.ok) {
                    const userData = await meResponse.json();
                    login(userData);
                    navigate('/');
                } else {
                    setError('Failed to fetch user data.');
                }
            } else {
                setError('Invalid login attempt.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    py: 4,
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                    }}
                >
                    {/* Header */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography
                            component="h1"
                            variant="h4"
                            gutterBottom
                            sx={{ fontWeight: 600, color: 'primary.main' }}
                        >
                            Login
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Sign in to access Incident Commander
                        </Typography>
                    </Box>

                    {/* Error Alert */}
                    {error && (
                        <Alert
                            severity="error"
                            onClose={() => setError('')}
                            sx={{ width: '100%' }}
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Login Form */}
                    <Box
                        component="form"
                        onSubmit={handleLogin}
                        noValidate
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                        <TextField
                            required
                            fullWidth
                            id="email"
                            label="Email"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            variant="outlined"
                        />
                        <TextField
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            variant="outlined"
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600 }}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;
