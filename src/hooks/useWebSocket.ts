import { useEffect, useRef } from 'react';
import { useAppDispatch } from './redux';
import { setMessages, addMessage, setConnection, setError } from '../store/slices/chatSlice';

export const useWebSocket = (url: string, isActive: boolean = true) => {
    const dispatch = useAppDispatch();
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!isActive) {
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
    }, [url, dispatch, isActive]);

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