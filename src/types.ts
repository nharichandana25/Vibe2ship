/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO date-time
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'doing' | 'done';
  pomodorosSpent: number;
  pomodorosEstimated: number;
  studyRelated: boolean;
  category: string; // e.g. "General", "Math", "Science", "Exam prep"
  createdAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  box: number; // 1 to 5 for Leitner active recall
  nextReviewDate: string; // ISO date
  lastResult?: 'correct' | 'incorrect' | 'new';
}

export interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  cards: Flashcard[];
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
  flashcardsGenerated: boolean;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedDays: string[]; // ['YYYY-MM-DD']
  createdAt: string;
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  durationMinutes: number;
  timestamp: string;
  completed: boolean;
}

export interface ProductivityRecommendation {
  id: string;
  type: 'prioritization' | 'scheduling' | 'motivation' | 'warning';
  title: string;
  description: string;
  actionLabel?: string;
  suggestedAction?: string; // e.g., JSON parameters for action
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
