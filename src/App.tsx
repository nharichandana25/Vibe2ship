/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  Sparkles, CheckSquare, Clock, BookOpen, PenTool, Flame, 
  Plus, Calendar, Trash, Check, AlertTriangle, Play, Brain,
  ChevronRight, RefreshCw, Layers, ArrowLeft, ArrowRight,
  User, CheckCircle, Info, ExternalLink, HelpCircle, Sun, Moon
} from 'lucide-react';
import { Task, Flashcard, FlashcardSet, Note, Habit, FocusSession, ProductivityRecommendation } from './types';
import FocusPomodoro from './components/FocusPomodoro';
import SocratesCoach from './components/SocratesCoach';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'flashcards' | 'notes' | 'habits' | 'coach'>('dashboard');

  // Global Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('studyflow_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('studyflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // --- CORE DATA STATE (with localStorage persistence) ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('studyflow_tasks');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: '1',
        title: 'Draft Executive Summary for Project Zen',
        description: 'Prepare final project report outlining the machine learning model output and key user metrics.',
        deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hrs from now
        priority: 'high',
        status: 'todo',
        pomodorosSpent: 1,
        pomodorosEstimated: 3,
        studyRelated: true,
        category: 'Project Zen',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Review Flashcards: Machine Learning Ethics',
        description: 'Go through Leitner Box 1 and 2 cards to cement key vocabulary before tomorrow.',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        status: 'doing',
        pomodorosSpent: 0,
        pomodorosEstimated: 2,
        studyRelated: true,
        category: 'Computer Science',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>(() => {
    const saved = localStorage.getItem('studyflow_flashcards');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'set-1',
        title: 'AI & Machine Learning Fundamentals',
        description: 'Core concepts, algorithms, and active recall cues for exam preparation.',
        createdAt: new Date().toISOString(),
        cards: [
          {
            id: 'card-1',
            front: 'What is the primary difference between Supervised and Unsupervised Learning?',
            back: 'Supervised learning trains on labeled input-output data pairs to predict outcomes. Unsupervised learning models learn patterns, groupings, or clusters directly from unlabeled datasets.',
            box: 1,
            nextReviewDate: new Date().toISOString()
          },
          {
            id: 'card-2',
            front: 'What is Overfitting in ML and how do we prevent it?',
            back: 'Overfitting happens when a model learns the training data noise rather than general signals. Prevent with regularization (L1/L2), early stopping, dropout, or expanding training data.',
            box: 2,
            nextReviewDate: new Date().toISOString()
          },
          {
            id: 'card-3',
            front: 'What is the function of the activation function in Neural Networks?',
            back: 'It introduces non-linear properties to the neural network, allowing it to learn complex non-linear decision boundaries.',
            box: 3,
            nextReviewDate: new Date().toISOString()
          }
        ]
      }
    ];
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('studyflow_notes');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'note-1',
        title: 'Leitner Active Recall Framework',
        content: `Active recall is a highly efficient study method where the brain is tested on concepts rather than passively reading.
Combine it with the Leitner System:
1. Cards start in Box 1.
2. Correct recall moves them up a box (Box 2). Incorrect moves them back to Box 1.
3. Box 1 reviewed daily, Box 2 every 2 days, Box 3 every 5 days, etc.`,
        category: 'Study Strategy',
        updatedAt: new Date().toISOString(),
        flashcardsGenerated: true
      }
    ];
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('studyflow_habits');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'hab-1', name: '25m Deep Work Pomodoro', streak: 3, completedDays: [new Date().toISOString().split('T')[0]], createdAt: new Date().toISOString() },
      { id: 'hab-2', name: 'Leitner Active Recall Deck Review', streak: 2, completedDays: [], createdAt: new Date().toISOString() },
      { id: 'hab-3', name: 'Mindful Study Goal Setting', streak: 0, completedDays: [], createdAt: new Date().toISOString() }
    ];
  });

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    const saved = localStorage.getItem('studyflow_focus_sessions');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [recommendations, setRecommendations] = useState<ProductivityRecommendation[]>([
    {
      id: 'rec-1',
      type: 'prioritization',
      title: 'Cognitive Peak Window Active Now',
      description: 'Your neural focus patterns suggest this morning is ideal for deep learning. We suggest tackling your "Draft Executive Summary" now.',
      actionLabel: 'Launch Pomodoro Focus',
      suggestedAction: 'start-focus'
    }
  ]);

  const [activeTaskId, setActiveTaskId] = useState<string | null>('1');
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState('Study');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

  const [newHabitName, setNewHabitName] = useState('');

  // Flashcards study modes
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyComplete, setStudyComplete] = useState(false);
  const [activeSetTitle, setActiveSetTitle] = useState('');
  const [activeSetDesc, setActiveSetDesc] = useState('');

  // Save states to localStorage when they change
  useEffect(() => {
    localStorage.setItem('studyflow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('studyflow_flashcards', JSON.stringify(flashcardSets));
  }, [flashcardSets]);

  useEffect(() => {
    localStorage.setItem('studyflow_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('studyflow_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('studyflow_focus_sessions', JSON.stringify(focusSessions));
  }, [focusSessions]);

  // Fetch AI Proactive Recommendations
  const fetchAIRecommendations = async () => {
    setRecommendationsLoading(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasks.filter(t => t.status !== 'done'),
          habits,
          focusSessions
        })
      });
      if (!res.ok) throw new Error('Failed to load personalized AI advice.');
      const data = await res.json();
      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
      }
    } catch (err: any) {
      console.warn("Could not load AI recommendations:", err.message);
      setErrorBanner("Note: Socrates offline advice activated. Enter your GEMINI_API_KEY in Secrets to power proactive real-time recommendations.");
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // Run initial recommendations on mount
  useEffect(() => {
    fetchAIRecommendations();
  }, []);

  // --- ACTIONS & MUTATORS ---

  // Add Task
  const handleAddTask = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      deadline: newTaskDeadline ? new Date(newTaskDeadline).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      priority: newTaskPriority,
      status: 'todo',
      pomodorosSpent: 0,
      pomodorosEstimated: 2,
      studyRelated: true,
      category: newTaskCategory || 'General',
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [task, ...prev]);
    
    // Auto-select as active if none is selected
    if (!activeTaskId) {
      setActiveTaskId(task.id);
    }

    // Reset fields
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskPriority('medium');
    setNewTaskCategory('General');
    setNewTaskDeadline('');
    
    // Refresh recommendations
    setTimeout(() => fetchAIRecommendations(), 800);
  };

  // Quick Add Task via Socrates Suggestion Callback
  const handleQuickAddTask = (title: string, priority: 'low' | 'medium' | 'high', category: string) => {
    const task: Task = {
      id: `task-ai-${Date.now()}`,
      title,
      description: 'Suggested proactively by Socrates Study Coach.',
      deadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      priority,
      status: 'todo',
      pomodorosSpent: 0,
      pomodorosEstimated: 2,
      studyRelated: true,
      category: category || 'Study Advice',
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [task, ...prev]);
    setActiveTaskId(task.id);
  };

  // Delete Task
  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
  };

  // Change Task Status / Complete
  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'done' ? 'todo' : 'done';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // Set Task as Active Focus Target
  const handleSetTargetTask = (id: string) => {
    setActiveTaskId(id);
    setActiveTab('dashboard'); // Switch to main dashboard with the Pomodoro widget
  };

  // Increment Pomodoro Completed for Active Task
  const handleIncrementPomodoro = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, pomodorosSpent: t.pomodorosSpent + 1 };
      }
      return t;
    }));
  };

  // Log Focus Session
  const handleLogFocusSession = (taskId: string | null, durationMinutes: number) => {
    const session: FocusSession = {
      id: Date.now().toString(),
      taskId,
      durationMinutes,
      timestamp: new Date().toISOString(),
      completed: true
    };
    setFocusSessions(prev => [session, ...prev]);

    // Also auto check habit completions if focused for full pomodoro
    if (durationMinutes >= 20) {
      handleCompleteHabit('hab-1'); // 25m Deep Work habit
    }
  };

  // Smart AI Subtask Breakdown API Call
  const [subtasksLoadingId, setSubtasksLoadingId] = useState<string | null>(null);
  const handleSuggestSubtasks = async (task: Task) => {
    setSubtasksLoadingId(task.id);
    try {
      const res = await fetch('/api/ai/suggest-subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          taskDescription: task.description
        })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (data.subtasks && data.subtasks.length > 0) {
        // Construct detailed subtask guidelines in task's description
        const subtaskFormatted = data.subtasks.map((st: any) => `• [ ] ${st.title} (${st.estimatedPomodoros} Pomodoros estimated)`).join('\n');
        setTasks(prev => prev.map(t => {
          if (t.id === task.id) {
            return {
              ...t,
              description: `${t.description ? t.description + '\n\n' : ''}🧠 AI STUDY WORKFLOW STEPS:\n${subtaskFormatted}`
            };
          }
          return t;
        }));
        alert(`🔮 AI breakdown completed for "${task.title}"! Subtasks have been added to its description.`);
      }
    } catch (err) {
      alert("AI subtask suggest failed. Configure your GEMINI_API_KEY to enable smart milestone planning.");
    } finally {
      setSubtasksLoadingId(null);
    }
  };

  // --- FLASHCARD ACTIVE RECALL (LEITNER BOX SYSTEM) ---

  // Handle deck creation
  const handleCreateDeck = (e: FormEvent) => {
    e.preventDefault();
    if (!activeSetTitle.trim()) return;

    const newSet: FlashcardSet = {
      id: `deck-${Date.now()}`,
      title: activeSetTitle.trim(),
      description: activeSetDesc.trim() || 'Custom set of flashcards.',
      cards: [],
      createdAt: new Date().toISOString()
    };

    setFlashcardSets(prev => [...prev, newSet]);
    setActiveSetTitle('');
    setActiveSetDesc('');
    setSelectedSet(newSet);
  };

  // Handle adding card manually
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const handleAddCardManually = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSet || !newCardFront.trim() || !newCardBack.trim()) return;

    const newCard: Flashcard = {
      id: `card-${Date.now()}`,
      front: newCardFront.trim(),
      back: newCardBack.trim(),
      box: 1,
      nextReviewDate: new Date().toISOString()
    };

    setFlashcardSets(prev => prev.map(set => {
      if (set.id === selectedSet.id) {
        const updatedCards = [...set.cards, newCard];
        // Keep selected set context updated
        setSelectedSet({ ...set, cards: updatedCards });
        return { ...set, cards: updatedCards };
      }
      return set;
    }));

    setNewCardFront('');
    setNewCardBack('');
  };

  // Delete Deck
  const handleDeleteDeck = (deckId: string) => {
    setFlashcardSets(prev => prev.filter(d => d.id !== deckId));
    if (selectedSet?.id === deckId) {
      setSelectedSet(null);
    }
  };

  // AI Active Recall Generation
  const handleGenerateFlashcards = async (note: Note) => {
    setGeneratingFlashcards(true);
    try {
      const res = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: note.title, content: note.content })
      });
      if (!res.ok) throw new Error('Server returned error status');
      const data = await res.json();

      if (data.flashcards && data.flashcards.length > 0) {
        // Convert API cards to local model structure
        const generated: Flashcard[] = data.flashcards.map((fc: any, index: number) => ({
          id: `ai-card-${Date.now()}-${index}`,
          front: fc.front,
          back: fc.back,
          box: 1,
          nextReviewDate: new Date().toISOString()
        }));

        // Append to an existing or create a new Flashcard set
        const newSet: FlashcardSet = {
          id: `deck-ai-${Date.now()}`,
          title: `🧠 AI Set: ${note.title}`,
          description: `Automatically compiled from notes regarding "${note.title}" for Active Recall.`,
          createdAt: new Date().toISOString(),
          cards: generated
        };

        setFlashcardSets(prev => [...prev, newSet]);
        setNotes(prev => prev.map(n => n.id === note.id ? { ...n, flashcardsGenerated: true } : n));
        setSelectedSet(newSet);
        setActiveTab('flashcards');
        alert(`🎓 Proactive Active Recall! AI successfully analyzed your note and synthesized ${generated.length} high-quality flashcards under a new set!`);
      }
    } catch (err: any) {
      alert("Failed to synthesize flashcards automatically. Please check your GEMINI_API_KEY.");
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  // Review & Answer Leitner Box Logic
  const handleReviewResult = (wasCorrect: boolean) => {
    if (!selectedSet) return;
    
    const currentCard = selectedSet.cards[currentCardIndex];
    let nextBox = currentCard.box;
    
    if (wasCorrect) {
      // Correct moves up to maximum box 5
      nextBox = Math.min(5, currentCard.box + 1);
    } else {
      // Incorrect pushes card all the way back to Box 1 for rapid active recall
      nextBox = 1;
    }

    // Schedule next review dates based on Leitner frequencies
    // Box 1: immediate, Box 2: +1 day, Box 3: +3 days, Box 4: +7 days, Box 5: +14 days
    const daysToAdd = nextBox === 1 ? 0 : nextBox === 2 ? 1 : nextBox === 3 ? 3 : nextBox === 4 ? 7 : 14;
    const nextReviewDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

    const updatedCards = selectedSet.cards.map((c, idx) => {
      if (idx === currentCardIndex) {
        return {
          ...c,
          box: nextBox,
          nextReviewDate,
          lastResult: wasCorrect ? 'correct' as const : 'incorrect' as const
        };
      }
      return c;
    });

    // Update state & save
    setFlashcardSets(prev => prev.map(set => {
      if (set.id === selectedSet.id) {
        return { ...set, cards: updatedCards };
      }
      return set;
    }));

    setSelectedSet({ ...selectedSet, cards: updatedCards });

    // Progress to next card
    if (currentCardIndex < selectedSet.cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Finished set
      setStudyComplete(true);
      // Log review habit completion
      handleCompleteHabit('hab-2');
    }
  };

  const startStudyingSet = (set: FlashcardSet) => {
    setSelectedSet(set);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setStudyComplete(false);
  };

  // --- HABIT TRACKING ---

  // Create custom habit
  const handleAddHabit = (e: FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const habit: Habit = {
      id: `hab-${Date.now()}`,
      name: newHabitName.trim(),
      streak: 0,
      completedDays: [],
      createdAt: new Date().toISOString()
    };

    setHabits(prev => [...prev, habit]);
    setNewHabitName('');
  };

  // Complete habit for today
  const handleCompleteHabit = (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        if (h.completedDays.includes(todayStr)) {
          // Already completed, toggle off
          return {
            ...h,
            streak: Math.max(0, h.streak - 1),
            completedDays: h.completedDays.filter(d => d !== todayStr)
          };
        } else {
          // Complete today
          return {
            ...h,
            streak: h.streak + 1,
            completedDays: [...h.completedDays, todayStr]
          };
        }
      }
      return h;
    }));
  };

  // Delete Habit
  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // --- NOTES SECTION ---

  // Create custom note
  const handleCreateNote = (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const note: Note = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      category: newNoteCategory || 'Study',
      updatedAt: new Date().toISOString(),
      flashcardsGenerated: false
    };

    setNotes(prev => [note, ...prev]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteCategory('Study');
    setSelectedNote(note);
  };

  // Save changes to selected note
  const handleUpdateNote = (id: string, updatedContent: string) => {
    setNotes(prev => prev.map(n => {
      if (n.id === id) {
        return {
          ...n,
          content: updatedContent,
          updatedAt: new Date().toISOString()
        };
      }
      return n;
    }));
    if (selectedNote && selectedNote.id === id) {
      setSelectedNote(prev => prev ? { ...prev, content: updatedContent, updatedAt: new Date().toISOString() } : null);
    }
  };

  // Delete note
  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  // Count metrics for header bar
  const totalCompletedTasks = tasks.filter(t => t.status === 'done').length;
  const todayCompletedHabits = habits.filter(h => h.completedDays.includes(new Date().toISOString().split('T')[0])).length;

  return (
    <div className={`w-full min-h-screen flex overflow-hidden font-sans relative transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-[#080911] text-slate-100 dark-theme' 
        : 'bg-slate-50 text-slate-900 light-theme'
    }`} id="studyflow-application-root">
      
      {/* Ambient floating blur points */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-cyan-500/3 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* LEFT NAVIGATION RAIL: Minimalist Rail */}
      <nav className="w-20 bg-slate-900/90 border-r border-slate-800/80 backdrop-blur-md flex flex-col items-center py-8 space-y-8 shrink-0 relative z-20">
        {/* Core application brand launcher */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 cursor-pointer hover:from-indigo-600 hover:to-purple-700 hover:scale-105 transition-all duration-300"
          title="Minimalist Study Dashboard"
        >
          <div className="w-5 h-5 bg-white rounded-md transform rotate-45 flex items-center justify-center">
            <span className="w-2 h-2 bg-indigo-600 rounded-sm"></span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col space-y-6 flex-1 pt-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Dashboard Overview"
            id="nav-dashboard"
          >
            <Layers className="w-5 h-5" />
            <span className="text-[9px] mt-1 tracking-tighter">Focus</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'tasks' 
                ? 'bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Smart Priorities"
            id="nav-tasks"
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[9px] mt-1 tracking-tighter">Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'flashcards' 
                ? 'bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Leitner Active Recall Decks"
            id="nav-flashcards"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] mt-1 tracking-tighter">Decks</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'notes' 
                ? 'bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Core Study Notes & AI Flashcards Generation"
            id="nav-notes"
          >
            <PenTool className="w-5 h-5" />
            <span className="text-[9px] mt-1 tracking-tighter">Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('habits')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'habits' 
                ? 'bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Goal & Habit Tracker"
            id="nav-habits"
          >
            <Flame className="w-5 h-5" />
            <span className="text-[9px] mt-1 tracking-tighter">Habits</span>
          </button>

          <button
            onClick={() => setActiveTab('coach')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'coach' 
                ? 'bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-mono' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Socrates Study Coach Chat"
            id="nav-coach"
          >
            <Brain className="w-5 h-5 text-amber-400" />
            <span className="text-[9px] mt-1 tracking-tighter font-mono text-amber-500">Socrates</span>
          </button>
        </div>

        {/* Global Theme Toggle Button */}
        <div className="mt-auto flex flex-col items-center space-y-4">
          <button
            onClick={toggleTheme}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800/80 border-slate-700/60 text-amber-400 hover:text-amber-300 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200'
            }`}
            title={theme === 'dark' ? "Switch to Focus Light Theme" : "Switch to Deep Night Theme"}
            id="theme-toggle-button"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* Sync indicator */}
          <div className="w-10 h-10 bg-slate-800/80 border border-slate-700/60 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors" title="Julian (nharichandana25@gmail.com)">
            <span className="text-xs font-bold font-mono text-slate-200">NH</span>
          </div>
        </div>
      </nav>

      {/* MAIN LAYOUT CANVAS */}
      <main className="flex-1 flex flex-col overflow-y-auto h-screen relative z-10 custom-scrollbar">
        
        {/* TOP STATUS HEADER */}
        <header className="h-20 bg-slate-900/40 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between shrink-0 relative z-10">
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight font-display">Active Recall Study Companion</h1>
            <p className="text-xs text-slate-400 font-medium">
              Proactive planning, Pomodoro focus cycles, and Leitner box spacing.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Metrics */}
            <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
              <span className="px-2.5 py-1 bg-slate-850 text-slate-300 border border-slate-800/80 rounded-lg">
                🏆 Tasks: <strong className="text-indigo-400">{totalCompletedTasks}/{tasks.length}</strong> Completed
              </span>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                ⚡ Habits: <strong className="text-amber-300">{todayCompletedHabits}</strong> Finished Today
              </span>
            </div>


            <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span>Cloud Sync & Offline Support</span>
            </div>
          </div>
        </header>

        {/* ERROR / SECRETS WARNING BANNER */}
        {errorBanner && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-8 py-2.5 text-xs text-amber-300 flex items-center justify-between relative z-10">
            <span className="flex items-center space-x-1.5 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>{errorBanner}</span>
            </span>
            <button 
              onClick={() => setErrorBanner(null)}
              className="text-amber-400 hover:text-amber-200 text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* CORE CONTAINER */}
        <div className="p-8 flex-1 max-w-7xl w-full mx-auto space-y-8" id="application-content-workspace">
          
          {/* TAB 1: FOCUS DASHBOARD (SLEEK THEME PEAK WORK) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in" id="dashboard-tab-content">
              
              {/* AI Insight Hero Alert Card */}
              <div className="bg-gradient-to-br from-indigo-950/80 via-purple-950/50 to-slate-950/90 rounded-2xl p-6 text-white border border-indigo-500/25 shadow-[0_4px_30px_rgba(99,102,241,0.15)] relative overflow-hidden backdrop-blur-md">
                <div className="relative z-10">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <span className="text-xs font-mono tracking-widest text-indigo-300 uppercase">Proactive AI Recommendation</span>
                  </div>
                  
                  {recommendations.length > 0 ? (
                    <div>
                      <h2 className="text-2xl font-light mb-1 font-display">
                        Peak State: <span className="font-bold text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">{recommendations[0].title}</span>
                      </h2>
                      <p className="text-slate-300 text-sm max-w-2xl mb-4 leading-relaxed font-sans">
                        {recommendations[0].description}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-2xl font-light mb-1 font-display">Optimal Deep Work Opportunity</h2>
                      <p className="text-slate-300 text-sm max-w-lg mb-4 leading-relaxed font-sans">
                        Initialize a 25-minute Pomodoro study window to achieve cognitive absorption.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => {
                        const firstTask = tasks.find(t => t.status !== 'done');
                        if (firstTask) {
                          setActiveTaskId(firstTask.id);
                        }
                        const pmd = document.getElementById('pomodoro-focus-container');
                        if (pmd) pmd.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white hover:scale-[1.02] active:scale-100 transition-all text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 font-mono tracking-wide"
                    >
                      START DEEP WORK BLOCK
                    </button>
                    
                    <button
                      onClick={fetchAIRecommendations}
                      disabled={recommendationsLoading}
                      className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700/60"
                      title="Update advice based on progress"
                      id="update-ai-recommendations"
                    >
                      <RefreshCw className={`w-4 h-4 ${recommendationsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
              </div>

              {/* Main Split Layout: Left Pomodoro Focus Arena, Right Task Focus selection */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Pomodoro Focus Panel & Distraction Notepad */}
                <div className="lg:col-span-8 space-y-6">
                  <FocusPomodoro 
                    tasks={tasks}
                    activeTaskId={activeTaskId}
                    onIncrementPomodoro={handleIncrementPomodoro}
                    onLogFocusSession={handleLogFocusSession}
                  />
                </div>

                {/* 2. Right Rail - Select Target Objective & Socrates Snippet */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Smart active task choosing list */}
                  <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800/60 mb-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Objectives Arena</h3>
                      <button 
                        onClick={() => setActiveTab('tasks')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        Manage
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      Choose an objective from your active task sheet to tie directly into your Pomodoro timers.
                    </p>

                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar">
                      {tasks.filter(t => t.status !== 'done').length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500 italic font-mono">
                          No pending tasks. Create one to begin focus loops!
                        </div>
                      ) : (
                        tasks.filter(t => t.status !== 'done').map(task => (
                          <div 
                            key={task.id}
                            onClick={() => setActiveTaskId(task.id)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              activeTaskId === task.id 
                                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200 shadow-md shadow-indigo-500/5' 
                                : 'bg-slate-950/40 border-slate-850 hover:border-slate-700/60 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold truncate max-w-[170px]">{task.title}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800/60">
                                {task.pomodorosSpent} 🍅
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                              <span>{task.category}</span>
                              <span className={`font-semibold uppercase ${
                                task.priority === 'high' ? 'text-rose-400 animate-pulse' : task.priority === 'medium' ? 'text-amber-400' : 'text-slate-400'
                              }`}>{task.priority}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Daily Habits quick completions widget */}
                  <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-display">Daily Study Habits</h3>
                    <div className="space-y-2">
                      {habits.slice(0, 3).map(hab => {
                        const completedToday = hab.completedDays.includes(new Date().toISOString().split('T')[0]);
                        return (
                          <div 
                            key={hab.id}
                            onClick={() => handleCompleteHabit(hab.id)}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/60 hover:bg-slate-800/40 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`p-1 rounded ${completedToday ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950/60 text-slate-600 border border-slate-850'}`}>
                                <Check className="w-3.5 h-3.5" />
                              </div>
                              <span className={`text-xs ${completedToday ? 'line-through text-slate-500 font-normal' : 'text-slate-200 font-medium'}`}>
                                {hab.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono font-bold shrink-0">
                              🔥 {hab.streak}d
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: SMART TASKS & PRIORITIES SHEET */}
          {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="tasks-tab-content">
              
              {/* Left Form Panel */}
              <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg h-fit">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider pb-3 border-b border-slate-800/60 mb-4 font-display">
                  Add Study Task
                </h3>
                
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Task Title *</label>
                    <input
                      type="text"
                      required
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Master Bayes Theorem formulas"
                      className="w-full px-3.5 py-2 text-sm bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/10 text-slate-100 placeholder-slate-600 font-sans"
                      id="task-form-title"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description / Goals</label>
                    <textarea
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="e.g. Write down the posterior probabilities. Link to chapter 3 slides."
                      className="w-full h-20 px-3.5 py-2 text-sm bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/10 text-slate-100 placeholder-slate-600 font-sans resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Priority</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none text-slate-300"
                      >
                        <option value="low" className="bg-slate-950 text-slate-300">Low Priority</option>
                        <option value="medium" className="bg-slate-950 text-slate-300">Medium Priority</option>
                        <option value="high" className="bg-slate-950 text-slate-300">High Priority</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Category</label>
                      <input
                        type="text"
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value)}
                        placeholder="e.g. Math, General"
                        className="w-full px-3 py-2 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none text-slate-100 placeholder-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Deadline Date & Time</label>
                    <input
                      type="datetime-local"
                      value={newTaskDeadline}
                      onChange={(e) => setNewTaskDeadline(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none text-slate-100 placeholder-slate-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl text-xs tracking-wider uppercase shadow-lg shadow-indigo-500/10 hover:scale-[1.01] active:scale-100 transition-all flex items-center justify-center space-x-1"
                    id="submit-task-button"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create & Schedule</span>
                  </button>
                </form>
              </div>

              {/* Right Tasks Grid List */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-display">
                    Study Priorities & Scheduled Milestones
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Total: <strong>{tasks.length}</strong>
                  </span>
                </div>

                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md p-8 rounded-2xl text-center text-slate-500 italic font-mono">
                      No current tasks. Add your study goals on the left to begin active tracking!
                    </div>
                  ) : (
                    tasks.map(task => {
                      const isOverdue = new Date(task.deadline).getTime() < Date.now() && task.status !== 'done';
                      return (
                        <div 
                          key={task.id}
                          className={`bg-slate-900/40 border backdrop-blur-sm rounded-xl p-4 transition-all duration-300 hover:border-slate-700/60 ${
                            task.status === 'done' ? 'opacity-55 border-slate-850' : 'border-slate-800/80 shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between space-x-4">
                            <div className="flex items-start space-x-3.5">
                              {/* Complete Task Circle Checkbox */}
                              <button
                                onClick={() => toggleTaskStatus(task.id)}
                                className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center mt-1 shrink-0 transition-all cursor-pointer ${
                                  task.status === 'done' 
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                    : 'border-slate-700 hover:border-indigo-500 hover:bg-slate-800/30'
                                }`}
                                title="Toggle Complete Status"
                              >
                                {task.status === 'done' && <Check className="w-3.5 h-3.5" />}
                              </button>

                              <div>
                                <h4 className={`text-sm font-semibold ${
                                  task.status === 'done' ? 'line-through text-slate-500 font-normal' : 'text-slate-100'
                                }`}>
                                  {task.title}
                                </h4>
                                
                                {task.description && (
                                  <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap font-sans leading-relaxed">
                                    {task.description}
                                  </p>
                                )}

                                {/* Metadata metrics */}
                                <div className="flex flex-wrap items-center gap-2 mt-3.5 text-[10px] font-mono">
                                  <span className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800/60 rounded font-bold uppercase">
                                    {task.category}
                                  </span>
                                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded">
                                    🍅 {task.pomodorosSpent} pomodoros spent
                                  </span>
                                  
                                  {/* Deadline check */}
                                  <span className={`px-2 py-0.5 rounded border flex items-center space-x-1 ${
                                    isOverdue 
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold animate-pulse' 
                                      : 'bg-slate-950 text-slate-400 border border-slate-800/60'
                                  }`}>
                                    <Calendar className="w-3 h-3" />
                                    <span>Due: {new Date(task.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions Column */}
                            <div className="flex items-center space-x-2 shrink-0">
                              {task.status !== 'done' && (
                                <button
                                  onClick={() => handleSetTargetTask(task.id)}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono border transition-all cursor-pointer ${
                                    activeTaskId === task.id 
                                      ? 'bg-amber-500 text-slate-950 border-transparent shadow-[0_0_12px_rgba(245,158,11,0.25)]' 
                                      : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-white'
                                  }`}
                                >
                                  {activeTaskId === task.id ? 'ACTIVE' : 'ACTIVATE'}
                                </button>
                              )}

                              {/* Smart break down suggestions with Gemini */}
                              {task.status !== 'done' && (
                                <button
                                  onClick={() => handleSuggestSubtasks(task)}
                                  disabled={subtasksLoadingId === task.id}
                                  className="px-2 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-xl border border-indigo-500/20 flex items-center space-x-1 cursor-pointer"
                                  title="Proactively schedule sub-milestones with AI"
                                >
                                  <Sparkles className={`w-3 h-3 text-indigo-400 ${subtasksLoadingId === task.id ? 'animate-spin' : ''}`} />
                                  <span>{subtasksLoadingId === task.id ? 'Analyzing...' : 'AI Milestones'}</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-800/40 transition-colors cursor-pointer"
                                title="Remove task"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: LEITNER ACTIVE RECALL SYSTEM (FLASHCARDS) */}
          {activeTab === 'flashcards' && (
            <div className="space-y-6 animate-fade-in" id="flashcards-tab-content">
              
              {/* Deck choosing or active study panel */}
              {selectedSet && !studyComplete ? (
                /* ACTIVE STUDY SCREEN */
                <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg max-w-2xl mx-auto">
                  {/* Header info */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-6">
                    <button 
                      onClick={() => setSelectedSet(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 font-semibold cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Decks</span>
                    </button>
                    <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2.5 py-1 rounded">
                      DECK: {selectedSet.title.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Card {currentCardIndex + 1} of {selectedSet.cards.length}
                    </span>
                  </div>

                  {/* Flashcard Area */}
                  {selectedSet.cards.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                      <p className="text-sm">This deck has no cards yet.</p>
                      <p className="text-xs text-slate-400 mt-1">Add cards below or auto-generate them from study notes!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Interactive Flip Card Canvas */}
                      <div 
                        onClick={() => setShowAnswer(!showAnswer)}
                        className={`min-h-[220px] bg-slate-950/40 rounded-2xl p-6 border border-slate-850 hover:border-indigo-500/50 flex flex-col justify-between cursor-pointer hover:bg-slate-950/60 transition-all duration-300 text-center relative shadow-inner ${
                          showAnswer ? 'border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : ''
                        }`}
                      >
                        <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase block mb-2">
                          {showAnswer ? '🎯 ACTIVE RECALL ANSWER (BACK)' : '❓ MEMORY PROMPT (FRONT)'}
                        </span>

                        <div className="my-auto">
                          <p className={`text-base font-semibold leading-relaxed font-display ${showAnswer ? 'text-indigo-200' : 'text-slate-100'}`}>
                            {showAnswer ? selectedSet.cards[currentCardIndex].back : selectedSet.cards[currentCardIndex].front}
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Leitner Box {selectedSet.cards[currentCardIndex].box}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Tap Card To Flip
                          </span>
                        </div>
                      </div>

                      {/* Recall Results Controllers */}
                      {showAnswer ? (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-400 text-center font-mono">
                            Assess your cognitive recall honestly. Be strict with yourself!
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => handleReviewResult(false)}
                              className="py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                              id="review-failed-button"
                            >
                              ❌ Forgot / Incorrect
                            </button>
                            <button
                              onClick={() => handleReviewResult(true)}
                              className="py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 transition-colors cursor-pointer"
                              id="review-correct-button"
                            >
                              ✅ Recalled Perfectly!
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAnswer(true)}
                          className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/15 cursor-pointer"
                          id="reveal-card-button"
                        >
                          Show Answer & Assess Recall
                        </button>
                      )}
                    </div>
                  )}

                  {/* Add manual cards form inside studied deck */}
                  <div className="mt-8 pt-6 border-t border-slate-800/60">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-display">
                      Add Flashcard manually to this set
                    </h4>
                    <form onSubmit={handleAddCardManually} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={newCardFront}
                        onChange={(e) => setNewCardFront(e.target.value)}
                        placeholder="Front question/prompt..."
                        className="px-3.5 py-2 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-indigo-500/40 text-slate-100 placeholder-slate-600 font-sans"
                      />
                      <div className="flex space-x-1.5">
                        <input
                          type="text"
                          required
                          value={newCardBack}
                          onChange={(e) => setNewCardBack(e.target.value)}
                          placeholder="Back explanation/answer..."
                          className="flex-1 px-3.5 py-2 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-indigo-500/40 text-slate-100 placeholder-slate-600 font-sans"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
                        >
                          Add Card
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              ) : studyComplete ? (
                /* STUDY COMPLETE SCREEN */
                <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-8 shadow-lg max-w-md mx-auto text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 font-display">Recall Set Complete!</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-sans">
                    Splendid job! You have gone through all the active recall cards in this set.
                    Correctly recalled cards have graduated to higher Leitner boxes for delayed repetition.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setSelectedSet(null);
                        setStudyComplete(false);
                      }}
                      className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider shadow-md cursor-pointer"
                    >
                      Return to Decks
                    </button>
                  </div>
                </div>
              ) : (
                /* DECKS OVERVIEW */
                <div className="space-y-6">
                  {/* Create Set Header form */}
                  <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100 font-display">Leitner Active Recall Deck Library</h3>
                      <p className="text-xs text-slate-400">
                        Create focused decks to trigger long-term brain retention.
                      </p>
                    </div>
                    <form onSubmit={handleCreateDeck} className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      <input
                        type="text"
                        required
                        value={activeSetTitle}
                        onChange={(e) => setActiveSetTitle(e.target.value)}
                        placeholder="Deck title (e.g. History)"
                        className="px-3.5 py-1.5 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-indigo-500/40 text-slate-100 placeholder-slate-600"
                        id="new-deck-title"
                      />
                      <input
                        type="text"
                        value={activeSetDesc}
                        onChange={(e) => setActiveSetDesc(e.target.value)}
                        placeholder="Short description..."
                        className="px-3.5 py-1.5 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-indigo-500/40 text-slate-100 placeholder-slate-600"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow"
                        id="create-deck-submit"
                      >
                        Create Deck
                      </button>
                    </form>
                  </div>

                  {/* Decks Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flashcardSets.map(set => (
                      <div 
                        key={set.id}
                        className="bg-slate-900/40 border border-slate-800/85 hover:border-indigo-500/30 hover:scale-[1.01] transition-all duration-300 rounded-2xl p-5 shadow-lg backdrop-blur-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-semibold text-slate-100 font-display truncate max-w-[170px]">
                              {set.title}
                            </h4>
                            <button
                              onClick={() => handleDeleteDeck(set.id)}
                              className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                              title="Delete Deck"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed mb-4 max-h-16 overflow-y-auto custom-scrollbar">
                            {set.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
                          <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded font-bold">
                            {set.cards.length} Cards
                          </span>
                          <button
                            onClick={() => startStudyingSet(set)}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all text-white text-xs font-bold rounded-xl uppercase font-mono tracking-wider cursor-pointer shadow"
                          >
                            Study Recall
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: STUDY NOTEPAD & AUTO FLASHCARD SYNTHESIS */}
          {activeTab === 'notes' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="notes-tab-content">
              
              {/* Left sidebar: Note catalog */}
              <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg space-y-4">
                <div className="pb-3 border-b border-slate-800/60">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Note Catalogs</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Save summaries to create instant AI active recall decks!</p>
                </div>

                {/* Form to create new note */}
                <form onSubmit={handleCreateNote} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="New Note title..."
                    className="w-full px-3.5 py-1.5 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-indigo-500/40 text-slate-100 placeholder-slate-600"
                    id="new-note-title"
                  />
                  <textarea
                    required
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Type or paste study materials..."
                    className="w-full h-24 px-3.5 py-2 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-indigo-500/40 text-slate-100 placeholder-slate-600 resize-none font-sans"
                  />
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      value={newNoteCategory}
                      onChange={(e) => setNewNoteCategory(e.target.value)}
                      placeholder="Category..."
                      className="flex-1 px-3.5 py-1.5 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-indigo-500/40 text-slate-100 placeholder-slate-600"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer shadow"
                    >
                      Save Note
                    </button>
                  </div>
                </form>

                {/* List notes */}
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {notes.map(note => (
                    <div
                      key={note.id}
                      onClick={() => setSelectedNote(note)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                        selectedNote?.id === note.id 
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200 font-semibold shadow-[0_0_12px_rgba(99,102,241,0.1)]' 
                          : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs truncate max-w-[170px]">{note.title}</span>
                        <span className="text-[9px] font-mono bg-slate-950/65 text-slate-500 border border-slate-850 px-1.5 py-0.5 rounded">
                          {note.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Viewport: Note Detail Editor and Flashcards auto syntheses trigger */}
              <div className="lg:col-span-8">
                {selectedNote ? (
                  <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg space-y-6">
                    <div className="flex justify-between items-start pb-4 border-b border-slate-800/60">
                      <div>
                        <span className="text-[10px] text-indigo-300 font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">
                          Note Detail: {selectedNote.category}
                        </span>
                        <h4 className="text-lg font-bold text-slate-100 font-display mt-1">{selectedNote.title}</h4>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Auto-generate Trigger */}
                        <button
                          onClick={() => handleGenerateFlashcards(selectedNote)}
                          disabled={generatingFlashcards}
                          className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-lg shadow-indigo-500/15 transition-all disabled:opacity-50 cursor-pointer"
                          id="auto-generate-flashcards-btn"
                        >
                          <Sparkles className={`w-4 h-4 text-indigo-200 ${generatingFlashcards ? 'animate-spin' : ''}`} />
                          <span>{generatingFlashcards ? 'Synthesizing...' : '🧠 AI Auto-Recall Decks'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteNote(selectedNote.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-800/40 transition-colors cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-mono font-bold text-slate-400 uppercase">
                        Study Content:
                      </label>
                      <textarea
                        value={selectedNote.content}
                        onChange={(e) => handleUpdateNote(selectedNote.id, e.target.value)}
                        placeholder="Write note summaries here..."
                        className="w-full h-80 px-4 py-3 text-sm bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-indigo-500/40 text-slate-100 font-sans leading-relaxed resize-none"
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-mono text-slate-500">
                      <span>Updated: {new Date(selectedNote.updatedAt).toLocaleString()}</span>
                      {selectedNote.flashcardsGenerated && (
                        <span className="text-emerald-400 font-bold">✓ Active recall cards compiled</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-12 text-center text-slate-500 italic font-mono">
                    Select a note catalog on the left, or create a brand new note to trigger intelligent AI flashcard synthesis.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: HABITS GOAL SHEETS */}
          {activeTab === 'habits' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="habits-tab-content">
              
              {/* Left Column: Create Habits */}
              <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg h-fit">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider pb-3 border-b border-slate-800/60 mb-4 font-display">
                  Track Daily Study Habit
                </h3>
                <form onSubmit={handleAddHabit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Habit / Action Name</label>
                    <input
                      type="text"
                      required
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      placeholder="e.g. Solve 3 Leetcode questions"
                      className="w-full px-3.5 py-2 text-sm bg-slate-950/60 border border-slate-800/80 rounded-xl focus:outline-none focus:border-indigo-500/40 text-slate-100 placeholder-slate-600"
                      id="habit-form-name"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/10 cursor-pointer"
                  >
                    Add Habit Goal
                  </button>
                </form>

                <div className="mt-6 border-t border-slate-800/60 pt-4 text-xs text-slate-400 leading-relaxed space-y-2">
                  <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold">
                    <Info className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span className="font-display">Mindful Repetition Habit Principle</span>
                  </div>
                  <p>
                    Long-term knowledge acquisition isn't accomplished overnight. Consistent active recall habit repetitions strengthen your synaptic memory bounds. Completing Pomodoro sessions auto-ticks study habits!
                  </p>
                </div>
              </div>

              {/* Right Column: Habits List tracker */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-display">
                    Your Long-Term Cognitive Habits
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Streak System</span>
                </div>

                <div className="space-y-3">
                  {habits.map(hab => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const completedToday = hab.completedDays.includes(todayStr);
                    return (
                      <div 
                        key={hab.id}
                        className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl shadow-md flex items-center justify-between transition-all duration-300 hover:border-slate-700/60"
                      >
                        <div className="flex items-center space-x-4">
                          {/* Circle Check */}
                          <button
                            onClick={() => handleCompleteHabit(hab.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                              completedToday 
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                                : 'border-slate-700 hover:border-emerald-500 hover:bg-slate-800/30'
                            }`}
                          >
                            {completedToday && <Check className="w-4 h-4" />}
                          </button>

                          <div>
                            <h4 className={`text-sm font-semibold ${completedToday ? 'line-through text-slate-500 font-normal' : 'text-slate-100'}`}>
                              {hab.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">
                              Total completions: {hab.completedDays.length}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <span className="px-3 py-1 bg-amber-500/10 text-amber-300 text-xs font-bold rounded-full font-mono border border-amber-500/20 flex items-center space-x-1">
                            <span>🔥</span>
                            <span>{hab.streak} Day Streak</span>
                          </span>

                          <button
                            onClick={() => handleDeleteHabit(hab.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: SOCRATES COACH COMPANION */}
          {activeTab === 'coach' && (
            <div className="space-y-6 animate-fade-in" id="coach-tab-content">
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-lg max-w-xl mx-auto text-center space-y-2">
                <h3 className="text-sm font-semibold text-slate-100 font-display">Mindful Voice Socrates Coaching</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Speak aloud or dictate. Socrates is fine-tuned to answer study concepts, check flashcard knowledge, plan schedules, and advise on deadlines proactively. Try speech recognition below!
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <SocratesCoach 
                  tasks={tasks}
                  notes={notes}
                  onAddTask={handleQuickAddTask}
                />
              </div>
            </div>
          )}

        </div>

        {/* FOOTER METADATA / STATS */}
        <footer className="mt-auto py-6 border-t border-slate-800/60 bg-slate-950/40 px-8 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between shrink-0">
          <span>Active Recall Study System v1.1.0 • Sleek Layout Canvas</span>
          <span className="mt-2 sm:mt-0">Offline Local Cache Persistent</span>
        </footer>

      </main>

    </div>
  );
}
