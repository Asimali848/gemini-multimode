
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { MODELS, Icons } from '../constants';

const LiveVoiceView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ role: string, text: string }[]>([]);
  const [volume, setVolume] = useState(0);

  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionRef = useRef({ user: '', model: '' });

  // Audio utility functions (Manual implementation as requested)
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
      // Calculate basic volume for visualization
      if (Math.abs(data[i]) > volume) {
        // We'll update volume via setVolume in the processor
      }
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setIsActive(false);
    setVolume(0);
  }, []);

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(outputAudioContextRef.current.destination);

      const sessionPromise = ai.live.connect({
        model: MODELS.LIVE,
        callbacks: {
          onopen: () => {
            console.log('Live session opened');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for UI
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length) * 100);

              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle transcriptions
            if (message.serverContent?.outputTranscription) {
              transcriptionRef.current.model += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              transcriptionRef.current.user += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const userT = transcriptionRef.current.user;
              const modelT = transcriptionRef.current.model;
              setTranscriptions(prev => [...prev, { role: 'You', text: userT }, { role: 'Gemini', text: modelT }]);
              transcriptionRef.current = { user: '', model: '' };
            }

            // Handle audio output
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outputAudioContextRef.current, 24000, 1);
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNode);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Live error:', e),
          onclose: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are a helpful and intelligent multimodal studio assistant. Engage in natural conversation.',
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;
      setIsActive(true);
    } catch (error) {
      console.error('Failed to start live session:', error);
      alert('Could not access microphone or start session.');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative">
      <header className="absolute top-0 left-0">
        <h2 className="text-2xl font-bold text-white">Live Voice</h2>
        <p className="text-slate-400 text-sm">Real-time multimodal conversation</p>
      </header>

      <div className="w-full max-w-2xl flex flex-col items-center gap-12">
        {/* Animated Voice Visualizer */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          {isActive ? (
            <>
              <div 
                className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-50" 
                style={{ transform: `scale(${1 + volume / 50})` }}
              />
              <div 
                className="absolute inset-4 bg-blue-500/20 rounded-full animate-pulse" 
                style={{ transform: `scale(${1 + volume / 100})` }}
              />
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 shadow-2xl shadow-indigo-500/50 flex items-center justify-center z-10 transition-transform duration-75"
                   style={{ transform: `scale(${1 + volume / 200})` }}>
                <i className="fa-solid fa-waveform text-4xl text-white"></i>
              </div>
            </>
          ) : (
            <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-500 text-4xl">
              <i className="fa-solid fa-microphone-slash"></i>
            </div>
          )}
        </div>

        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">
            {isActive ? "Gemini is listening..." : "Ready to talk?"}
          </h3>
          <p className="text-slate-400 text-sm mb-8">
            {isActive ? "Speak naturally to interact with the AI in real-time." : "Click the button below to start a live voice session."}
          </p>

          <button
            onClick={isActive ? stopSession : startSession}
            className={`px-10 py-5 rounded-2xl font-bold text-lg transition-all flex items-center gap-4 ${
              isActive 
                ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white' 
                : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 active:scale-95'
            }`}
          >
            {isActive ? (
              <>
                <Icons.Stop /> End Session
              </>
            ) : (
              <>
                <Icons.Live /> Start Conversation
              </>
            )}
          </button>
        </div>

        {/* Live Transcription History */}
        {transcriptions.length > 0 && (
          <div className="w-full glass rounded-2xl overflow-hidden max-h-64 flex flex-col border border-slate-800">
            <div className="p-3 bg-slate-900/50 border-b border-slate-800 flex justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Transcription</span>
              <span className="text-xs text-indigo-400 animate-pulse">Live</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {transcriptions.map((t, i) => (
                <div key={i} className="text-sm">
                  <span className={`font-bold mr-2 ${t.role === 'You' ? 'text-indigo-400' : 'text-blue-400'}`}>
                    {t.role}:
                  </span>
                  <span className="text-slate-300">{t.text}</span>
                </div>
              ))}
              <div className="text-sm text-slate-500 italic">
                {transcriptionRef.current.user && `You: ${transcriptionRef.current.user}...`}
                {transcriptionRef.current.model && `Gemini: ${transcriptionRef.current.model}...`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveVoiceView;
