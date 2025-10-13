interface ConnectionStatus {
  connected: boolean;
  message: string;
  type: 'connected' | 'disconnected' | 'connecting';
}