import { useContext, useState } from "react";
import { AppContext } from "../context";

export default function About() {
  const { connectionStatus, serverUrl } = useContext(AppContext)
  
  return (
    <div className="space-y-4 text-gray-700">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">About Voice Assistant</h3>
        <p>
          This is an intelligent voice assistant that helps you interact with our AI system using natural speech.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-800 mb-2">Features</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>🎤 Real-time speech recognition</li>
          <li>🤖 AI-powered assistant</li>
          <li>🔊 Text-to-speech responses</li>
          <li>💾 Conversation history</li>
          <li>📥 Export conversations</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-gray-800 mb-2">How to Use</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Configure server URL in settings</li>
          <li>Click Connect to establish connection</li>
          <li>Click microphone to record your message</li>
          <li>Click Send to process</li>
          <li>Listen to the response</li>
        </ol>
      </div>

      <div>
        <h4 className="font-semibold text-gray-800 mb-2">Tech Stack</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Frontend: Next.js, React, Tailwind CSS</li>
          <li>Backend: FastAPI, WebSocket</li>
          <li>Speech: Google Cloud APIs</li>
          <li>Agent: LangGraph, LangChain</li>
        </ul>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Status:</strong> {connectionStatus.message} | <strong>Server:</strong> {serverUrl}
        </p>
      </div>
    </div>
  );
}