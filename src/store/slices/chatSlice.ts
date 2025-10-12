import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FileInfo {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
}

export interface Message {
    id: number;
    userId: string;
    user: string;
    text: string;
    timestamp: string;
    isCurrentUser?: boolean;
    file?: FileInfo;
}

interface ChatState {
    messages: Message[];
    isConnected: boolean;
    username: string;
    userId: string;
    isLoading: boolean;
    error: string | null;
    onlineUsers: string[];
    isUploading: boolean;
}

const initialState: ChatState = {
    messages: [],
    isConnected: false,
    username: '',
    userId: '',
    isLoading: false,
    error: null,
    onlineUsers: [],
    isUploading: false,
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
            state.messages = [];
            state.isConnected = false;
            state.error = null;
            state.onlineUsers = [];
            state.isUploading = false;
        },
        setOnlineUsers: (state, action: PayloadAction<string[]>) => {
            state.onlineUsers = action.payload;
        },
        updateOnlineUsers: (state, action: PayloadAction<{username: string, type: 'online' | 'offline'}>) => {
            const { username, type } = action.payload;
            if (type === 'online') {
                if (!state.onlineUsers.includes(username)) {
                    state.onlineUsers.push(username);
                }
            } else {
                state.onlineUsers = state.onlineUsers.filter(user => user !== username);
            }
        },
        setUploading: (state, action: PayloadAction<boolean>) => {
            state.isUploading = action.payload;
        }
    },
});

export const {
    setUsername,
    setUserId,
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
} = chatSlice.actions;

export default chatSlice.reducer;