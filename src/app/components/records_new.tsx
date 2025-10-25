import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Activity } from 'lucide-react';

export default function RecordsNew() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const audioChunksBufferRef = useRef<Blob[]>([]); // Buffer to store audio chunks
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const SILENCE_THRESHOLD = 10; // Adjust as needed (0-100 scale)
  const SILENCE_DURATION_MS = 700; // Milliseconds of silence before sending
  const arrayBuffer: ArrayBuffer[] = []

  // Initialize WebSocket connection
  const connectWebSocket = () => {
    // Replace with your backend WebSocket URL
    const ws = new WebSocket('ws://localhost:8000/ws/voice');
    
    ws.onopen = () => {
      setStatus('Connected');
      console.log('WebSocket connected');
    };
    
    ws.onclose = () => {
      setStatus('Disconnected');
      console.log('WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      setStatus('Error');
      console.error('WebSocket error:', error);
    };
    
    wsRef.current = ws;
  };

  // Function to send buffered audio chunks
  const sendBufferedAudio = async () => {
    if (isProcessing || audioChunksBufferRef.current.length === 0 || wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    setIsProcessing(true);
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    const combinedBlob = new Blob(audioChunksBufferRef.current, { type: 'audio/webm' });
    const arrayBuffer = await combinedBlob.arrayBuffer();

    console.log(`Sending buffered audio chunk of length: ${arrayBuffer.byteLength}`);
    wsRef.current.binaryType = 'arraybuffer';
    wsRef.current.send(arrayBuffer);

    audioChunksBufferRef.current.length = 0; // Clear the buffer after sending
  };

  // Audio level visualization
  const updateAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average / 255 * 100);
    
    /*if (average < SILENCE_THRESHOLD) {
      if (audioChunksBufferRef.current.length > 0 && silenceTimeoutRef.current === null) {
        silenceTimeoutRef.current = setTimeout(sendBufferedAudio, SILENCE_DURATION_MS);
      }
    } else {
      if (silenceTimeoutRef.current !== null) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    }*/

    animationRef.current = requestAnimationFrame(updateAudioLevel);
  };

  // Start recording and streaming
  const startRecording = async () => {
    try {
      // Connect WebSocket if not connected
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connectWebSocket(); // Attempt to connect
        // The rest of the logic will proceed, but sending will only happen if WS is OPEN
        // Consider adding a more robust waiting mechanism if connection is critical before starting recorder
        // For now, it will just buffer until connected.
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Common sample rate for speech
        } 
      });

      // Setup audio context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      updateAudioLevel();
      
      audioChunksBufferRef.current = []; // Clear buffer for new recording
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksBufferRef.current.push(event.data);
        }
      };

      // Record in small chunks for real-time streaming (100ms chunks)
      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus('Error: Error occurred');
    }
  };

  // Stop recording and streaming
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsProcessing(false); // Ensure processing state is reset
      sendBufferedAudio()
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);
    // Explicitly send stop_listening to backend when user stops recording
    wsRef.current?.send(JSON.stringify({ event_type: 'stop_listening' }));
  };
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      console.log('Received message: ', event.data);
    const data = JSON.parse(event.data);
    if (data.event_type === 'audio_chunk_processed') {
      wsRef.current?.send(JSON.stringify({ event_type: 'stop_listening' }));
    } else if (data.event_type === 'audio_response') {
      console.log("Audio response received");
      const audioData = atob(data.audio_data);
      arrayBuffer.push(new ArrayBuffer(audioData.length))
      const view = new Uint8Array(arrayBuffer[arrayBuffer.length - 1]);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
    } else if (data.event_type === 'final_audio_response') {
      setIsProcessing(false);
      const audioBlob = new Blob(arrayBuffer, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement('audio');
      }
      audioElementRef.current.src = audioUrl;
      audioElementRef.current.play();
      arrayBuffer.length = 0;
    }
    // Removed 'final_audio_response' handling as it was using a local state 'audioBuffer'
    // which is now replaced by streaming chunks.
  };

  if (wsRef.current) {
    const ws: WebSocket = wsRef.current;
    ws.addEventListener('message', handler);
    return () => ws.removeEventListener('message', handler);
  }
  }, [wsRef.current]); // Dependency on wsRef.current to re-attach handler if WS changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

  // Connect WebSocket on component mount
  useEffect(() => {
    connectWebSocket();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4" style={{ width: '100%' }}>
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Smart Appointment scheduling assistant
          </h1>
          <p className="text-gray-600">
            Stream microphone audio to backend in real-time make sure to press Stop Talk once you ask something in order to assistant to speak
          </p>
        </div>

        {/* Status Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            status === 'Connected' ? 'bg-green-500' :
            status === 'Disconnected' ? 'bg-gray-400' :
            'bg-red-500'
          }`} />
          <span className="text-sm text-gray-700">{status}</span>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-700">Processing audio...</span>
            <span className="text-sm text-gray-700">{status}</span>
          </div>
        )}

        {/* Audio Level Visualization */}
        {isRecording && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-700">Audio Level</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-100"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        )}

        {/* Record Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-full py-4 rounded-xl font-semibold text-white transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-6 h-6" />
              Stop Talk
            </>
          ) : (
            <>
              <Mic className="w-6 h-6" />
              Start Talk
            </>
          )}
        </button>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Note:</span> Make sure your backend WebSocket server is running on{' '}
            <code className="bg-white px-1 rounded">ws://localhost:8000/ws/voice</code>
          </p>
        </div>
      </div>




    </div>
  );
}