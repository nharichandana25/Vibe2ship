/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Lazy initialization of the Gemini API client to prevent crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      throw new Error('GEMINI_API_KEY environment variable is not configured in the Secrets panel.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with a limit for larger notes
  app.use(express.json({ limit: '10mb' }));

  // Helper to handle API errors and return clean messages
  const handleError = (res: express.Response, error: any, customMessage: string) => {
    console.error(`${customMessage}:`, error);
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error occurred.',
    });
  };

  // HEALTH CHECK
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasApiKey: !!process.env.GEMINI_API_KEY });
  });

  // AI ENDPOINT: PROACTIVE RECOMMENDATIONS & PRIORITIZATION
  app.post('/api/ai/recommendations', async (req, res) => {
    try {
      const { tasks = [], habits = [], focusSessions = [] } = req.body;
      const ai = getGeminiClient();

      const userContextStr = `
        Current Tasks: ${JSON.stringify(tasks)}
        Daily Habits: ${JSON.stringify(habits)}
        Recent Focus Sessions (last few): ${JSON.stringify(focusSessions.slice(0, 10))}
        Current Local Time: ${new Date().toISOString()}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Analyze the user's task list, active habits, and focus logs. Based on their deadlines, priorities, and habits, provide exactly 3 actionable, highly helpful productivity recommendations or warnings.
        The feedback must feel intelligent, warm, and highly personalized (e.g. warning about a tight deadline, recommending study methods, suggesting habit triggers, or suggesting a Pomodoro focus plan).
        Provide the response in structured JSON matching the requested format.
        
        Context data:
        ${userContextStr}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "A unique simple ID like 'rec-1', 'rec-2'" },
                    type: { type: Type.STRING, description: "One of: 'prioritization', 'scheduling', 'motivation', 'warning'" },
                    title: { type: Type.STRING, description: "Brief bold recommendation title (e.g. 'Crucial Exam Prep Action Required')" },
                    description: { type: Type.STRING, description: "Clear, encouraging, actionable advice tailored to their specific studies or tasks." },
                    actionLabel: { type: Type.STRING, description: "Optional call to action button label (e.g. 'Start Focus Session', 'Review Flashcards', 'Reschedule Task')" },
                    suggestedAction: { type: Type.STRING, description: "An action identifier e.g., 'start-focus', 'view-flashcards', 'adjust-priorities'" }
                  },
                  required: ['id', 'type', 'title', 'description']
                }
              }
            },
            required: ['recommendations']
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      handleError(res, error, 'AI Recommendations failed');
    }
  });

  // AI ENDPOINT: AUTO-GENERATE FLASHCARDS FROM NOTES (ACTIVE RECALL)
  app.post('/api/ai/generate-flashcards', async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!content || content.trim() === '') {
        return res.status(400).json({ error: true, message: 'Note content is required.' });
      }

      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Read the following study note ("${title || 'Untitled'}") and generate exactly 4-6 high-quality flashcards designed for Active Recall.
        Each card must have a clear question or prompt on the "front" and a concise, precise, high-retention answer on the "back".
        Avoid simple trivia; focus on key conceptual facts, formulas, principles, or vocab in the text.
        
        Note Content:
        ${content}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: { type: Type.STRING, description: "The active recall question or prompt for the front of the card." },
                    back: { type: Type.STRING, description: "The precise and concise answer or key points on the back." }
                  },
                  required: ['front', 'back']
                }
              }
            },
            required: ['flashcards']
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      handleError(res, error, 'AI Flashcards generation failed');
    }
  });

  // AI ENDPOINT: SMART TASK BREAKDOWN & SUGGESTIONS
  app.post('/api/ai/suggest-subtasks', async (req, res) => {
    try {
      const { taskTitle, taskDescription } = req.body;
      if (!taskTitle) {
        return res.status(400).json({ error: true, message: 'Task title is required.' });
      }

      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Break down the task "${taskTitle}" (${taskDescription || 'No description provided'}) into 3 to 5 clear, bite-sized study steps or milestones that can be tackled using Pomodoro blocks (25 mins each).
        Be direct, actionable, and state what needs to be produced or completed in each step.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Bite-sized milestone title" },
                    estimatedPomodoros: { type: Type.INTEGER, description: "Estimated Pomodoros needed (integer between 1 and 4)" }
                  },
                  required: ['title', 'estimatedPomodoros']
                }
              }
            },
            required: ['subtasks']
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      handleError(res, error, 'AI Task breakdown failed');
    }
  });

  // AI ENDPOINT: CHAT / SPEECH-ENABLED STUDY COACH
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { messages = [], tasks = [], notes = [] } = req.body;
      const ai = getGeminiClient();

      // Take last 8 messages for context to stay within token sizes efficiently
      const chatHistory = messages.slice(-8);

      const systemInstruction = `You are "Socrates", a hyper-focused, minimalist, and exceptionally wise study & productivity coach. 
      Your purpose is to help the user master active recall, plan schedules, prioritize tasks, and stay distraction-free.
      You have access to the user's current study dashboard:
      - Tasks list: ${JSON.stringify(tasks.map((t: any) => ({ title: t.title, priority: t.priority, status: t.status, deadline: t.deadline })))}
      - Active study topics/notes: ${JSON.stringify(notes.map((n: any) => n.title))}
      
      Guidelines:
      1. Keep answers remarkably concise, beautiful, and inspiring. Never write walls of text. Use bullet points.
      2. If asked to add a task, structure your reply nicely and recommend their priority or Pomodoro count.
      3. Proactively suggest Pomodoro focus sessions or Leitner active recall cards.
      4. Speak with gentle wisdom and high encouragement.
      5. (Voice-friendly) If the user is speaking, keep your responses brief and highly scannable so they are pleasant when read aloud.`;

      const contents = chatHistory.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from AI model');
      }

      res.json({ reply: text });
    } catch (error: any) {
      handleError(res, error, 'AI Chat/Coach failed');
    }
  });

  // VITE DEVELOPMENT OR STATIC PRODUCTION MIDDLEWARE
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StudyFlow] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
