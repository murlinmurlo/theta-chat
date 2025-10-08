import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
    id: number;
    user: string;
    text: string;
    timestamp: string;
}

interface ChatState {
    messages: Message[];
    isConnected: boolean;
    username: string;
    isLoading: boolean;
    error: string | null;
}

const initialState: ChatState = {
    messages: [],
    isConnected: false,
    username: '',
    isLoading: false,
    error: null,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        // Установка имени пользователя
        setUsername: (state, action: PayloadAction<string>) => {
            state.username = action.payload;
        },

        // Установка статуса подключения
        setConnection: (state, action: PayloadAction<boolean>) => {
            state.isConnected = action.payload;
        },

        // Установка всех сообщений при инициализации
        setMessages: (state, action: PayloadAction<Message[]>) => {
            state.messages = action.payload;
        },

        // Добавление нового сообщения
        addMessage: (state, action: PayloadAction<Message>) => {
            state.messages.push(action.payload);
        },

        // Установка статуса загрузки
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        // Установка ошибки
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },

        // Очистка ошибки
        clearError: (state) => {
            state.error = null;
        },

        // Выход из чата
        logout: (state) => {
            state.username = '';
            state.messages = [];
            state.isConnected = false;
            state.error = null;
        }
    },
});

export const {
    setUsername,
    setConnection,
    setMessages,
    addMessage,
    setLoading,
    setError,
    clearError,
    logout,
} = chatSlice.actions;

export default chatSlice.reducer;
