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
    IconButton,
    Avatar,
    AppBar,
    Toolbar,
    Badge
} from '@mui/material';
import { 
    AttachFile, 
    Close, 
    Send, 
    Logout, 
    Image as ImageIcon,
    InsertDriveFile,
    People 
} from '@mui/icons-material';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppSelector, useAppDispatch } from './hooks/redux';
import { setUsername, logout, clearError, setError, setConnection, setUserId, setUploading, setUserAvatar, setAvatarUploading } from './store/slices/chatSlice';
import { useWebSocket } from './hooks/useWebSocket';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from './components/FileUpload';
import AvatarUpload from './components/AvatarUpload';
import { isImageFile, getFileIcon, formatFileSize } from './utils/fileUtils';

const ChatApp = () => {
    const [inputValue, setInputValue] = useState('');
    const [tempUsername, setTempUsername] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showFileUpload, setShowFileUpload] = useState(false);
    
    const { messages, isConnected, username, userId, userAvatar, isLoading, error, onlineUsers, isUploading, isAvatarUploading } = useAppSelector(state => state.chat);
    const dispatch = useAppDispatch();
    
    const { sendMessage, updateAvatar } = useWebSocket('ws://localhost:5000', username, userId, userAvatar);

    const stringToColor = (string: string) => {
        let hash = 0;
        for (let i = 0; i < string.length; i++) {
            hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xff;
            color += `00${value.toString(16)}`.slice(-2);
        }
        return color;
    };

    const stringAvatar = (name: string, size: number = 32) => {
        return {
            sx: {
                bgcolor: stringToColor(name),
                width: size,
                height: size,
                fontSize: size * 0.4,
                fontWeight: 600,
            },
            children: `${name.split(' ')[0][0]}${name.split(' ')[1] ? name.split(' ')[1][0] : ''}`,
        };
    };

    const handleAvatarUpload = async (file: File) => {
        dispatch(setAvatarUploading(true));
        
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch('http://localhost:5000/upload-avatar', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки аватара');
            }

            const avatarInfo = await response.json();
            
            dispatch(setUserAvatar(avatarInfo.url));
            updateAvatar(userId, avatarInfo.url);
            
        } catch (error) {
            dispatch(setError('Ошибка загрузки аватара'));
        } finally {
            dispatch(setAvatarUploading(false));
        }
    };

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
        return onlineUsers.some(user => user.username === messageUser);
    };

    const renderFileMessage = (file: any) => {
        if (isImageFile(file.mimetype)) {
            return (
                <Box sx={{ mt: 1 }}>
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
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                        {file.originalName} ({formatFileSize(file.size)})
                    </Typography>
                </Box>
            );
        }

        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mt: 1,
                    backgroundColor: 'background.default',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: 'action.hover',
                    }
                }}
                onClick={() => window.open(file.url, '_blank')}
            >
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    backgroundColor: 'primary.light',
                    color: 'white'
                }}>
                    {getFileIcon(file.mimetype)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
            <Box
                sx={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
                }}
            >
                <Paper 
                    elevation={8} 
                    sx={{ 
                        p: 4, 
                        maxWidth: 400,
                        width: '100%',
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" sx={{ 
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            mb: 1
                        }}>
                            Nexus Chat
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Присоединяйтесь к общению
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={handleClearError}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        placeholder="Введите ваше имя"
                        sx={{ mb: 3 }}
                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <Button 
                        variant="contained" 
                        onClick={handleLogin}
                        size="large"
                        disabled={!tempUsername.trim()}
                        sx={{
                            py: 1.5,
                            px: 4,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            },
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Начать общение
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
            <AppBar 
                position="static" 
                elevation={0}
                sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                }}
            >
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Nexus Chat
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <People sx={{ fontSize: 20 }} />
                            <Typography variant="body2">
                                {onlineUsers.length} онлайн
                            </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AvatarUpload 
                                currentAvatar={userAvatar}
                                onAvatarUpload={handleAvatarUpload}
                                isUploading={isAvatarUploading}
                                username={username}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {username}
                            </Typography>
                        </Box>
                        
                        <IconButton 
                            color="inherit" 
                            onClick={handleLogout}
                            sx={{ 
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)'
                                }
                            }}
                        >
                            <Logout />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', py: 2 }}>
                <Paper 
                    elevation={2} 
                    sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column',
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ 
                        flex: 1, 
                        p: 2, 
                        overflowY: 'auto',
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                    }}>
                        {messages.length === 0 ? (
                            <Box sx={{ 
                                textAlign: 'center', 
                                mt: 8,
                                color: 'text.secondary'
                            }}>
                                <Typography variant="h6" sx={{ mb: 1, opacity: 0.7 }}>
                                    {isConnected ? "Начните общение!" : "Подключение..."}
                                </Typography>
                                <Typography variant="body2">
                                    {isConnected ? "Отправьте первое сообщение" : "Устанавливаем соединение"}
                                </Typography>
                            </Box>
                        ) : (
                            messages.map((msg) => (
                                <Box 
                                    key={msg.id}
                                    sx={{ 
                                        display: 'flex',
                                        justifyContent: msg.isCurrentUser ? 'flex-end' : 'flex-start',
                                        mb: 2,
                                        animation: 'fadeIn 0.3s ease'
                                    }}
                                >
                                    <Box sx={{ 
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1,
                                        maxWidth: '70%',
                                        flexDirection: msg.isCurrentUser ? 'row-reverse' : 'row'
                                    }}>
                                        {!msg.isCurrentUser && (
                                            <Avatar 
                                                src={msg.userAvatar} 
                                                {...stringAvatar(msg.user)}
                                            />
                                        )}
                                        
                                        <Box>
                                            {!msg.isCurrentUser && (
                                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>
                                                    {msg.user}
                                                    {isUserOnline(msg.user) && (
                                                        <Box 
                                                            component="span"
                                                            sx={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: '50%',
                                                                backgroundColor: 'success.main',
                                                                ml: 0.5,
                                                                display: 'inline-block'
                                                            }}
                                                        />
                                                    )}
                                                </Typography>
                                            )}
                                            
                                            <Paper
                                                elevation={1}
                                                sx={{
                                                    p: 2,
                                                    background: msg.isCurrentUser 
                                                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                        : 'white',
                                                    color: msg.isCurrentUser ? 'white' : 'text.primary',
                                                    borderRadius: 2,
                                                    borderTopRightRadius: msg.isCurrentUser ? 4 : 12,
                                                    borderTopLeftRadius: msg.isCurrentUser ? 12 : 4,
                                                    position: 'relative',
                                                    '&::before': msg.isCurrentUser ? {
                                                        content: '""',
                                                        position: 'absolute',
                                                        right: -8,
                                                        top: 0,
                                                        width: 0,
                                                        height: 0,
                                                        borderLeft: '8px solid #764ba2',
                                                        borderTop: '8px solid transparent',
                                                        borderBottom: '8px solid transparent'
                                                    } : {
                                                        content: '""',
                                                        position: 'absolute',
                                                        left: -8,
                                                        top: 0,
                                                        width: 0,
                                                        height: 0,
                                                        borderRight: '8px solid white',
                                                        borderTop: '8px solid transparent',
                                                        borderBottom: '8px solid transparent'
                                                    }
                                                }}
                                            >
                                                {msg.text && (
                                                    <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
                                                        {msg.text}
                                                    </Typography>
                                                )}
                                                
                                                {msg.file && renderFileMessage(msg.file)}
                                                
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                        display: 'block', 
                                                        mt: 1,
                                                        opacity: 0.7
                                                    }}
                                                >
                                                    {formatTime(msg.timestamp)}
                                                </Typography>
                                            </Paper>
                                        </Box>

                                        {msg.isCurrentUser && (
                                            <Avatar 
                                                src={userAvatar} 
                                                {...stringAvatar(username)}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Box>

                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', background: 'white' }}>
                        {showFileUpload && (
                            <FileUpload 
                                onFileUpload={handleFileUpload}
                                onRemoveFile={handleRemoveFile}
                                isUploading={isUploading}
                            />
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                            <IconButton 
                                onClick={() => setShowFileUpload(!showFileUpload)}
                                color={showFileUpload ? "primary" : "default"}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                        transform: 'scale(1.1)'
                                    },
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <AttachFile />
                            </IconButton>
                            
                            <TextField
                                fullWidth
                                multiline
                                maxRows={4}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Напишите сообщение..."
                                disabled={!isConnected}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                variant="outlined"
                                size="small"
                            />
                            <Button 
                                variant="contained" 
                                onClick={handleSendMessage}
                                disabled={(!inputValue.trim() && !selectedFile) || !isConnected || isUploading}
                                sx={{ 
                                    minWidth: 'auto',
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                    },
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                }}
                            >
                                {isUploading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <Send />}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>

            {error && (
                <Alert 
                    severity="error" 
                    sx={{ 
                        m: 2,
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onClose={handleClearError}
                >
                    {error}
                </Alert>
            )}

            {!isConnected && !error && (
                <Alert 
                    severity="info" 
                    sx={{ 
                        m: 2,
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    Устанавливаем соединение с сервером...
                </Alert>
            )}
        </Box>
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