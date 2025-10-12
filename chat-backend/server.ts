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
app.use('/avatars', express.static('avatars'));

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
if (!fs.existsSync('avatars')) {
    fs.mkdirSync('avatars');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'avatar') {
            cb(null, 'avatars/');
        } else {
            cb(null, 'uploads/');
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'avatar') {
            const allowedTypes = /jpeg|jpg|png|gif/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);

            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Только изображения разрешены для аватарок'));
            }
        } else {
            const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);

            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Недопустимый тип файла'));
            }
        }
    }
});

interface User {
    userId: string;
    username: string;
    avatar?: string;
}

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
const clients: Map<WebSocket, User> = new Map();
const onlineUsers: Map<string, User> = new Map();

wss.on('connection', (ws: WebSocket) => {
    console.log('🔗 Новое WebSocket соединение');

    ws.on('message', (data: Buffer) => {
        try {
            const parsedData = JSON.parse(data.toString());
            
            if (parsedData.type === 'LOGIN') {
                const { username, userId, avatar } = parsedData;
                const userUUID = userId || uuidv4();
                
                const user: User = {
                    userId: userUUID,
                    username: username,
                    avatar: avatar
                };
                
                clients.set(ws, user);
                onlineUsers.set(userUUID, user);
                
                ws.send(JSON.stringify({
                    type: 'INIT_MESSAGES',
                    messages: messages.map(msg => ({
                        ...msg,
                        isCurrentUser: msg.userId === userUUID,
                        userAvatar: onlineUsers.get(msg.userId)?.avatar
                    })),
                    onlineUsers: Array.from(onlineUsers.values()),
                    userId: userUUID
                }));

                const broadcastData = JSON.stringify({
                    type: 'USER_ONLINE',
                    user: user,
                    onlineUsers: Array.from(onlineUsers.values())
                });

                clients.forEach((clientUser, client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(broadcastData);
                    }
                });
            }
            
            if (parsedData.type === 'NEW_MESSAGE') {
                const { user, text, userId, file } = parsedData;
                const userData = onlineUsers.get(userId);
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
                            isCurrentUser: newMessage.userId === clientUser.userId,
                            userAvatar: userData?.avatar
                        };
                        client.send(JSON.stringify({
                            type: 'NEW_MESSAGE',
                            message: messageWithUserFlag,
                            onlineUsers: Array.from(onlineUsers.values())
                        }));
                    }
                });
            }

            if (parsedData.type === 'UPDATE_AVATAR') {
                const { userId, avatar } = parsedData;
                const user = onlineUsers.get(userId);
                if (user) {
                    user.avatar = avatar;
                    onlineUsers.set(userId, user);
                    
                    const broadcastData = JSON.stringify({
                        type: 'AVATAR_UPDATED',
                        user: user,
                        onlineUsers: Array.from(onlineUsers.values())
                    });

                    clients.forEach((clientUser, client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(broadcastData);
                        }
                    });
                }
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
                user: user,
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

app.post('/upload-avatar', upload.single('avatar'), (req: express.Request, res: express.Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Аватар не загружен' });
        }

        const avatarInfo = {
            filename: req.file.filename,
            url: `http://localhost:${PORT}/avatars/${req.file.filename}`
        };

        res.json(avatarInfo);
    } catch (error) {
        console.error('❌ Ошибка загрузки аватара:', error);
        res.status(500).json({ error: 'Ошибка загрузки аватара' });
    }
});

app.get('/messages', (req: express.Request, res: express.Response) => {
    const messagesWithAvatars = messages.map(msg => ({
        ...msg,
        userAvatar: onlineUsers.get(msg.userId)?.avatar
    }));
    res.json(messagesWithAvatars);
});

app.post('/messages', (req: express.Request, res: express.Response) => {
    const { user, text, userId, file } = req.body;
    
    if ((!user || !text) && !file) {
        return res.status(400).json({ error: 'Сообщение или файл обязательны' });
    }

    const userData = onlineUsers.get(userId);
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
                isCurrentUser: newMessage.userId === clientUser.userId,
                userAvatar: userData?.avatar
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