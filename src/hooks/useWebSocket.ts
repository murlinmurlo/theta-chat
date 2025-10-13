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

/**
 * Хук для управления WebSocket соединением в чате
 * Обрабатывает отправку/получение сообщений, онлайн-статусы и обновления аватаров
 */
export const useWebSocket = (url: string, username: string, userId: string, userAvatar: string) => {
    const dispatch = useAppDispatch();
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Закрытие соединение если пользователь не авторизован
        if (!username) {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
            return;
        }

        ws.current = new WebSocket(url);

        // Обработчик успешного подключения
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

        // Обработчик входящих сообщений
        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // Обработчик различных типов сообщений от сервера
                switch (data.type) {
                    case 'INIT_MESSAGES':
                        dispatch(setMessages(data.messages));
                        dispatch(setOnlineUsers(data.onlineUsers || []));
                        if (data.userId) {
                            dispatch(setUserId(data.userId));
                        }
                        break;
                    case 'NEW_MESSAGE':
                        dispatch(addMessage(data.message));
                        dispatch(setOnlineUsers(data.onlineUsers || []));
                        break;
                    case 'USER_ONLINE':
                        dispatch(updateOnlineUsers({user: data.user, type: 'online'}));
                        dispatch(setOnlineUsers(data.onlineUsers || []));
                        break;
                    case 'USER_OFFLINE':
                        dispatch(updateOnlineUsers({user: data.user, type: 'offline'}));
                        dispatch(setOnlineUsers(data.onlineUsers || []));
                        break;
                    case 'AVATAR_UPDATED':
                        dispatch(updateUserAvatar({userId: data.user.userId, avatar: data.user.avatar}));
                        dispatch(setOnlineUsers(data.onlineUsers || []));
                        break;
                    case 'ERROR':
                        dispatch(setError(data.message));
                        break;
                }
            } catch (error) {
                dispatch(setError('Ошибка обработки сообщения'));
            }
        };

        // Закрытие соединения
        ws.current.onclose = () => {
            dispatch(setConnection(false));
        };

        // Ошибка соединения
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

    /**
     * Отправка сообщения
     */
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

    /**
     * Обновляет аватар
     */
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