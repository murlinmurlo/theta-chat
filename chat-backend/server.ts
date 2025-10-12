import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 5000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Недопустимый тип файла'));
        }
    }
});

interface Message {
    id: number;
    userId: string;
    user: string;
    text: string;
    timestamp: Date;
    file?: {
        filename: string;
        originalName: string;
        mimetype: string;
        size: number;
        url: string;
    };
}

let messages: Message[] = [];
let nextId = 1;
const clients: Map<WebSocket, {userId: string, username: string}> = new Map();
const onlineUsers: Map<string, string> = new Map();

wss.on('connection', (ws: WebSocket) => {
    console.log('🔗 Новое WebSocket соединение');

    ws.on('message', (data: Buffer) => {
        try {
            const parsedData = JSON.parse(data.toString());
            
            if (parsedData.type === 'LOGIN') {
                const { username, userId } = parsedData;
                const userUUID = userId || uuidv4();
                
                clients.set(ws, {userId: userUUID, username});
                onlineUsers.set(userUUID, username);
                
                ws.send(JSON.stringify({
                    type: 'INIT_MESSAGES',
                    messages: messages.map(msg => ({
                        ...msg,
                        isCurrentUser: msg.userId === userUUID
                    })),
                    onlineUsers: Array.from(onlineUsers.values()),
                    userId: userUUID
                }));

                const broadcastData = JSON.stringify({
                    type: 'USER_ONLINE',
                    username: username,
                    onlineUsers: Array.from(onlineUsers.values())
                });

                clients.forEach((user, client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(broadcastData);
                    }
                });
            }
            
            if (parsedData.type === 'NEW_MESSAGE') {
                const { user, text, userId, file } = parsedData;
                const newMessage: Message = {
                    id: nextId++,
                    userId: userId,
                    user: user.toString(),
                    text: text.toString(),
                    timestamp: new Date(),
                    file: file
                };
                
                messages.push(newMessage);

                clients.forEach((clientUser, client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        const messageWithUserFlag = {
                            ...newMessage,
                            isCurrentUser: newMessage.userId === clientUser.userId
                        };
                        client.send(JSON.stringify({
                            type: 'NEW_MESSAGE',
                            message: messageWithUserFlag,
                            onlineUsers: Array.from(onlineUsers.values())
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('❌ Ошибка обработки сообщения:', error);
        }
    });

    ws.on('close', () => {
        const user = clients.get(ws);
        if (user) {
            onlineUsers.delete(user.userId);
            clients.delete(ws);
            
            const broadcastData = JSON.stringify({
                type: 'USER_OFFLINE',
                username: user.username,
                onlineUsers: Array.from(onlineUsers.values())
            });

            clients.forEach((_, client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(broadcastData);
                }
            });
        }
    });
});

app.post('/upload', upload.single('file'), (req: express.Request, res: express.Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        const fileInfo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: `http://localhost:${PORT}/uploads/${req.file.filename}`
        };

        res.json(fileInfo);
    } catch (error) {
        console.error('❌ Ошибка загрузки файла:', error);
        res.status(500).json({ error: 'Ошибка загрузки файла' });
    }
});

app.get('/messages', (req: express.Request, res: express.Response) => {
    res.json(messages);
});

app.post('/messages', (req: express.Request, res: express.Response) => {
    const { user, text, userId, file } = req.body;
    
    if ((!user || !text) && !file) {
        return res.status(400).json({ error: 'Сообщение или файл обязательны' });
    }

    const newMessage: Message = {
        id: nextId++,
        userId: userId,
        user: user.toString(),
        text: text || '',
        timestamp: new Date(),
        file: file
    };
    
    messages.push(newMessage);

    clients.forEach((clientUser, client) => {
        if (client.readyState === WebSocket.OPEN) {
            const messageWithUserFlag = {
                ...newMessage,
                isCurrentUser: newMessage.userId === clientUser.userId
            };
            client.send(JSON.stringify({
                type: 'NEW_MESSAGE',
                message: messageWithUserFlag,
                onlineUsers: Array.from(onlineUsers.values())
            }));
        }
    });

    res.json(newMessage);
});

server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});