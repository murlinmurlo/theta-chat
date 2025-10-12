import React, { useState } from 'react';
import { 
    TextField, 
    Button, 
    Container, 
    Paper, 
    Typography, 
    Box,
    Chip,
    Alert,
    CircularProgress,
    IconButton
} from '@mui/material';
import { AttachFile, Close } from '@mui/icons-material';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppSelector, useAppDispatch } from './hooks/redux';
import { setUsername, logout, clearError, setError, setConnection, setUserId, setUploading } from './store/slices/chatSlice';
import { useWebSocket } from './hooks/useWebSocket';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from './components/FileUpload';
import { isImageFile, getFileIcon, formatFileSize } from './utils/fileUtils';

const ChatApp = () => {
    const [inputValue, setInputValue] = useState('');
    const [tempUsername, setTempUsername] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showFileUpload, setShowFileUpload] = useState(false);
    
    const { messages, isConnected, username, userId, isLoading, error, onlineUsers, isUploading } = useAppSelector(state => state.chat);
    const dispatch = useAppDispatch();
    
    const { sendMessage } = useWebSocket('ws://localhost:5000', username, userId);

    const handleFileUpload = async (file: File) => {
        setSelectedFile(file);
        dispatch(setUploading(true));
        
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки файла');
            }

            const fileInfo = await response.json();
            
            const success = sendMessage(username, '', userId, fileInfo);
            if (success) {
                setSelectedFile(null);
                setShowFileUpload(false);
            } else {
                dispatch(setError('Ошибка отправки файла'));
            }
        } catch (error) {
            dispatch(setError('Ошибка загрузки файла'));
        } finally {
            dispatch(setUploading(false));
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        dispatch(setUploading(false));
    };

    const handleSendMessage = () => {
        if ((inputValue.trim() || selectedFile) && username && userId) {
            if (selectedFile && !isUploading) {
                handleFileUpload(selectedFile);
            } else if (inputValue.trim()) {
                const success = sendMessage(username, inputValue, userId);
                if (success) {
                    setInputValue('');
                } else {
                    dispatch(setError('Ошибка отправки сообщения. Проверьте соединение.'));
                }
            }
        }
    };

    const handleLogin = () => {
        if (tempUsername.trim()) {
            const newUserId = uuidv4();
            dispatch(setUsername(tempUsername));
            dispatch(setUserId(newUserId));
            dispatch(clearError());
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        setTempUsername('');
        dispatch(setConnection(false));
        setSelectedFile(null);
        setShowFileUpload(false);
    };

    const handleClearError = () => {
        dispatch(clearError());
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const isUserOnline = (messageUser: string) => {
        return onlineUsers.includes(messageUser);
    };

    const renderFileMessage = (file: any) => {
        if (isImageFile(file.mimetype)) {
            return (
                <Box style={{ marginTop: '8px' }}>
                    <img 
                        src={file.url} 
                        alt={file.originalName}
                        style={{ 
                            maxWidth: '100%', 
                            maxHeight: '300px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                        onClick={() => window.open(file.url, '_blank')}
                    />
                    <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: '4px' }}>
                        {file.originalName} ({formatFileSize(file.size)})
                    </Typography>
                </Box>
            );
        }

        return (
            <Box 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    marginTop: '8px',
                    background: '#f5f5f5',
                    cursor: 'pointer'
                }}
                onClick={() => window.open(file.url, '_blank')}
            >
                <Typography variant="h6">{getFileIcon(file.mimetype)}</Typography>
                <Box style={{ flex: 1 }}>
                    <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                        {file.originalName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        {formatFileSize(file.size)}
                    </Typography>
                </Box>
            </Box>
        );
    };

    if (!username) {
        return (
            <Container maxWidth="sm" style={{ marginTop: '50px' }}>
                <Paper elevation={3} style={{ padding: '30px', textAlign: 'center' }}>
                    <Typography variant="h4" gutterBottom color="primary">
                        🗨️ Веб-чат
                    </Typography>
                    <Typography variant="body1" gutterBottom style={{ marginBottom: '20px' }}>
                        Введите ваше имя для начала общения
                    </Typography>
                    {error && (
                        <Alert severity="error" style={{ marginBottom: '20px' }} onClose={handleClearError}>
                            {error}
                        </Alert>
                    )}
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
                            label={`👥 ${onlineUsers.length} онлайн`} 
                            variant="outlined"
                            size="small"
                        />
                        <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={handleLogout}
                            color="secondary"
                        >
                            Выйти
                        </Button>
                    </Box>
                </Box>

                {isLoading && (
                    <Box style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" style={{ marginLeft: '10px' }}>
                            Загрузка...
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Alert 
                        severity="error" 
                        style={{ margin: '10px' }}
                        onClose={handleClearError}
                    >
                        {error}
                    </Alert>
                )}

                {!isConnected && !error && (
                    <Alert severity="info" style={{ margin: '10px' }}>
                        Установка соединения с сервером...
                    </Alert>
                )}

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
                                    background: msg.isCurrentUser ? '#e3f2fd' : 'white',
                                    borderRadius: '12px',
                                    border: '1px solid #e0e0e0',
                                    maxWidth: '80%',
                                    marginLeft: msg.isCurrentUser ? 'auto' : '0',
                                    marginRight: msg.isCurrentUser ? '0' : 'auto'
                                }}
                            >
                                <Box style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '4px'
                                }}>
                                    <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Typography 
                                            variant="subtitle2" 
                                            style={{ 
                                                fontWeight: 'bold',
                                                color: msg.isCurrentUser ? '#1976d2' : '#333'
                                            }}
                                        >
                                            {msg.user} {msg.isCurrentUser && '(Вы)'}
                                        </Typography>
                                        {isUserOnline(msg.user) && (
                                            <Box
                                                style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#4caf50'
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Typography 
                                        variant="caption" 
                                        color="textSecondary"
                                    >
                                        {formatTime(msg.timestamp)}
                                    </Typography>
                                </Box>
                                
                                {msg.text && (
                                    <Typography variant="body1">
                                        {msg.text}
                                    </Typography>
                                )}
                                
                                {msg.file && renderFileMessage(msg.file)}
                            </Box>
                        ))
                    )}
                </Box>

                <Box style={{ padding: '20px', borderTop: '1px solid #e0e0e0' }}>
                    {showFileUpload && (
                        <FileUpload 
                            onFileUpload={handleFileUpload}
                            onRemoveFile={handleRemoveFile}
                            isUploading={isUploading}
                        />
                    )}
                    
                    <Box style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <IconButton 
                            onClick={() => setShowFileUpload(!showFileUpload)}
                            color={showFileUpload ? "primary" : "default"}
                        >
                            <AttachFile />
                        </IconButton>
                        
                        <TextField
                            fullWidth
                            multiline
                            maxRows={3}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Введите сообщение или загрузите файл..."
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
                            disabled={(!inputValue.trim() && !selectedFile) || !isConnected || isUploading}
                            style={{ minWidth: '100px', height: '56px' }}
                        >
                            {isUploading ? <CircularProgress size={24} /> : 'Отправить'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

const App = () => {
    return (
        <Provider store={store}>
            <ChatApp />
        </Provider>
    );
};

export default App;