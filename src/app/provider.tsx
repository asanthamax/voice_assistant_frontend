'use client';

import React, { useState } from 'react';
import { AppContext } from './context';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    message: 'Disconnected',
    type: 'disconnected'
  });
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [serverUrl, setServerUrl] = useState('ws://localhost:8000/ws/voice');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <AppContext.Provider
      value={{
        ws,
        setWs,
        connectionStatus,
        setConnectionStatus,
        conversationHistory,
        setConversationHistory,
        audioChunks,
        setAudioChunks,
        serverUrl,
        setServerUrl,
        showSettings,
        setShowSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};