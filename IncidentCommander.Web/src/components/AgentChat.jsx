import { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, IconButton, TextField, Typography, Fab, Fade, CircularProgress, Chip
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAuth } from '../context/AuthContext';

const AgentChat = () => {
    const { user, refreshToken } = useAuth();
    const isAdmin = user?.roles?.includes('Admin');

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [connection, setConnection] = useState(null);
    const [threadId, setThreadId] = useState(null);
    const [currentMessage, setCurrentMessage] = useState('');

    const messagesEndRef = useRef(null);

    // ✅ hooks at component level
    const streamBufferRef = useRef('');         // canonical streaming buffer
    const lastCommittedRef = useRef('');        // optional dedupe
    const connectionRef = useRef(null);         // avoid state timing issues

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentMessage]);

    useEffect(() => {
        if (!isAdmin || !isOpen) return;

        // ✅ avoid state race; ref is immediate
        if (connectionRef.current) {
            console.log('⚠️ Connection already exists, skipping');
            return;
        }

        let isMounted = true;

        const newConnection = new HubConnectionBuilder()
            .withUrl(`${import.meta.env.VITE_API_BASE_URL || ''}/hubs/chat`, {
                withCredentials: true,
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        const handleReceiveToken = (token) => {
            if (!isMounted) return;
            streamBufferRef.current += token;
            setCurrentMessage(streamBufferRef.current);
        };

        const handleMessageComplete = () => {
            if (!isMounted) return;

            const finalText = streamBufferRef.current;

            // ✅ commit once
            if (finalText && finalText !== lastCommittedRef.current) {
                lastCommittedRef.current = finalText;
                setMessages((prev) => [...prev, { role: 'assistant', content: finalText }]);
            }

            // clear buffer + UI
            streamBufferRef.current = '';
            setCurrentMessage('');
            setIsLoading(false);
        };

        const handleAgentStatus = (status) => {
            console.log('Agent status:', status);
        };

        const handleReceiveError = (error) => {
            if (!isMounted) return;
            setMessages((prev) => [...prev, { role: 'error', content: error }]);
            streamBufferRef.current = '';
            setCurrentMessage('');
            setIsLoading(false);
        };

        newConnection.on('ReceiveToken', handleReceiveToken);
        newConnection.on('MessageComplete', handleMessageComplete);
        newConnection.on('AgentStatus', handleAgentStatus);
        newConnection.on('ReceiveError', handleReceiveError);

        const startConnection = async (conn, retry = true) => {
            try {
                await conn.start();
                console.log('✅ Connected to ChatHub');
                const id = await conn.invoke('CreateThread');
                if (isMounted) {
                    setThreadId(id);
                    console.log('✅ Thread created:', id);
                }
            } catch (err) {
                console.error('❌ SignalR Connection Error:', err);
                // If 401, try to refresh and retry once
                if (retry && err.message?.includes('401')) {
                    console.log('🔄 Attempting token refresh for SignalR...');
                    const success = await refreshToken();
                    if (success) {
                        return startConnection(conn, false);
                    }
                }

                if (isMounted) {
                    setMessages((prev) => [
                        ...prev,
                        { role: 'error', content: `Connection failed: ${err.message || 'Unable to connect.'}` },
                    ]);
                }
            }
        };

        startConnection(newConnection);

        // ✅ set both
        connectionRef.current = newConnection;
        setConnection(newConnection);

        return () => {
            console.log('🔌 Disconnecting SignalR...');
            isMounted = false;

            newConnection.off('ReceiveToken', handleReceiveToken);
            newConnection.off('MessageComplete', handleMessageComplete);
            newConnection.off('AgentStatus', handleAgentStatus);
            newConnection.off('ReceiveError', handleReceiveError);

            connectionRef.current = null;
            newConnection.stop();
        };
    }, [isAdmin, isOpen]);

    const handleSend = async () => {
        const conn = connectionRef.current; // ✅ stable
        const text = input.trim();

        if (!text || !conn || !threadId || isLoading) return;

        setMessages((prev) => [...prev, { role: 'user', content: text }]);
        setInput('');
        setIsLoading(true);

        // reset stream state for this response
        streamBufferRef.current = '';
        setCurrentMessage('');

        try {
            await conn.invoke('SendMessage', threadId, text);
        } catch (err) {
            console.error('❌ Error sending message:', err);
            setMessages((prev) => [...prev, { role: 'error', content: 'Failed to send message' }]);
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isAdmin) return null;

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <Fade in={!isOpen}>
                    <Fab
                        color="primary"
                        aria-label="open agent chat"
                        onClick={() => setIsOpen(true)}
                        sx={{
                            position: 'fixed',
                            bottom: 24,
                            right: 24,
                            zIndex: 1200,
                            boxShadow: '0 8px 16px rgba(51, 153, 255, 0.3)'
                        }}
                    >
                        <SmartToyIcon />
                    </Fab>
                </Fade>
            )}

            {/* Chat Window */}
            <Fade in={isOpen}>
                <Paper
                    elevation={8}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        width: { xs: 'calc(100vw - 48px)', sm: 400 },
                        height: { xs: 'calc(100vh - 48px)', sm: 600 },
                        zIndex: 1200,
                        display: isOpen ? 'flex' : 'none',
                        flexDirection: 'column',
                        borderRadius: 3,
                        overflow: 'hidden',
                        bgcolor: 'background.paper'
                    }}
                >
                    {/* Header */}
                    <Box sx={{
                        p: 2,
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SmartToyIcon />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Incident Commander AI
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Messages */}
                    <Box sx={{
                        flex: 1,
                        overflowY: 'auto',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        bgcolor: 'rgba(0, 0, 0, 0.02)'
                    }}>
                        {messages.length === 0 && (
                            <Box sx={{ textAlign: 'center', mt: 4 }}>
                                <SmartToyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Ask me about system status, incidents, or request diagnostics!
                                </Typography>
                            </Box>
                        )}

                        {messages.map((msg, i) => (
                            <Box
                                key={i}
                                sx={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                                }}
                            >
                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: 1.5,
                                        maxWidth: '80%',
                                        bgcolor: msg.role === 'user'
                                            ? 'primary.main'
                                            : msg.role === 'error'
                                                ? 'error.light'
                                                : 'background.paper',
                                        color: msg.role === 'user' || msg.role === 'error' ? 'white' : 'text.primary',
                                        borderRadius: 2,
                                        wordBreak: 'break-word',
                                        whiteSpace: 'pre-wrap'
                                    }}
                                >
                                    <Typography variant="body2">{msg.content}</Typography>
                                </Paper>
                            </Box>
                        ))}

                        {/* Current streaming message */}
                        {currentMessage && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: 1.5,
                                        maxWidth: '80%',
                                        bgcolor: 'background.paper',
                                        borderRadius: 2,
                                        wordBreak: 'break-word',
                                        whiteSpace: 'pre-wrap'
                                    }}
                                >
                                    <Typography variant="body2">{currentMessage}</Typography>
                                </Paper>
                            </Box>
                        )}

                        {/* Loading indicator */}
                        {isLoading && !currentMessage && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={20} />
                                <Typography variant="caption" color="text.secondary">
                                    Agent is thinking...
                                </Typography>
                            </Box>
                        )}

                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input */}
                    <Box sx={{
                        p: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        gap: 1
                    }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Ask the agent..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading || !connection || !threadId}
                            multiline
                            maxRows={4}
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading || !connection || !threadId}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Paper>
            </Fade>
        </>
    );
};

export default AgentChat;
