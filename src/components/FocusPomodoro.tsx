/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Flame,
  Coffee, Timer, Sparkles, Notebook, HelpCircle, Check, Trash 
} from 'lucide-react';
import { Task } from '../types';

interface FocusPomodoroProps {
  tasks: Task[];
  activeTaskId: string | null;
  onIncrementPomodoro: (taskId: string) => void;
  onLogFocusSession: (taskId: string | null, durationMinutes: number) => void;
}

type TimerMode = 'study' | 'shortBreak' | 'longBreak';

export default function FocusPomodoro({ 
  tasks, 
  activeTaskId, 
  onIncrementPomodoro, 
  onLogFocusSession 
}: FocusPomodoroProps) {
  const [mode, setMode] = useState<TimerMode>('study');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [ambientSound, setAmbientSound] = useState<'none' | 'pink_noise' | 'binaural'>('none');
  
  // Distraction dump list state
  const [distractions, setDistractions] = useState<string[]>([]);
  const [newDistraction, setNewDistraction] = useState('');
  
  // Audio references for synthesized audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const synthIntervalRef = useRef<any>(null);

  // Map modes to standard durations
  const durations = {
    study: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  // Set time when mode changes
  useEffect(() => {
    setTimeLeft(durations[mode]);
    setIsRunning(false);
  }, [mode]);

  // Timer tick logic
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  // Handle timer completion
  const handleTimerComplete = () => {
    setIsRunning(false);
    playSynthBell();
    
    const minutesCompleted = Math.round(durations[mode] / 60);
    
    // Log focus session
    onLogFocusSession(activeTaskId, minutesCompleted);
    
    if (mode === 'study') {
      if (activeTaskId) {
        onIncrementPomodoro(activeTaskId);
      }
      alert("🍅 Study Session Completed! Take a deep breath and a short break.");
      setMode('shortBreak');
    } else {
      alert("🔋 Break completed! Ready to focus again?");
      setMode('study');
    }
  };

  // NATIVE SYNTHESIZED AUDIO BELL (No external MP3 files required)
  const playSynthBell = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      // Dynamic bell sound synthesis
      const now = ctx.currentTime;
      
      // Tone 1: Fundamental
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      // Tone 2: Harmonious Overtones
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now); // A5
      gain2.gain.setValueAtTime(0.25, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.0);
      osc2.stop(now + 1.5);
    } catch (e) {
      console.error("Web Audio bell synthesis failed", e);
    }
  };

  // NATIVE AMBIENT AUDIO GENERATOR (Pink noise & Binaural beats synthesized on-the-fly)
  const startAmbientSound = (type: 'pink_noise' | 'binaural') => {
    stopAmbientSound();
    
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      if (type === 'pink_noise') {
        // Synthesizing Pink Noise directly via Buffer
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11; // scaling volume
          b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Bandpass filter to make it sound warmer/like rain
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 450;
        filter.Q.value = 1.0;

        const gain = ctx.createGain();
        gain.gain.value = 0.25; // Gentle volume

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        whiteNoise.start();
        noiseNodeRef.current = whiteNoise;
      } 
      else if (type === 'binaural') {
        // Binaural beat synthesis: 100Hz in left ear, 107Hz in right ear (7Hz Theta wave for learning & memory!)
        const merger = ctx.createChannelMerger(2);
        
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        const gainL = ctx.createGain();
        const gainR = ctx.createGain();
        const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        oscL.frequency.value = 100; // Left channel 100Hz
        oscR.frequency.value = 107; // Right channel 107Hz (7Hz difference)

        gainL.gain.value = 0.12;
        gainR.gain.value = 0.12;

        if (pannerL && pannerR) {
          pannerL.pan.value = -1;
          pannerR.pan.value = 1;
          
          oscL.connect(pannerL);
          pannerL.connect(merger, 0, 0);
          
          oscR.connect(pannerR);
          pannerR.connect(merger, 0, 1);
        } else {
          // Fallback
          oscL.connect(gainL);
          gainL.connect(ctx.destination);
          oscR.connect(gainR);
          gainR.connect(ctx.destination);
        }

        if (pannerL && pannerR) {
          const mainGain = ctx.createGain();
          mainGain.gain.value = 0.15;
          merger.connect(mainGain);
          mainGain.connect(ctx.destination);
        }

        oscL.start();
        oscR.start();

        // Save a wrapper node to stop them
        noiseNodeRef.current = {
          disconnect: () => {
            oscL.stop();
            oscR.stop();
            oscL.disconnect();
            oscR.disconnect();
          }
        } as any;
      }
    } catch (e) {
      console.error("Ambient audio synthesis failed", e);
    }
  };

  const stopAmbientSound = () => {
    if (noiseNodeRef.current) {
      try {
        noiseNodeRef.current.disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  // Toggle ambient soundtrack
  const handleAmbientChange = (type: 'none' | 'pink_noise' | 'binaural') => {
    setAmbientSound(type);
    if (type === 'none') {
      stopAmbientSound();
    } else {
      startAmbientSound(type);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add distraction to dump
  const handleAddDistraction = (e: FormEvent) => {
    e.preventDefault();
    if (!newDistraction.trim()) return;
    setDistractions(prev => [...prev, newDistraction.trim()]);
    setNewDistraction('');
  };

  const clearDistractions = () => {
    setDistractions([]);
  };

  const removeDistraction = (index: number) => {
    setDistractions(prev => prev.filter((_, i) => i !== index));
  };

  // Calculated values for progress SVG
  const progressPercent = (timeLeft / durations[mode]) * 100;
  const strokeDashoffset = 282.6 * (1 - progressPercent / 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="pomodoro-focus-container">
      {/* LEFT & CENTER: Pomodoro Stage */}
      <div className="md:col-span-2 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.4)] p-6 flex flex-col items-center justify-between min-h-[460px] transition-all duration-300 hover:border-slate-700/50">
        {/* Header/Mode selection */}
        <div className="w-full flex justify-between items-center pb-4 border-b border-slate-800/60">
          <div className="flex items-center space-x-2">
            <Timer className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-100 font-display tracking-tight">Deep Focus Arena</span>
          </div>
          <div className="flex space-x-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800/60">
            <button
              onClick={() => setMode('study')}
              className={`px-3.5 py-1 text-xs font-medium rounded-lg transition-all ${
                mode === 'study' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-slate-200'
              }`}
              id="mode-study-button"
            >
              Study
            </button>
            <button
              onClick={() => setMode('shortBreak')}
              className={`px-3.5 py-1 text-xs font-medium rounded-lg transition-all ${
                mode === 'shortBreak' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-slate-200'
              }`}
              id="mode-short-button"
            >
              Short Break
            </button>
            <button
              onClick={() => setMode('longBreak')}
              className={`px-3.5 py-1 text-xs font-medium rounded-lg transition-all ${
                mode === 'longBreak' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-slate-200'
              }`}
              id="mode-long-button"
            >
              Long Break
            </button>
          </div>
        </div>

        {/* Timer Canvas */}
        <div className="relative my-8 flex items-center justify-center">
          {/* Glowing background aura behind timer */}
          <div className={`absolute w-44 h-44 rounded-full blur-2xl transition-all duration-1000 ${
            isRunning 
              ? mode === 'study' 
                ? 'bg-indigo-500/10' 
                : 'bg-emerald-500/10' 
              : 'bg-amber-500/5'
          }`}></div>

          <svg className="w-60 h-60 transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="120"
              cy="120"
              r="90"
              className="stroke-slate-800/60 fill-none"
              strokeWidth="5"
            />
            {/* Progress ring */}
            <circle
              cx="120"
              cy="120"
              r="90"
              className={`fill-none transition-all duration-300 ${
                mode === 'study' ? 'stroke-indigo-500' : 'stroke-emerald-500'
              }`}
              strokeWidth="5"
              strokeDasharray="565.2"
              strokeDashoffset={strokeDashoffset * 2} // multiplier adjustments
              style={{
                filter: mode === 'study' ? 'drop-shadow(0 0 6px rgba(99,102,241,0.5))' : 'drop-shadow(0 0 6px rgba(16,185,129,0.5))'
              }}
            />
          </svg>
          
          {/* Inner Text */}
          <div className="absolute text-center z-10">
            <div className="text-5xl font-mono font-semibold tracking-tight text-slate-50" id="pomodoro-timer-display">
              {formatTime(timeLeft)}
            </div>
            <div className={`text-[10px] font-mono mt-1 uppercase tracking-wider ${
              mode === 'study' ? 'text-indigo-400' : 'text-emerald-400'
            }`}>
              {mode === 'study' ? 'Focus Block' : 'Recovery Block'}
            </div>
          </div>
        </div>

        {/* Selected Task Indicator */}
        <div className="w-full text-center py-2 px-4 bg-slate-950/40 rounded-xl border border-slate-800/60 mb-4 max-w-md">
          <span className="text-[10px] text-slate-400 font-mono block tracking-wider uppercase">FOCUS OBJECTIVE</span>
          {activeTask ? (
            <div className="flex items-center justify-center space-x-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              <span className="text-sm font-medium text-slate-200 truncate max-w-[280px]">
                {activeTask.title}
              </span>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                {activeTask.pomodorosSpent}/{activeTask.pomodorosEstimated || '∞'} 🍅
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic mt-1 block">
              No objective selected. Set a study task as "Active" to automatically log Pomodoros!
            </span>
          )}
        </div>

        {/* Control Row */}
        <div className="flex items-center space-x-4 mb-2">
          {/* Reset */}
          <button
            onClick={() => {
              setTimeLeft(durations[mode]);
              setIsRunning(false);
            }}
            className="p-3 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all border border-slate-700/50"
            title="Reset timer"
            id="pomodoro-reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* PLAY/PAUSE */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-3.5 rounded-xl font-semibold shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center space-x-2 ${
              isRunning 
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-rose-900/10 hover:shadow-rose-500/20' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-900/15 hover:shadow-indigo-500/30'
            }`}
            id="pomodoro-start-pause"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Start Study Session</span>
              </>
            )}
          </button>

          {/* Test Sound Bell */}
          <button
            onClick={playSynthBell}
            className="p-3 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all border border-slate-700/50"
            title="Preview completion bell"
            id="pomodoro-bell-preview"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Ambient soundtracks controls */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-800/60 text-xs gap-3">
          <span className="text-slate-400 font-mono flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ambient soundscapes:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleAmbientChange('none')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                ambientSound === 'none' 
                  ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-500/20' 
                  : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              Mute
            </button>
            <button
              onClick={() => handleAmbientChange('pink_noise')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                ambientSound === 'pink_noise' 
                  ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-500/20' 
                  : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
              title="Continuous synthesized soft rain rumble"
            >
              ☔ Deep Rain
            </button>
            <button
              onClick={() => handleAmbientChange('binaural')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                ambientSound === 'binaural' 
                  ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-500/20' 
                  : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
              title="Theta 7Hz brainwave entrainment for focused memory retention"
            >
              🧠 Theta Waves
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Distraction Dump Notepad */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.4)] p-5 flex flex-col h-full min-h-[460px] transition-all duration-300 hover:border-slate-700/50">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/60">
          <div className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
            <Notebook className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 font-display">Mind Clear Notepad</h4>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Distraction Dump</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 my-3 leading-relaxed">
          Getting off-topic thoughts? Write them down instantly below to safely release them from your working memory and preserve focus.
        </p>

        {/* Distraction Form */}
        <form onSubmit={handleAddDistraction} className="flex space-x-1.5 mb-3">
          <input
            type="text"
            value={newDistraction}
            onChange={(e) => setNewDistraction(e.target.value)}
            placeholder="Dump distracting thought..."
            className="flex-1 px-3.5 py-1.5 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/10 text-slate-100 placeholder-slate-600 font-sans"
            id="distraction-input"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded-xl text-xs font-semibold transition-all"
            id="distraction-submit"
          >
            Dump
          </button>
        </form>

        {/* Dump List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[190px] pr-1 custom-scrollbar">
          {distractions.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center border border-dashed border-slate-800/60 rounded-xl text-slate-500 bg-slate-950/10">
              <Check className="w-6 h-6 stroke-1 mb-1.5 text-emerald-500" />
              <span className="text-[11px] font-mono tracking-wide text-slate-400">Mind is pristine and focused</span>
            </div>
          ) : (
            distractions.map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-slate-300"
              >
                <span className="truncate max-w-[85%]">{item}</span>
                <button
                  onClick={() => removeDistraction(idx)}
                  className="text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Clear Button */}
        {distractions.length > 0 && (
          <button
            onClick={clearDistractions}
            className="w-full py-2 border border-dashed border-slate-800/60 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 rounded-xl text-[11px] font-mono transition-all mt-3 flex items-center justify-center space-x-1.5"
            id="clear-distractions-button"
          >
            <Trash className="w-3.5 h-3.5" />
            <span>Process & Clear thought dump</span>
          </button>
        )}
      </div>
    </div>
  );

}
