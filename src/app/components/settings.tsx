import { useCallback, useContext, useState } from "react";
import { FiX } from "react-icons/fi";
import { AppContext } from "../context";

export default function SettingsModal() {
    const {
        ws,
        setWs,
        setConnectionStatus,
        serverUrl,
        setServerUrl,
        showSettings,
        setShowSettings
    } = useContext(AppContext)

    const connectWebSocket = useCallback(async (url: string) => {
        try {
            setConnectionStatus({
                connected: false,
                message: 'Connecting...',
                type: 'connecting'
            });

            const websocket = new WebSocket(url);

            websocket.onopen = () => {
                setWs(websocket);
                setConnectionStatus({
                connected: true,
                message: '✓ Connected',
                type: 'connected'
                });
            };

            websocket.onerror = () => {
                setConnectionStatus({
                connected: false,
                message: 'Connection Error',
                type: 'disconnected'
                });
            };

            websocket.onclose = () => {
                setWs(null);
                setConnectionStatus({
                connected: false,
                message: 'Disconnected',
                type: 'disconnected'
                });
            };
        } catch (error) {
            console.error('WebSocket connection error:', error);
            setConnectionStatus({
                connected: false,
                message: 'Failed to connect',
                type: 'disconnected'
            });
        }
    }, []);

    const disconnectWebSocket = useCallback(() => {
        if (ws) {
        ws.close();
        setWs(null);
        setConnectionStatus({
            connected: false,
            message: 'Disconnected',
            type: 'disconnected'
        });
        }
    }, [ws]);

    if (!showSettings) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Settings</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WebSocket Server URL
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  connectWebSocket(serverUrl);
                  setShowSettings(false);
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect
              </button>
              <button
                onClick={() => {
                  disconnectWebSocket();
                  setShowSettings(false);
                }}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>
    );
}