import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    Card,
    CardContent,
    Chip,
    Container,
    Stack,
    Divider,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import TerminalRoundedIcon from '@mui/icons-material/TerminalRounded';
import PowerSettingsNewRoundedIcon from '@mui/icons-material/PowerSettingsNewRounded';
import { API_URL, HUB_URL } from '../config/api';
import AgentChat from '../components/AgentChat';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const [logs, setLogs] = useState([]);
    const [connection, setConnection] = useState(null);
    const [chaosActive, setChaosActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState(false);
    const logsEndRef = useRef(null);
    const { fetchWithAuth } = useAuth();

    useEffect(() => {
        // Check initial status
        fetchWithAuth(`${API_URL}/chaos/status`)
            .then(res => {
                if (res.status === 401 || res.status === 403) {
                    setAuthError(true);
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (data) {
                    setChaosActive(data.isActive);
                }
            })
            .catch(err => console.error(err));

        const newConnection = new HubConnectionBuilder()
            .withUrl(HUB_URL + '/incident') // Centralized URL for prod support 
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, []);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('Connected to SignalR Hub');
                    connection.on('SystemStatus', (status) => { console.log('Received SystemStatus update:', status); setChaosActive(!!status.isActive); });
                    connection.on('ReceiveMessage', (user, message) => {
                        setLogs(prevLogs => [...prevLogs, { timestamp: new Date(), message, type: user === 'System' ? 'info' : 'error' }]);
                    });
                })
                .catch(e => console.log('Connection failed: ', e));
        }
    }, [connection]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const toggleChaos = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(`${API_URL}/chaos/toggle`, {
                method: 'POST'
            });
            if (res.status === 401 || res.status === 403) {
                setAuthError(true);
                return;
            }
            const data = await res.json();
            setChaosActive(data.isActive);
        } catch (error) {
            console.error("Failed to toggle chaos", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={4}>
                {/* Status Panel */}
                <Grid item xs={12} md={4}>
                    <Card
                        sx={{
                            height: '100%',
                            position: 'relative',
                            overflow: 'visible',
                            transition: 'all 0.3s ease-in-out',
                            borderColor: chaosActive ? '#ef5350' : 'rgba(255, 255, 255, 0.1)'
                        }}
                        className={chaosActive ? 'pulse-critical' : ''}
                    >
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                    SYSTEM STATUS
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 4 }}>
                                    {chaosActive ? (
                                        <WarningAmberRoundedIcon sx={{ fontSize: 60, color: '#ff1744', mr: 2 }} />
                                    ) : (
                                        <CheckCircleOutlineRoundedIcon sx={{ fontSize: 60, color: '#00e676', mr: 2 }} />
                                    )}
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: chaosActive ? '#ff1744' : '#00e676' }} className="glow-text">
                                        {chaosActive ? "CRITICAL" : "HEALTHY"}
                                    </Typography>
                                </Box>
                                <Typography variant="body1" color="text.secondary">
                                    {chaosActive
                                        ? "Active incident detected. Database latency spikes observed. Immediate action required."
                                        : "All systems operational. Nominal performance metrics."}
                                </Typography>
                            </Box>

                            <Box sx={{ mt: 4 }}>
                                <Button
                                    variant={chaosActive ? "outlined" : "contained"}
                                    color={chaosActive ? "success" : "error"}
                                    size="large"
                                    fullWidth
                                    startIcon={loading ? <CircularProgress size={20} /> : (chaosActive ? <LocalFireDepartmentRoundedIcon /> : <PowerSettingsNewRoundedIcon />)}
                                    onClick={toggleChaos}
                                    disabled={loading}
                                    sx={{ py: 2, fontSize: '1.1rem' }}
                                >
                                    {chaosActive ? "RESOLVE INCIDENT" : "START CHAOS MUAHAHAHA 😈"}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Live Logs */}
                <Grid item xs={12} md={8}>
                    <Paper
                        sx={{
                            height: 500,
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'rgba(0, 0, 0, 0.6)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 2
                        }}
                    >
                        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' }}>
                            <TerminalRoundedIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', letterSpacing: 2 }}>
                                LIVE_EVENT_STREAM
                            </Typography>
                            <Box sx={{ flexGrow: 1 }} />
                            <Chip label="ONLINE" color="success" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
                        </Box>

                        <List sx={{ flexGrow: 1, overflow: 'auto', p: 2, fontFamily: 'monospace' }} dense>
                            {logs.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 10, fontStyle: 'italic' }}>
                                    Device Connected. Waiting for telemetry...
                                </Typography>
                            )}
                            {logs.map((log, index) => (
                                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                                    <Typography
                                        variant="caption"
                                        component="span"
                                        sx={{
                                            color: 'text.secondary',
                                            mr: 2,
                                            minWidth: 80,
                                            display: 'inline-block'
                                        }}
                                        className="terminal-font"
                                    >
                                        {log.timestamp.toLocaleTimeString()}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        component="span"
                                        sx={{
                                            color: log.type === 'error' ? '#ff5252' : '#69f0ae',
                                            textShadow: log.type === 'error' ? '0 0 5px rgba(255, 82, 82, 0.5)' : 'none'
                                        }}
                                        className="terminal-font"
                                    >
                                        {log.type === 'error' ? '>> [ERR] ' : '>> [INF] '}
                                        {log.message}
                                    </Typography>
                                </ListItem>
                            ))}
                            <div ref={logsEndRef} />
                        </List>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={authError}
                autoHideDuration={6000}
                onClose={() => setAuthError(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setAuthError(false)} severity="error" variant="filled" sx={{ width: '100%' }}>
                    Unauthorized: Admin privileges required for chaos operations.
                </Alert>
            </Snackbar>

            {/* AI Agent Chat - Admin Only */}
            <AgentChat />
        </Container >
    );
};

export default Dashboard;


