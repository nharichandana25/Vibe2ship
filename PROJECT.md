# Active Recall Study Companion (AI Study Workspace)

An offline-first, highly responsive study workspace combining the psychological sciences of learning with advanced proactive cognitive assistance. By incorporating **Spaced Repetition (5-Box Leitner System)**, **Active Recall synthesis**, **Rhythmic Pomodoro Cycles**, and **Socrates Speech-Enabled AI Mentorship**, this workspace solves the "passive review trap" and organizes self-study into highly structured, actionable milestones.

---

## 📌 Problem Statement

Traditional self-study methods suffer from several critical psychological and structural pain points:
1. **The Passive Review Trap**: Rereading highlighted notes creates an *illusion of competence*. Without retrieval practice (active recall), memory decay proceeds rapidly (following Ebbinghaus' Forgetting Curve).
2. **Cognitive Fatigue & Distraction**: Long study sessions without rhythmic pacing lead to cognitive exhaustion. Extraneous thoughts ("distraction dumps") interrupt deep focus and fragment memory retention.
3. **Overwhelming Scope & Ambiguity**: Students frequently fail to start or finish large objectives because they cannot identify immediate, concrete steps (the "ambiguity block").
4. **Lack of Dynamic Feedback**: Self-studying can be isolating, leaving students without a conversational partner to audit their understanding, ask guiding questions, or explain complex ideas simply.

---

## 💡 Solution Overview

The **Active Recall Study Companion** transforms passive studying into an active, feedback-driven cycle. By consolidating essential scientific learning strategies into a single responsive cockpit, the system enforces peak cognitive habits:

*   **Active Retrieval**: Instantly compiles linear study notes into active recall question-answer flashcard decks via Google's Gemini models.
*   **Systematic Repetition**: Runs a fully integrated physical-mode **Leitner Spaced Repetition** engine. Correctly answered cards graduate to higher boxes (longer delay intervals), while forgotten cards drop back to Box 1 for immediate restudy.
*   **Structured Focus**: Integrates an adjustable Pomodoro timer equipped with native audio oscillators (bell completion) and synthesized acoustic generators (Theta wave entrainment & Pink Noise rumble) to suppress cognitive fatigue.
*   **Zero-friction Mind Clearing**: Includes a "Mind Clear Notepad" next to the timer, enabling users to offload distracting working memory tasks instantly without abandoning their focus block.
*   **Conversational Mentorship**: Introduces the **Socrates Study Coach**, a voice-enabled cognitive companion powered by the Gemini SDK. Socrates engages in structured dialogue to probe user comprehension, generate exam schedules, and test student retention dynamically.

---

## 🗺️ System Workflows & Diagrams

### 1. Active Recall Deck Synthesis Workflow
```
[ User Inputs Study Notes ]
             │
             ▼
[ Triggers AI Flashcard Generation ] ───► (Backend Proxy Server)
                                                 │
                                                 ▼
                                        (Google Gemini API)
                                                 │ (Synthesizes Q&A pairs)
                                                 ▼
                                     [ Receives JSON Cards ]
                                                 │
                                                 ▼
                                    [ Spawns Custom Study Deck ]
                                                 │
                                                 ▼
                                     [ Leitner Study Mode ]
                                        /             \
                   (User Recalls Card Correctly)     (User Forgets Card)
                                  /                     \
                                 ▼                       ▼
                       [ Graduates to Box N+1 ]     [ Degrades to Box 1 ]
```

### 2. Conversational Socrates Coach Workflow
```
             [ User Speaks / Presses Dictate Mic ]
                             │
                             ▼
              [ Web Speech Recognition (STT) ]
                             │
                             ▼
                    [ Appends Input Text ]
                             │
                             ▼
                (Backend Proxy Express Server)
                             │
                             ▼
              (Google Gemini SDK Model Call)
                             │ (Formulates structured dialogue response)
                             ▼
               [ Socrates Appends Reply Text ]
                             │
                             ▼
              [ Web Speech Synthesis (TTS) ]
                             │
                             ▼
               (Socrates Speaks Aloud to User)
```

---

## ✨ Key Features

### 1. Dual Aesthetics (Deep Night & Focus Light)
A global theme controller positioned in the primary navigation rail triggers an elegant visual inversion. The canvas transitions seamlessly between an atmospheric space-focused dark cockpit (`#080911` with neon-indigo accents) and a pristine, high-contrast `#f8fafc` light desk designed for daytime visual comfort. 

### 2. Spaced Repetition Flashcard Engine (Leitner System)
*   **Multi-Box Progression**: Fully implements five boxes. 
*   **Manual & Synthesized Cards**: Allows cards to be compiled dynamically using AI on a chosen text note or added manually with direct Q&A parameters.
*   **Detailed Analytics**: Tracks precise current-box graduation status and study progress counters.

### 3. Deep Focus Pomodoro Stage & Soundscape Synthesizer
*   **Interactive Timer Circle**: A highly detailed SVG progress ring displaying responsive active states.
*   **Binaural Theta Entrainment**: Synthesizes a 7Hz wave offset in the browser using twin AudioContext oscillators to promote neuro-cognitive focus.
*   **Pink Noise Rain Rumble**: Synthesizes high-density stochastic pink noise to isolate ambient auditory distractions.
*   **Objective Tie-in**: Automatically pairs with your "Active Task" in the Priorities list to track and increment Pomodoros spent on specific objectives.

### 4. Smart Priorities with AI Sub-milestone Scheduling
*   **Dynamic Task Board**: Tasks are styled with custom deadline overdue alerts, categories, and priority weights (High/Medium/Low).
*   **AI Milestones**: Users can click the "AI Milestones" button on any complex task, sending its properties to Gemini. The model replies with a highly targeted, numbered breakdown of sub-objectives, allowing the user to schedule actionable subtasks instantly.

---

## 🛠️ Technologies Used

*   **Frontend**: React 18 with Vite, TypeScript 5.
*   **Styling**: Tailwind CSS (Utility classes, Custom dark theme overrides, fluid containers, CSS transitions).
*   **Audio Engine**: Web Audio API (native gain nodes, low-frequency oscillators, and noise-shaping buffers).
*   **Speech Framework**: HTML5 Web Speech API (`SpeechRecognition` for input dictation, `SpeechSynthesis` with rate/pitch control for natural vocal output).
*   **Backend Server**: Node.js, Express.js (runs a custom API proxy with tsx execution).
*   **Deployment**: Compiled via Vite and Esbuild into a consolidated containerized environment.

---

## 🌐 Google Technologies Utilized

### 1. Google Gemini Developer API (`@google/genai` TypeScript SDK)
Deeply integrated server-side inside `server.ts` to secure credentials and coordinate all intelligent features:
*   **Socrates Coach Dialogue**: Executes conversational reasoning blocks. The engine is prompted as a cognitive mentor that encourages active reasoning and critical recall rather than direct copy-pasted answers.
*   **Recall Synthesis**: Processes long note paragraphs, stripping away passive syntax, and extracting high-value active recall flashcards in structured JSON arrays.
*   **Smart Scheduling & Advice**: Dynamically analyzes a user's current unfinished tasks, overdue deadlines, and study habit streaks, generating a concise, highly tailored "Peak State Guidance" notification at the top of the workspace dashboard.

### 2. Google Cloud Run (Container Architecture)
Hosts the multi-module Node.js express server and serves high-performance client assets with scalable ingress handling.
