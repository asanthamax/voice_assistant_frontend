import { createContext } from 'react';

interface AppContextType {
  ws: WebSocket | null;
  setWs: (ws: WebSocket | null) => void;
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  conversationHistory: ConversationEntry[];
  setConversationHistory: (history: ConversationEntry[]) => void;
  audioChunks: Blob[];
  setAudioChunks: (chunks: Blob[]) => void;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

export const AppContext = createContext<AppContextType>({
  ws: null,
  setWs: () => {},
  connectionStatus: {
    connected: false,
    message: 'Disconnected',
    type: 'disconnected'
  },
  setConnectionStatus: () => {},
  conversationHistory: [],
  setConversationHistory: () => {},
  audioChunks: [],
  setAudioChunks: () => {},
  serverUrl: 'ws://localhost:8000/ws/voice',
  setServerUrl: () => {},
  showSettings: false,
  setShowSettings: () => {}
});