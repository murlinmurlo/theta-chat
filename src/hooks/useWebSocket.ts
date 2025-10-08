import { useState, useEffect, useRef } from 'react';
import { Message } from '../types/chat';

export const useWebSocket = (url: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            console.log('✅ WebSocket соединение установлено');
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'INIT_MESSAGES') {
                    setMessages(data.messages);
                } else if (data.type === 'NEW_MESSAGE') {
                    setMessages(prev => [...prev, data.message]);
                }
            } catch (error) {
                console.error('❌ Ошибка обработки WebSocket сообщения:', error);
            }
        };

        ws.current.onclose = () => {
            console.log('🔌 WebSocket соединение закрыто');
            setIsConnected(false);
        };

        ws.current.onerror = (error) => {
            console.error('❌ WebSocket ошибка:', error);
            setIsConnected(false);
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [url]);

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

    return { messages, sendMessage, isConnected };
};
