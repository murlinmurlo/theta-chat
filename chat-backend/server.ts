import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const app = express();
const PORT = 5000;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

interface Message {
    id: number;
    user: string;
    text: string;
    timestamp: Date;
}

let messages: Message[] = [];
let nextId = 1;

const clients: Set<WebSocket> = new Set();

wss.on('connection', (ws: WebSocket) => {
    console.log('🔗 Новое WebSocket соединение');
    clients.add(ws);

    ws.send(JSON.stringify({
        type: 'INIT_MESSAGES',
        messages: messages
    }));

    ws.on('message', (data: Buffer) => {
        try {
            const parsedData = JSON.parse(data.toString());
            
            if (parsedData.type === 'NEW_MESSAGE') {
                const { user, text } = parsedData;
                
                const newMessage: Message = {
                    id: nextId++,
                    user: user.toString(),
                    text: text.toString(),
                    timestamp: new Date()
                };
                
                messages.push(newMessage);
                console.log('📨 Новое сообщение:', newMessage);

                const broadcastData = JSON.stringify({
                    type: 'NEW_MESSAGE',
                    message: newMessage
                });

                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(broadcastData);
                    }
                });
            }
        } catch (error) {
            console.error('❌ Ошибка обработки сообщения:', error);
        }
    });

    ws.on('close', () => {
        console.log('🔌 WebSocket соединение закрыто');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket ошибка:', error);
        clients.delete(ws);
    });
});

app.get('/messages', (req: express.Request, res: express.Response) => {
    res.json(messages);
});

app.post('/messages', (req: express.Request, res: express.Response) => {
    const { user, text } = req.body;
    
    if (!user || !text) {
        return res.status(400).json({ error: 'Имя пользователя и текст сообщения обязательны' });
    }

    const newMessage: Message = {
        id: nextId++,
        user: user.toString(),
        text: text.toString(),
        timestamp: new Date()
    };
    
    messages.push(newMessage);
    console.log('📨 Новое сообщение (REST):', newMessage);

    const broadcastData = JSON.stringify({
        type: 'NEW_MESSAGE',
        message: newMessage
    });

    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastData);
        }
    });

    res.json(newMessage);
});

app.get('/', (req: express.Request, res: express.Response) => {
    res.json({ 
        message: '🚀 Сервер чата с WebSocket работает!',
        connectedClients: clients.size,
        endpoints: {
            'GET /messages': 'Получить все сообщения',
            'POST /messages': 'Отправить сообщение',
            'WS /': 'WebSocket для реального времени'
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📡 HTTP: http://localhost:${PORT}`);
    console.log(`🔗 WebSocket: ws://localhost:${PORT}`);
    console.log(`⏰ ${new Date().toLocaleString()}`);
});
