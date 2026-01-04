import { Box, Container, Typography, Button, Paper, Stack } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AccessDenied = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    mt: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        width: '100%',
                        textAlign: 'center',
                        bgcolor: 'rgba(255, 23, 68, 0.1)',
                        border: '2px solid rgba(255, 23, 68, 0.3)',
                        borderRadius: 2,
                    }}
                >
                    <LockIcon
                        sx={{
                            fontSize: 80,
                            color: 'error.main',
                            mb: 2,
                            opacity: 0.9,
                        }}
                    />
                    <Typography
                        variant="h3"
                        component="h1"
                        gutterBottom
                        sx={{ fontWeight: 700, color: 'error.main' }}
                    >
                        ACCESS DENIED
                    </Typography>
                    <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                    >
                        Administrator Privileges Required
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        You do not have permission to access the Incident Commander Dashboard.
                        This area is restricted to users with administrator roles only.
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleLogout}
                            size="large"
                        >
                            Sign Out
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        </Container>
    );
};

export default AccessDenied;
