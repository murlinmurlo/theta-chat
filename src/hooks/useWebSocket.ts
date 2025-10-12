import { useEffect, useRef } from 'react';
import { useAppDispatch } from './redux';
import { setMessages, addMessage, setConnection, setError, setOnlineUsers, updateOnlineUsers, setUserId } from '../store/slices/chatSlice';

export const useWebSocket = (url: string, username: string, userId: string) => {
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
                userId: userId
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
                    dispatch(updateOnlineUsers({username: data.username, type: 'online'}));
                    dispatch(setOnlineUsers(data.onlineUsers || []));
                } else if (data.type === 'USER_OFFLINE') {
                    dispatch(updateOnlineUsers({username: data.username, type: 'offline'}));
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
    }, [url, dispatch, username, userId]);

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

    return { sendMessage };
};