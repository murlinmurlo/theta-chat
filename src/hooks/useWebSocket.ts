import { useEffect, useRef } from 'react';
import { useAppDispatch } from './redux';
import { setMessages, addMessage, setConnection, setError } from '../store/slices/chatSlice';

export const useWebSocket = (url: string) => {
    const dispatch = useAppDispatch();
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            console.log('✅ WebSocket соединение установлено');
            dispatch(setConnection(true));
            dispatch(setError(null));
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'INIT_MESSAGES') {
                    dispatch(setMessages(data.messages));
                } else if (data.type === 'NEW_MESSAGE') {
                    dispatch(addMessage(data.message));
                } else if (data.type === 'ERROR') {
                    dispatch(setError(data.message));
                }
            } catch (error) {
                console.error('❌ Ошибка обработки WebSocket сообщения:', error);
                dispatch(setError('Ошибка обработки сообщения'));
            }
        };

        ws.current.onclose = () => {
            console.log('🔌 WebSocket соединение закрыто');
            dispatch(setConnection(false));
        };

        ws.current.onerror = (error) => {
            console.error('❌ WebSocket ошибка:', error);
            dispatch(setConnection(false));
            dispatch(setError('Ошибка соединения с сервером'));
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
            dispatch(setConnection(false));
        };
    }, [url, dispatch]);

    const sendMessage = (user: string, text: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'NEW_MESSAGE',
                user,
                text
            }));
            return true;
        }
        return false;
    };

    return { sendMessage };
};