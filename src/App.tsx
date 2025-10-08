import React, { useState } from 'react';
import { 
    TextField, 
    Button, 
    Container, 
    Paper, 
    Typography, 
    Box,
    Chip,
    Alert
} from '@mui/material';
import { useWebSocket } from './hooks/useWebSocket';
import { Message } from './types/chat';

function App() {
    const [inputValue, setInputValue] = useState('');
    const [username, setUsername] = useState('');
    const [tempUsername, setTempUsername] = useState('');
    
    const { messages, sendMessage, isConnected } = useWebSocket('ws://localhost:5000');

    const handleSendMessage = () => {
        if (inputValue.trim() && username) {
            const success = sendMessage(username, inputValue);
            if (success) {
                setInputValue('');
            } else {
                alert('Ошибка отправки сообщения. Проверьте соединение.');
            }
        }
    };

    const handleLogin = () => {
        if (tempUsername.trim()) {
            setUsername(tempUsername);
        }
    };

    const formatTime = (timestamp: Date) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    if (!username) {
        return (
            <Container maxWidth="sm" style={{ marginTop: '50px' }}>
                <Paper elevation={3} style={{ padding: '30px', textAlign: 'center' }}>
                    <Typography variant="h4" gutterBottom color="primary">
                        🗨️ Веб-чат с WebSocket
                    </Typography>
                    <Typography variant="body1" gutterBottom style={{ marginBottom: '20px' }}>
                        Введите ваше имя для начала общения
                    </Typography>
                    <TextField
                        fullWidth
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        placeholder="Как вас зовут?"
                        style={{ marginBottom: '20px' }}
                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <Button 
                        variant="contained" 
                        onClick={handleLogin}
                        size="large"
                        disabled={!tempUsername.trim()}
                    >
                        Войти в чат
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" style={{ marginTop: '20px', height: '90vh' }}>
            <Paper elevation={3} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Шапка чата */}
                <Box style={{ 
                    padding: '20px', 
                    borderBottom: '1px solid #e0e0e0', 
                    background: '#f5f5f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box>
                        <Typography variant="h5" component="div">
                            🗨️ Веб-чат
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Вы вошли как: <strong>{username}</strong>
                        </Typography>
                    </Box>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Chip 
                            label={isConnected ? "✅ Онлайн" : "❌ Офлайн"} 
                            color={isConnected ? "success" : "error"}
                            size="small"
                        />
                        <Chip 
                            label={`👥 ${messages.length} сообщ.`} 
                            variant="outlined"
                            size="small"
                        />
                    </Box>
                </Box>

                {/* Статус соединения */}
                {!isConnected && (
                    <Alert severity="warning" style={{ margin: '10px' }}>
                        Нет соединения с сервером. Сообщения могут не отправляться.
                    </Alert>
                )}

                {/* Область сообщений */}
                <Box style={{ 
                    flex: 1, 
                    padding: '20px', 
                    overflowY: 'auto',
                    background: '#fafafa'
                }}>
                    {messages.length === 0 ? (
                        <Typography 
                            variant="body1" 
                            color="textSecondary" 
                            style={{ 
                                textAlign: 'center', 
                                marginTop: '50px',
                                fontStyle: 'italic'
                            }}
                        >
                            {isConnected ? 
                                "Пока нет сообщений. Будьте первым!" : 
                                "Загрузка сообщений..."
                            }
                        </Typography>
                    ) : (
                        messages.map((msg) => (
                            <Box 
                                key={msg.id}
                                style={{ 
                                    padding: '12px 16px',
                                    marginBottom: '8px',
                                    background: msg.user === username ? '#e3f2fd' : 'white',
                                    borderRadius: '12px',
                                    border: '1px solid #e0e0e0',
                                    maxWidth: '80%',
                                    marginLeft: msg.user === username ? 'auto' : '0',
                                    marginRight: msg.user === username ? '0' : 'auto'
                                }}
                            >
                                <Box style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '4px'
                                }}>
                                    <Typography 
                                        variant="subtitle2" 
                                        style={{ 
                                            fontWeight: 'bold',
                                            color: msg.user === username ? '#1976d2' : '#333'
                                        }}
                                    >
                                        {msg.user} {msg.user === username && '(Вы)'}
                                    </Typography>
                                    <Typography 
                                        variant="caption" 
                                        color="textSecondary"
                                    >
                                        {formatTime(msg.timestamp)}
                                    </Typography>
                                </Box>
                                <Typography variant="body1">
                                    {msg.text}
                                </Typography>
                            </Box>
                        ))
                    )}
                </Box>

                {/* Поле ввода */}
                <Box style={{ padding: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <Box style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <TextField
                            fullWidth
                            multiline
                            maxRows={3}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Введите сообщение..."
                            disabled={!isConnected}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            variant="outlined"
                        />
                        <Button 
                            variant="contained" 
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || !isConnected}
                            style={{ minWidth: '100px', height: '56px' }}
                        >
                            Отправить
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default App;
