import clsx from "clsx";
import { useCallback, useContext, useRef, useState } from "react";
import { FiDownload, FiMic, FiMicOff, FiSend } from "react-icons/fi";
import { MdRefresh } from "react-icons/md";
import { AppContext } from "../context";

export default function Records() {

    const {
        ws,
        connectionStatus,
        setConversationHistory,
        setAudioChunks
    } = useContext(AppContext);

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('Waiting for speech...');
    const [response, setResponse] = useState('Assistant will respond here...');
    const [chatThreadId, setChatThreadId] = useState<string | null>(null);
    const [audioResponse, setAudioResponse] = useState<string | null>(null);
    const audioElementRef = useRef<HTMLAudioElement>(null);

    const startRecording = useCallback(async () => {
        try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
            channelCount: 1,
            sampleRate: 16000
            }
        });

        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm'
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            setRecordedAudio(prevAudio => {
                if (prevAudio) URL.revokeObjectURL(URL.createObjectURL(prevAudio));
                return audioBlob;
            });
            stream.getTracks().forEach(track => track.stop()); // Stop all tracks from the stream
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
        setAudioChunks([]);
        } catch (error) {
        console.error('Microphone access error:', error);
        alert('Could not access microphone. Please check permissions.');
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        }
    }, []);

    const sendAudioToServer = useCallback(async () => {
        if (!ws || !recordedAudio) return;

        setIsProcessing(true);

        try {

            let audioBuffer = await recordedAudio.arrayBuffer()
            let threadId = ''
            // Set up message handler
            const handleMessage = async (event: MessageEvent) => {
                try {
                const data = JSON.parse(event.data);
                console.log('Received message: ', data);
                if (data.event_type === 'transcript') {
                    setTranscript(data.text);
                } else if (data.event_type === 'agent_response') {
                    let dataResponse = data.text;
                    if (typeof data.text === "string"){
                        dataResponse = JSON.parse(data.text);
                    }
                    setResponse(dataResponse.responseText);
                    setChatThreadId(dataResponse.chat_thread_id);
                    threadId = dataResponse.chat_thread_id;
                    setIsProcessing(false);
                    setRecordedAudio(null);
                    audioBuffer = new ArrayBuffer(0);
                } else if (data.event_type === 'audio_response') {
                    setAudioResponse(data.audio_data);
                    setIsProcessing(false);
                } else if (data.event_type === 'listening') {
                    if (threadId)
                        ws.send(JSON.stringify({event_type: 'existing_chat', chat_thread_id: chatThreadId}));
                    // Convert Blob to ArrayBuffer and send
                    ws.binaryType = 'arraybuffer';
                    audioBuffer = await recordedAudio.arrayBuffer();
                    ws.send(audioBuffer);
                } else if (data.event_type === 'audio_recieved') {
                    // Send stop listening signal
                    ws.send(JSON.stringify({ event_type: 'stop_listening' }));
                    setIsProcessing(false);
                } else if (data.event_type === 'status') {
                    console.log('Status:', data.message);
                }
                } catch (error) {
                console.error('Error parsing message:', error);
                }
            };

            ws.removeEventListener('message', handleMessage);

            ws.addEventListener('message', handleMessage);

            ws.send(JSON.stringify({ event_type: 'start_listening' }));

            // Only remove the listener when component unmounts or when cleaning up
            return () => {
                ws.removeEventListener('message', handleMessage);
                setIsProcessing(false);
            };
        } catch (error) {
            console.error('Error sending audio:', error);
            setIsProcessing(false);
        }
    }, [ws, recordedAudio]);

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

    const addToHistory = useCallback(() => {
        const entry: ConversationEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        transcript,
        response,
        audioResponse: audioResponse || undefined
        };
        setConversationHistory([entry, ...(Array.isArray(setConversationHistory) ? setConversationHistory : [])]);
    }, [transcript, response, audioResponse]);
    
    return (
        <div className="space-y-6">
        {/* Microphone Controls */}
        <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300">
            <div className="flex flex-col items-center gap-4">
             <br/>   
            <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={clsx(
                'w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all',
                isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                    : 'bg-blue-500 text-white hover:bg-blue-600',
                isProcessing && 'opacity-50 cursor-not-allowed'
                )}
            >
                {isRecording ? <FiMicOff /> : <FiMic />}
            </button>
            <br/>
            <br/>
            <p className="text-center font-semibold text-gray-700">
                {isRecording ? 'Recording...' : 'Click to record'}
            </p>
            </div>
            <br/>
        </div>

        {/* Audio Preview */}
        {recordedAudio && (
            <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Audio Preview</h3>
            <audio
                controls
                src={URL.createObjectURL(recordedAudio)}
                className="w-full"
            />
            <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                onClick={sendAudioToServer}
                disabled={!connectionStatus.connected || isProcessing}
                className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                <FiSend /> Send
                </button>
                <button
                onClick={() => {
                    setTranscript('Waiting for speech...');
                    setResponse('Assistant will respond here...');
                }}
                className="flex items-center justify-center gap-2 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                <MdRefresh /> Clear
                </button>
                <a
                href={URL.createObjectURL(recordedAudio)}
                download={`audio-${Date.now()}.webm`}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                <FiDownload /> Save
                </a>
            </div>
            </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-spin"></div>
                <p className="text-blue-800">Processing your audio...</p>
            </div>
            </div>
        )}

        {/* Transcript */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 className="font-semibold text-gray-800 mb-2">Your Message</h3>
            <p className="text-gray-700">{transcript}</p>
        </div>

        {/* Response */}
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <h3 className="font-semibold text-gray-800 mb-2">Assistant Response</h3>
            <p className="text-gray-700">{response}</p>
        </div>

        {/* Audio Response Player */}
        {audioResponse && (
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <h3 className="font-semibold text-gray-800 mb-3">🔊 Audio Response</h3>
            <button
                onClick={() => playAudioResponse(audioResponse)}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
            >
                Play Audio
            </button>
            <audio ref={audioElementRef} className="w-full mt-2" />
            </div>
        )}

        {/* Save to History Button */}
        {transcript !== 'Waiting for speech...' && response !== 'Assistant will respond here...' && (
            <button
            onClick={addToHistory}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
            Save to History
            </button>
        )}
        </div>
    )
}