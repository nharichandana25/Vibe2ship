/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  Sparkles, Send, Mic, MicOff, Volume2, VolumeX, 
  Brain, Bot, User, Loader2, Info, RefreshCw 
} from 'lucide-react';
import { AIChatMessage, Task, Note } from '../types';

interface SocratesCoachProps {
  tasks: Task[];
  notes: Note[];
  onAddTask: (title: string, priority: 'low' | 'medium' | 'high', category: string) => void;
}

export default function SocratesCoach({ tasks, notes, onAddTask }: SocratesCoachProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: "Greetings, scholar. I am Socrates, your mindful study companion. How can I assist you in focusing, scheduling, or understanding your topics today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice Synthesis and Recognition State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Text-to-Speech (TTS)
  const speakText = (text: string) => {
    if (!isVoiceEnabled) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Simple regex to clean up markdown for cleaner reading aloud
    const cleanedText = text
      .replace(/[\*\#\_]/g, '')
      .replace(/-\s+/g, '')
      .slice(0, 300); // limit spoken length for a smooth experience

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.rate = 1.0;
    utterance.pitch = 0.95; // slightly lower pitch for a calmer tone
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Toggle voice speaking setting
  const toggleVoiceEnabled = () => {
    const nextState = !isVoiceEnabled;
    setIsVoiceEnabled(nextState);
    if (!nextState) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      speakText("Voice guide enabled.");
    }
  };

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText && resultText.trim() !== '') {
          setInputValue(resultText);
        }
        setIsListening(false);
      };

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      window.speechSynthesis.cancel(); // Mute assistant while user speaks
      setIsSpeaking(false);
      setInputValue('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    }
  };

  // Send message to server api
  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          tasks: tasks,
          notes: notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to communicate with Coach');
      }

      const data = await response.json();
      const assistantMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      
      // If voice enabled, speak the reply
      if (isVoiceEnabled) {
        speakText(data.reply);
      }

      // Check if the coach suggests adding a specific task in a structured format
      // E.g., if Socrates output contains a specific markdown format [ADD TASK: Title, Priority]
      checkForEmbeddedTask(data.reply);

    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I'm sensing a small gap in our connection. ${err.message || 'Please make sure GEMINI_API_KEY is configured in the Secrets tab.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Proactive Coach function: Auto-add tasks suggested by Socrates
  const checkForEmbeddedTask = (text: string) => {
    // Looks for "[TASK: title | priority | category]"
    const match = text.match(/\[TASK:\s*([^|]+)\s*\|\s*(low|medium|high)\s*\|\s*([^\]]+)\]/i);
    if (match) {
      const title = match[1].trim();
      const priority = match[2].trim().toLowerCase() as 'low' | 'medium' | 'high';
      const category = match[3].trim();
      
      // Call the add task callback
      onAddTask(title, priority, category);
      
      setMessages(prev => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'assistant',
          content: `⚡ Proactive Action: I have automatically added the study task "${title}" to your priorities.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300 hover:border-slate-700/50" id="socrates-coach-container">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-950/40 border-b border-slate-800/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20 animate-pulse">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 font-display">Socrates Study Coach</h3>
            <p className="text-xs text-slate-400 font-mono tracking-wider">Cognitive Mentor AI</p>
          </div>
        </div>
        
        {/* Audio controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={toggleVoiceEnabled}
            className={`p-1.5 rounded-lg border transition-all ${
              isVoiceEnabled 
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:bg-slate-700 hover:text-slate-200'
            }`}
            title={isVoiceEnabled ? "Mute Coach voice output" : "Enable Coach voice output"}
            id="toggle-voice-out"
          >
            {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          {isSpeaking && (
            <span className="flex space-x-0.5 items-center px-1">
              <span className="w-1 h-3.5 bg-amber-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce delay-150"></span>
              <span className="w-1 h-4 bg-amber-400 rounded-full animate-bounce"></span>
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20 custom-scrollbar" id="socrates-chat-messages">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Icon */}
              <div className={`p-1.5 rounded-lg border shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-slate-800 border-slate-700 text-slate-300' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Message Content */}
              <div className={`p-3 rounded-xl shadow-md text-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-sans' 
                  : 'bg-slate-900 border border-slate-800/80 text-slate-200 leading-relaxed'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className={`text-[10px] mt-1 font-mono text-right ${
                  msg.role === 'user' ? 'text-indigo-200/80' : 'text-slate-500'
                }`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-slate-950/40 border border-slate-800/85 px-4 py-2.5 rounded-2xl">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-xs text-slate-400 font-mono">Socrates is formulating wisdom...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Inputs */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800/60 bg-slate-900/60 backdrop-blur-md" id="socrates-chat-input-form">
        <div className="flex items-center space-x-2">
          {/* Micro Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening 
                ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse' 
                : 'bg-slate-800 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-white'
            }`}
            title={isListening ? "Listening... click to pause" : "Dictate message"}
            id="socrates-mic-button"
          >
            {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isListening ? "Listening to your voice..." : "Ask Socrates to organize study or check knowledge..."}
            className="flex-1 px-4 py-2 text-sm bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/10 text-slate-100 placeholder-slate-600 font-sans"
            disabled={isLoading}
            id="socrates-chat-input"
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 bg-amber-500 text-slate-950 hover:bg-amber-400 active:bg-amber-600 rounded-xl disabled:opacity-40 transition-colors shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            id="socrates-submit-button"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {/* Suggestion hints */}
        <div className="flex space-x-1.5 mt-2 overflow-x-auto pb-1 text-[11px] text-slate-400 font-mono no-scrollbar">
          <button
            type="button"
            onClick={() => setInputValue("Suggest a Pomodoro study schedule for my exams")}
            className="px-2.5 py-1 bg-slate-950/50 border border-slate-800/80 rounded-lg hover:bg-slate-800/60 hover:text-slate-200 shrink-0 text-slate-400"
          >
            📅 Study Plan
          </button>
          <button
            type="button"
            onClick={() => setInputValue("What is active recall and how do I use the Leitner box system?")}
            className="px-2.5 py-1 bg-slate-950/50 border border-slate-800/80 rounded-lg hover:bg-slate-800/60 hover:text-slate-200 shrink-0 text-slate-400"
          >
            📦 Leitner System
          </button>
          <button
            type="button"
            onClick={() => setInputValue("Analyze my priorities and warning flags")}
            className="px-2.5 py-1 bg-slate-950/50 border border-slate-800/80 rounded-lg hover:bg-slate-800/60 hover:text-slate-200 shrink-0 text-slate-400"
          >
            ⚠️ Warnings
          </button>
        </div>
      </form>
    </div>
  );
}
