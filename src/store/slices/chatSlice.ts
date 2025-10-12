import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FileInfo {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
}

export interface User {
    userId: string;
    username: string;
    avatar?: string;
}

export interface Message {
    id: number;
    userId: string;
    user: string;
    text: string;
    timestamp: string;
    isCurrentUser?: boolean;
    file?: FileInfo;
    userAvatar?: string;
}

interface ChatState {
    messages: Message[];
    isConnected: boolean;
    username: string;
    userId: string;
    userAvatar: string;
    isLoading: boolean;
    error: string | null;
    onlineUsers: User[];
    isUploading: boolean;
    isAvatarUploading: boolean;
}

const initialState: ChatState = {
    messages: [],
    isConnected: false,
    username: '',
    userId: '',
    userAvatar: '',
    isLoading: false,
    error: null,
    onlineUsers: [],
    isUploading: false,
    isAvatarUploading: false,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setUsername: (state, action: PayloadAction<string>) => {
            state.username = action.payload;
        },
        setUserId: (state, action: PayloadAction<string>) => {
            state.userId = action.payload;
        },
        setUserAvatar: (state, action: PayloadAction<string>) => {
            state.userAvatar = action.payload;
        },
        setConnection: (state, action: PayloadAction<boolean>) => {
            state.isConnected = action.payload;
        },
        setMessages: (state, action: PayloadAction<Message[]>) => {
            state.messages = action.payload;
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            state.messages.push(action.payload);
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        logout: (state) => {
            state.username = '';
            state.userId = '';
            state.userAvatar = '';
            state.messages = [];
            state.isConnected = false;
            state.error = null;
            state.onlineUsers = [];
            state.isUploading = false;
            state.isAvatarUploading = false;
        },
        setOnlineUsers: (state, action: PayloadAction<User[]>) => {
            state.onlineUsers = action.payload;
        },
        updateOnlineUsers: (state, action: PayloadAction<{user: User, type: 'online' | 'offline'}>) => {
            const { user, type } = action.payload;
            if (type === 'online') {
                const existingUserIndex = state.onlineUsers.findIndex(u => u.userId === user.userId);
                if (existingUserIndex === -1) {
                    state.onlineUsers.push(user);
                } else {
                    state.onlineUsers[existingUserIndex] = user;
                }
            } else {
                state.onlineUsers = state.onlineUsers.filter(u => u.userId !== user.userId);
            }
        },
        setUploading: (state, action: PayloadAction<boolean>) => {
            state.isUploading = action.payload;
        },
        setAvatarUploading: (state, action: PayloadAction<boolean>) => {
            state.isAvatarUploading = action.payload;
        },
        updateUserAvatar: (state, action: PayloadAction<{userId: string, avatar: string}>) => {
            const { userId, avatar } = action.payload;
            if (userId === state.userId) {
                state.userAvatar = avatar;
            }
            
            state.onlineUsers = state.onlineUsers.map(user => 
                user.userId === userId ? { ...user, avatar } : user
            );
            
            state.messages = state.messages.map(message =>
                message.userId === userId ? { ...message, userAvatar: avatar } : message
            );
        }
    },
});

export const {
    setUsername,
    setUserId,
    setUserAvatar,
    setConnection,
    setMessages,
    addMessage,
    setLoading,
    setError,
    clearError,
    logout,
    setOnlineUsers,
    updateOnlineUsers,
    setUploading,
    setAvatarUploading,
    updateUserAvatar,
} = chatSlice.actions;

export default chatSlice.reducer;