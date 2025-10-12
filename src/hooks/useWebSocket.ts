import { useEffect, useRef } from 'react';
import { useAppDispatch } from './redux';
import { 
    setMessages, 
    addMessage, 
    setConnection, 
    setError, 
    setOnlineUsers, 
    updateOnlineUsers, 
    setUserId,
    updateUserAvatar 
} from '../store/slices/chatSlice';

export const useWebSocket = (url: string, username: string, userId: string, userAvatar: string) => {
    const dispatch = useAppDispatch();
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!username) {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
            return;
        }

        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            dispatch(setConnection(true));
            dispatch(setError(null));
            
            ws.current?.send(JSON.stringify({
                type: 'LOGIN',
                username: username,
                userId: userId,
                avatar: userAvatar
            }));
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'INIT_MESSAGES') {
                    dispatch(setMessages(data.messages));
                    dispatch(setOnlineUsers(data.onlineUsers || []));
                    if (data.userId) {
                        dispatch(setUserId(data.userId));
                    }
                } else if (data.type === 'NEW_MESSAGE') {
                    dispatch(addMessage(data.message));
                    dispatch(setOnlineUsers(data.onlineUsers || []));
                } else if (data.type === 'USER_ONLINE') {
                    dispatch(updateOnlineUsers({user: data.user, type: 'online'}));
                    dispatch(setOnlineUsers(data.onlineUsers || []));
                } else if (data.type === 'USER_OFFLINE') {
                    dispatch(updateOnlineUsers({user: data.user, type: 'offline'}));
                    dispatch(setOnlineUsers(data.onlineUsers || []));
                } else if (data.type === 'AVATAR_UPDATED') {
                    dispatch(updateUserAvatar({userId: data.user.userId, avatar: data.user.avatar}));
                    dispatch(setOnlineUsers(data.onlineUsers || []));
                } else if (data.type === 'ERROR') {
                    dispatch(setError(data.message));
                }
            } catch (error) {
                dispatch(setError('Ошибка обработки сообщения'));
            }
        };

        ws.current.onclose = () => {
            dispatch(setConnection(false));
        };

        ws.current.onerror = (error) => {
            dispatch(setConnection(false));
            dispatch(setError('Ошибка соединения с сервером'));
        };

        return () => {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
        };
    }, [url, dispatch, username, userId, userAvatar]);

    const sendMessage = (user: string, text: string, userId: string, file?: any) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'NEW_MESSAGE',
                user,
                text,
                userId,
                file
            }));
            return true;
        }
        return false;
    };

    const updateAvatar = (userId: string, avatar: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'UPDATE_AVATAR',
                userId,
                avatar
            }));
            return true;
        }
        return false;
    };

    return { sendMessage, updateAvatar };
};