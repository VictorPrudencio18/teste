
// Removed: import { User as FirebaseUser } from 'firebase/auth';
// export type { FirebaseUser }; // Re-export FirebaseUser for convenience

export interface UserProfile {
  uid?: string; // Firebase UID - Now optional
  email?: string | null; // Firebase email - Now optional
  targetRole: string; 
  dailyStudyHours: number;
  studyDays: string[]; 
  studyNotes?: string;
}

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  // User interaction state will be stored in AnalyzedTopic.userInteractions
  // New fields for enhanced tracking:
  attempts?: number; // Number of times the user tried to answer
}

export type FlashcardSelfAssessment = 'unseen' | 'easy' | 'medium' | 'hard';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  // isFlipped is a UI state, selfAssessment will be stored
  // New fields for enhanced tracking:
  reviewCount?: number;
  lastReviewedTimestamp?: number;
}

export interface DiscursiveQuestion {
  id: string;
  questionText: string;
  modelAnswerOutline?: string; 
  // isOutlineVisible is a UI state
}

export interface DeeperUnderstandingContent {
  type: 'analogy' | 'alternative_explanation' | 'foundational_concepts' | 'general_advice';
  title: string;
  content: string; // Markdown formatted
  promptUsed?: string; // For debugging
}

export interface TopicContent {
  summary?: string;
  questions?: Question[]; 
  flashcards?: Flashcard[]; 
  discursiveQuestions?: DiscursiveQuestion[];
  deeperUnderstanding?: DeeperUnderstandingContent; // New: For AI-generated extra help
}

export interface UserInteractions {
  questions?: { 
    [questionId: string]: { 
      userAnswerIndex?: number; 
      isRevealed?: boolean; 
      attempts?: number; // User's attempts for this question
      isCorrect?: boolean; // Was the revealed answer correct?
    } 
  };
  flashcards?: { 
    [flashcardId: string]: { 
      selfAssessment: FlashcardSelfAssessment;
      reviewCount?: number;
      lastReviewedTimestamp?: number;
    } 
  };
   // No specific interactions for discursive questions or summary beyond viewing yet.
}

export interface AnalyzedTopic {
  id: string;
  name: string;
  status: 'Pendente' | 'Estudando' | 'Concluído';
  content?: TopicContent; 
  userInteractions?: UserInteractions; 
  isLoadingContent?: boolean; 
  errorContent?: string; 
  isLoadingDeeperUnderstanding?: boolean; // New: for the "Preciso de mais ajuda" feature
  errorDeeperUnderstanding?: string; // New: for errors in "Preciso de mais ajuda"
}

export interface AnalyzedSubject {
  id: string;
  name: string;
  topics: AnalyzedTopic[];
}

export interface EditalAnalysisData {
  subjects: AnalyzedSubject[];
  clarificationQuestionsFromAI?: string[]; 
  error?: string; 
}

export enum AppPhase {
  // LOGIN and REGISTER removed as Firebase Auth is removed
  UPLOAD_PDF_ONLY = 'UPLOAD_PDF_ONLY',
  ROLE_SELECTION = 'ROLE_SELECTION',
  USER_PREFERENCES = 'USER_PREFERENCES',
  GENERATING_PLAN = 'GENERATING_PLAN',
  VIEW_PLAN = 'VIEW_PLAN',
  STUDY_TOPIC = 'STUDY_TOPIC',
  AI_COACH = 'AI_COACH',
  DASHBOARD = 'DASHBOARD', 
}

export enum ContentType {
  SUMMARY = 'summary',
  QUESTIONS = 'questions',
  FLASHCARDS = 'flashcards',
  DISCURSIVE_QUESTIONS = 'discursive_questions',
  DEEPER_UNDERSTANDING = 'deeperUnderstanding', // New content type
}

// Types for AI Coach
export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  error?: boolean; 
}

export interface AISuggestion {
  subjectId: string;
  topicId: string;
  subjectName: string;
  topicName: string;
  reason: string; 
}

// For Dashboard
export interface DashboardData {
  totalTopics: number;
  completedTopics: number;
  pendingTopics: number;
  studyingTopics: number;
  completionPercentage: number;
  subjectProgress: Array<{
    id: string;
    name: string;
    totalTopics: number;
    completedTopics: number;
    percentage: number;
  }>;
  recentActivity?: AnalyzedTopic[]; 
}
