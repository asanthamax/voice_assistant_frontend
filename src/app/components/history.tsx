import { useCallback, useContext, useRef, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { MdRefresh } from "react-icons/md";
import { AppContext } from "../context";

export default function History() {
    const { conversationHistory, setConversationHistory } = useContext(AppContext);
    const audioElementRef = useRef<HTMLAudioElement>(null);

    const exportHistory = useCallback(() => {
        const dataStr = JSON.stringify(conversationHistory, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `conversation-history-${Date.now()}.json`;
        link.click();
    }, [conversationHistory]);

    const clearHistory = useCallback(() => {
        if (confirm('Are you sure you want to clear all conversation history?')) {
        setConversationHistory([]);
        }
    }, []);

    const playAudioResponse = useCallback((audioBase64: string) => {
        const audioData = atob(audioBase64);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
        }

        const audioBlob = new Blob([arrayBuffer], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioElementRef.current) {
        audioElementRef.current.src = audioUrl;
        audioElementRef.current.play();
        }
    }, []);
    
    return (
        <div className="space-y-4">
        <div className="flex justify-between items-center mb-4 gap-3 p-7">
            <h2 className="text-xl font-bold text-gray-800">Conversation History</h2>
            <div className="flex gap-2">
            <button
                onClick={exportHistory}
                disabled={conversationHistory.length === 0}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
                <FiDownload /> Export
            </button>
            <button
                onClick={clearHistory}
                disabled={conversationHistory.length === 0}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
                <MdRefresh /> Clear
            </button>
            </div>
        </div>

        {conversationHistory.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-600">No conversation history yet. Start recording to begin!</p>
            </div>
        ) : (
            <div className="space-y-3">
            {conversationHistory.map((entry) => (
                <details
                key={entry.id}
                className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                <summary className="p-4 cursor-pointer font-semibold bg-gray-50 hover:bg-gray-100 flex items-center justify-between">
                    <span>{entry.timestamp}</span>
                    <span className="text-gray-500">▼</span>
                </summary>
                <div className="p-4 space-y-3 bg-white">
                    <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Your Message:</h4>
                    <p className="text-gray-700">{entry.transcript}</p>
                    </div>
                    <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Response:</h4>
                    <p className="text-gray-700">{entry.response}</p>
                    </div>
                    {entry.audioResponse && (
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-1">Audio:</h4>
                        <button
                        onClick={() => playAudioResponse(entry.audioResponse!)}
                        className="text-blue-600 hover:text-blue-800 underline"
                        >
                        Play Audio
                        </button>
                    </div>
                    )}
                </div>
                </details>
            ))}
            </div>
        )}
        </div>
    )
}