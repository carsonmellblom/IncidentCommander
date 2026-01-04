import { Box, Container, Typography, Paper, Grid, Stack, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DescriptionIcon from '@mui/icons-material/Description';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.roles?.includes('Admin');

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at 50% 0%, rgba(51, 153, 255, 0.1) 0%, transparent 50%)',
            pt: 4, pb: 2
        }}>
            <Container maxWidth="xl">
                {/* Hero Section - Layman Optimized */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h2" component="h1" sx={{
                        fontWeight: 800,
                        mb: 1,
                        letterSpacing: '-2px',
                        background: 'linear-gradient(45deg, #fff 30%, #3399ff 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: { xs: '2.5rem', md: '3.75rem' }
                    }}>
                        INCIDENT COMMANDER
                    </Typography>

                    <Typography variant="h5" sx={{
                        mb: 2,
                        fontWeight: 400,
                        color: 'text.secondary',
                        maxWidth: '900px',
                        mx: 'auto',
                        lineHeight: 1.4,
                        fontSize: { xs: '1.1rem', md: '1.4rem' }
                    }}>
                        A smart command center that allows AI agents to automatically find,
                        explain, and fix computer system problems in real-time.
                    </Typography>

                    <Stack direction="row" spacing={2} justifyContent="center">
                        {user && isAdmin && (
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<DashboardIcon />}
                                onClick={() => navigate('/dashboard')}
                                sx={{
                                    px: 5, py: 1.5, borderRadius: '12px', fontWeight: 700,
                                    boxShadow: '0 8px 16px rgba(51, 153, 255, 0.3)',
                                    '&:hover': { boxShadow: '0 12px 20px rgba(51, 153, 255, 0.4)' }
                                }}
                            >
                                Launch Dashboard
                            </Button>
                        )}
                        {!user && (
                            <Button
                                variant="contained" size="large"
                                onClick={() => navigate('/login')}
                                sx={{ px: 5, py: 1.5, borderRadius: '12px', fontWeight: 700 }}
                            >
                                Sign In
                            </Button>
                        )}
                        <Button
                            variant="outlined" size="large"
                            startIcon={<CodeIcon />}
                            href="https://github.com/carsonmellblom/IncidentCommander"
                            target="_blank"
                            sx={{ px: 5, py: 1.5, borderRadius: '12px', fontWeight: 700, borderColor: 'rgba(255,255,255,0.2)' }}
                        >
                            Source Code
                        </Button>
                    </Stack>
                </Box>

                {/* Main 3-Column Feature Grid - Fits on one screen */}
                <Grid container spacing={3}>
                    {/* 1. Engineering Reference */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{
                            p: 3, height: '100%',
                            bgcolor: 'rgba(51, 153, 255, 0.03)',
                            border: '1px solid rgba(51, 153, 255, 0.1)',
                            borderRadius: 4,
                            backdropFilter: 'blur(10px)'
                        }}>
                            <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.5 }}>
                                System Architecture
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, mt: 1 }}>
                                Engineering Reference
                            </Typography>
                            <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 1, fontSize: '0.825rem', color: 'text.secondary' } }}>
                                <li><strong>Real-time Telemetry:</strong> High-frequency log streaming via SignalR & EF Core.</li>
                                <li><strong>Autonomous Gateway:</strong> Python FastMCP bridge for secure LLM tool-calling.</li>
                                <li><strong>Self-Healing:</strong> Automated remediation scripts triggered by agent diagnostics.</li>
                                <li><strong>Fault Injection:</strong> Native chaos engineering engine for resilience testing.</li>
                                <li><strong>Security First:</strong> BFF pattern with httpOnly session management.</li>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* 2. Key Features */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{
                            p: 3, height: '100%',
                            bgcolor: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: 4
                        }}>
                            <Typography variant="overline" color="secondary" sx={{ fontWeight: 800, letterSpacing: 1.5 }}>
                                Key Capabilities
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 2 }}>
                                {[
                                    { title: 'Live Diagnostics', icon: <SpeedIcon fontSize="small" />, desc: 'Instant visibility into system health and logs.' },
                                    { title: 'AI Orchestration', icon: <SmartToyIcon fontSize="small" />, desc: 'Plug-and-play MCP integration for AI brains.' },
                                    { title: 'Safe Remediation', icon: <SecurityIcon fontSize="small" />, desc: 'Controlled service restarts and state fixes.' }
                                ].map((f, i) => (
                                    <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                                        <Box sx={{ color: 'secondary.main', mt: 0.5 }}>{f.icon}</Box>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{f.title}</Typography>
                                            <Typography variant="caption" color="text.secondary">{f.desc}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* 3. Tech Stack */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{
                            p: 3, height: '100%',
                            bgcolor: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: 4
                        }}>
                            <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.5, color: 'text.secondary' }}>
                                Core Stack
                            </Typography>
                            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {['.NET 10', 'React 18', 'PostgreSQL', 'FastMCP', 'SignalR', 'JWT', 'Docker'].map(tag => (
                                    <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderRadius: '6px', fontSize: '0.7rem' }} />
                                ))}
                            </Box>
                            <Typography variant="body2" sx={{ mt: 3, fontWeight: 700, fontSize: '0.8rem' }}>
                                Built for high scalability and low latency.
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Leverages multi-stage Docker builds and automated CI/CD readiness.
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{
                            p: 2,
                            background: 'linear-gradient(90deg, rgba(76, 175, 80, 0.05) 0%, transparent 100%)',
                            border: '1px solid rgba(76, 175, 80, 0.1)',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 2
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <WorkHistoryIcon color="success" />
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>Impact</Typography>
                                </Box>
                            </Box>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ flexGrow: 1, justifyContent: 'space-around' }}>
                                <Box sx={{ maxWidth: '350px' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', display: 'block' }}>Innovation</Typography>
                                    <Typography variant="caption" color="text.secondary">Engineered autonomous remediation via MCP, drastically reducing system resolution time.</Typography>
                                </Box>
                                <Box sx={{ maxWidth: '350px' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', display: 'block' }}>Engineering</Typography>
                                    <Typography variant="caption" color="text.secondary">Architected an event-driven .NET/React/Python stack with SignalR and secure BFF auth.</Typography>
                                </Box>
                                <Box sx={{ maxWidth: '350px' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', display: 'block' }}>Scale & Security</Typography>
                                    <Typography variant="caption" color="text.secondary">Hardened BFF security patterns with a 100% containerized workflow for seamless cloud parity.</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>

                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                        A work in progress demonstration for secure AI-infrastructure integration.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Home;
